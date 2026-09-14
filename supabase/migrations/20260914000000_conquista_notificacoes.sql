create table if not exists public.conquista_notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conquista_tipo text not null,
  recebido_em timestamptz not null default now(),
  unique (user_id, conquista_tipo)
);

create index if not exists conquista_notificacoes_user_idx
  on public.conquista_notificacoes(user_id, recebido_em desc);

alter table public.conquista_notificacoes enable row level security;

drop policy if exists "conquista_notificacoes_select_own" on public.conquista_notificacoes;
create policy "conquista_notificacoes_select_own"
  on public.conquista_notificacoes for select
  using (auth.uid() = user_id);

drop policy if exists "conquista_notificacoes_insert_own" on public.conquista_notificacoes;
create policy "conquista_notificacoes_insert_own"
  on public.conquista_notificacoes for insert
  with check (auth.uid() = user_id);

grant select, insert on public.conquista_notificacoes to authenticated;

-- Conquistas que já existiam antes deste sistema não são "novas".
insert into public.conquista_notificacoes (user_id, conquista_tipo)
select user_id, tipo
from public.conquistas
where tipo is not null
on conflict (user_id, conquista_tipo) do nothing;

create or replace function public.registrar_recebimento_conquista(p_conquista_tipo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public.conquista_notificacoes (user_id, conquista_tipo)
  values (auth.uid(), p_conquista_tipo)
  on conflict (user_id, conquista_tipo) do nothing;

  return found;
end;
$$;

grant execute on function public.registrar_recebimento_conquista(text) to authenticated;
