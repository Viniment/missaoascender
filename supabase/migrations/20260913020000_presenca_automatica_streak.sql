-- Presença diária automática: abrir o app registra a presença do usuário.
-- A chave única por usuário/dia torna a operação idempotente: abrir várias vezes
-- no mesmo dia nunca cria registros duplicados nem aumenta o streak indevidamente.

create table if not exists public.presencas_diarias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  data date not null,
  criado_em timestamptz not null default now(),
  unique (user_id, data)
);

create index if not exists presencas_diarias_user_data_idx
  on public.presencas_diarias (user_id, data desc);

alter table public.presencas_diarias enable row level security;

drop policy if exists "Usuário pode ver próprias presenças" on public.presencas_diarias;
create policy "Usuário pode ver próprias presenças"
  on public.presencas_diarias for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário pode registrar própria presença" on public.presencas_diarias;
create policy "Usuário pode registrar própria presença"
  on public.presencas_diarias for insert
  with check (auth.uid() = user_id);

create or replace function public.registrar_presenca_diaria(p_data date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_streak integer := 0;
  v_dia date;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- INSERT idempotente: se o usuário já abriu o app hoje, não altera nada.
  insert into public.presencas_diarias (user_id, data)
  values (v_user_id, p_data)
  on conflict (user_id, data) do nothing;

  -- O streak é calculado exclusivamente pelos dias de presença consecutivos.
  v_dia := p_data;
  loop
    exit when not exists (
      select 1
      from public.presencas_diarias
      where user_id = v_user_id and data = v_dia
    );
    v_streak := v_streak + 1;
    v_dia := v_dia - 1;
  end loop;

  update public.users
  set streak_atual = v_streak
  where id = v_user_id;

  return v_streak;
end;
$$;

revoke all on function public.registrar_presenca_diaria(date) from public;
grant execute on function public.registrar_presenca_diaria(date) to authenticated;
