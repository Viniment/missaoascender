create table if not exists public.espelhos_autotraicao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'Outro',
  promessa text not null,
  sabia text not null,
  instante text not null,
  negociacao text not null,
  verdade text not null,
  distancia text not null,
  sonhos text not null,
  preco text not null,
  futuro text not null,
  arrependimento text not null,
  reconquista text not null,
  pacto text not null,
  created_at timestamptz not null default now()
);

create index if not exists espelhos_autotraicao_user_created_idx
  on public.espelhos_autotraicao (user_id, created_at desc);

alter table public.espelhos_autotraicao enable row level security;

drop policy if exists "Usuário pode ver seus espelhos de autotraição" on public.espelhos_autotraicao;
create policy "Usuário pode ver seus espelhos de autotraição"
  on public.espelhos_autotraicao for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário pode criar seus espelhos de autotraição" on public.espelhos_autotraicao;
create policy "Usuário pode criar seus espelhos de autotraição"
  on public.espelhos_autotraicao for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário pode editar seus espelhos de autotraição" on public.espelhos_autotraicao;
create policy "Usuário pode editar seus espelhos de autotraição"
  on public.espelhos_autotraicao for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário pode excluir seus espelhos de autotraição" on public.espelhos_autotraicao;
create policy "Usuário pode excluir seus espelhos de autotraição"
  on public.espelhos_autotraicao for delete
  using (auth.uid() = user_id);
