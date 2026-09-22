create table if not exists public.espelhos_responsabilidade (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'Outro',
  aconteceu text not null,
  fiz text not null,
  buscava text not null,
  sob_controle text not null,
  proxima_vez text not null,
  pote_biscoito_id uuid references public.pote_biscoitos(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists espelhos_responsabilidade_user_created_idx
  on public.espelhos_responsabilidade (user_id, created_at desc);

alter table public.espelhos_responsabilidade enable row level security;

drop policy if exists "Usuário pode ver seus espelhos" on public.espelhos_responsabilidade;
create policy "Usuário pode ver seus espelhos"
  on public.espelhos_responsabilidade for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário pode criar seus espelhos" on public.espelhos_responsabilidade;
create policy "Usuário pode criar seus espelhos"
  on public.espelhos_responsabilidade for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário pode editar seus espelhos" on public.espelhos_responsabilidade;
create policy "Usuário pode editar seus espelhos"
  on public.espelhos_responsabilidade for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário pode excluir seus espelhos" on public.espelhos_responsabilidade;
create policy "Usuário pode excluir seus espelhos"
  on public.espelhos_responsabilidade for delete
  using (auth.uid() = user_id);
