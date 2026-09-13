create table if not exists public.carta_enfrentamento_leituras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  data date not null default current_date,
  quantidade integer not null default 0 check (quantidade >= 0 and quantidade <= 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

create index if not exists carta_enfrentamento_leituras_user_data_idx
  on public.carta_enfrentamento_leituras(user_id, data);

alter table public.carta_enfrentamento_leituras enable row level security;

drop policy if exists "carta leituras select own" on public.carta_enfrentamento_leituras;
create policy "carta leituras select own"
  on public.carta_enfrentamento_leituras
  for select
  using (auth.uid() = user_id);

drop policy if exists "carta leituras insert own" on public.carta_enfrentamento_leituras;
create policy "carta leituras insert own"
  on public.carta_enfrentamento_leituras
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "carta leituras update own" on public.carta_enfrentamento_leituras;
create policy "carta leituras update own"
  on public.carta_enfrentamento_leituras
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.registrar_leitura_carta_enfrentamento(p_data date default current_date)
returns table (quantidade integer, premiada boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_quantidade integer;
  v_premiada boolean := false;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.carta_enfrentamento_leituras (user_id, data, quantidade)
  values (v_user, p_data, 0)
  on conflict (user_id, data) do nothing;

  select cel.quantidade
    into v_quantidade
    from public.carta_enfrentamento_leituras cel
   where cel.user_id = v_user
     and cel.data = p_data
   for update;

  if v_quantidade < 3 then
    v_quantidade := v_quantidade + 1;
    v_premiada := true;
    update public.carta_enfrentamento_leituras
       set quantidade = v_quantidade,
           updated_at = now()
     where user_id = v_user
       and data = p_data;
  end if;

  return query select v_quantidade, v_premiada;
end;
$$;

grant execute on function public.registrar_leitura_carta_enfrentamento(date) to authenticated;
