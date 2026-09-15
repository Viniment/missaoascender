-- =========================================================
-- JEJUM: histórico e jejum ativo no PostgreSQL
-- =========================================================
create table if not exists public.jejum_sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz not null,
  minutos integer not null check (minutos >= 0),
  xp integer not null default 0,
  ouro integer not null default 0,
  vida integer not null default 0,
  autodominio integer not null default 0,
  criado_em timestamptz not null default now()
);

create index if not exists jejum_sessoes_user_inicio_idx
  on public.jejum_sessoes(user_id, inicio desc);

alter table public.jejum_sessoes enable row level security;

drop policy if exists "jejum_sessoes_select_own" on public.jejum_sessoes;
create policy "jejum_sessoes_select_own"
  on public.jejum_sessoes for select
  using (auth.uid() = user_id);

drop policy if exists "jejum_sessoes_insert_own" on public.jejum_sessoes;
create policy "jejum_sessoes_insert_own"
  on public.jejum_sessoes for insert
  with check (auth.uid() = user_id);

grant select, insert on public.jejum_sessoes to authenticated;

create table if not exists public.jejum_ativo (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inicio timestamptz not null,
  atualizado_em timestamptz not null default now()
);

alter table public.jejum_ativo enable row level security;

drop policy if exists "jejum_ativo_select_own" on public.jejum_ativo;
create policy "jejum_ativo_select_own"
  on public.jejum_ativo for select
  using (auth.uid() = user_id);

drop policy if exists "jejum_ativo_insert_own" on public.jejum_ativo;
create policy "jejum_ativo_insert_own"
  on public.jejum_ativo for insert
  with check (auth.uid() = user_id);

drop policy if exists "jejum_ativo_update_own" on public.jejum_ativo;
create policy "jejum_ativo_update_own"
  on public.jejum_ativo for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "jejum_ativo_delete_own" on public.jejum_ativo;
create policy "jejum_ativo_delete_own"
  on public.jejum_ativo for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.jejum_ativo to authenticated;
