create table if not exists public.cantinho_diarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid not null references public.cantinho_areas(id) on delete cascade,
  titulo text not null default '',
  conteudo text not null default '',
  data date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cantinho_diarios_user_area_idx on public.cantinho_diarios(user_id, area_id, data desc, created_at desc);

alter table public.cantinho_diarios enable row level security;

drop policy if exists "cantinho_diarios_select_own" on public.cantinho_diarios;
drop policy if exists "cantinho_diarios_insert_own" on public.cantinho_diarios;
drop policy if exists "cantinho_diarios_update_own" on public.cantinho_diarios;
drop policy if exists "cantinho_diarios_delete_own" on public.cantinho_diarios;

create policy "cantinho_diarios_select_own" on public.cantinho_diarios for select using (auth.uid() = user_id);
create policy "cantinho_diarios_insert_own" on public.cantinho_diarios for insert with check (auth.uid() = user_id);
create policy "cantinho_diarios_update_own" on public.cantinho_diarios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cantinho_diarios_delete_own" on public.cantinho_diarios for delete using (auth.uid() = user_id);

create or replace function public.set_cantinho_diarios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cantinho_diarios_updated_at on public.cantinho_diarios;
create trigger cantinho_diarios_updated_at
before update on public.cantinho_diarios
for each row execute function public.set_cantinho_diarios_updated_at();
