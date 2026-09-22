create table if not exists public.pote_biscoitos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text not null,
  created_at timestamptz not null default now()
);

create index if not exists pote_biscoitos_user_created_idx
  on public.pote_biscoitos (user_id, created_at desc);

alter table public.pote_biscoitos enable row level security;

drop policy if exists "Users can view own cookie jar" on public.pote_biscoitos;
create policy "Users can view own cookie jar"
  on public.pote_biscoitos for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own cookie jar" on public.pote_biscoitos;
create policy "Users can create own cookie jar"
  on public.pote_biscoitos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cookie jar" on public.pote_biscoitos;
create policy "Users can update own cookie jar"
  on public.pote_biscoitos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cookie jar" on public.pote_biscoitos;
create policy "Users can delete own cookie jar"
  on public.pote_biscoitos for delete
  using (auth.uid() = user_id);
