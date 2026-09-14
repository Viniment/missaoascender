create table if not exists public.editor_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  conteudo_html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editor_templates_nome_check check (char_length(trim(nome)) between 1 and 80)
);

create index if not exists editor_templates_user_id_idx
  on public.editor_templates(user_id, updated_at desc);

create unique index if not exists editor_templates_user_nome_unique
  on public.editor_templates(user_id, lower(trim(nome)));

alter table public.editor_templates enable row level security;

drop policy if exists "editor_templates_select_own" on public.editor_templates;
create policy "editor_templates_select_own"
  on public.editor_templates for select
  using (auth.uid() = user_id);

drop policy if exists "editor_templates_insert_own" on public.editor_templates;
create policy "editor_templates_insert_own"
  on public.editor_templates for insert
  with check (auth.uid() = user_id);

drop policy if exists "editor_templates_update_own" on public.editor_templates;
create policy "editor_templates_update_own"
  on public.editor_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "editor_templates_delete_own" on public.editor_templates;
create policy "editor_templates_delete_own"
  on public.editor_templates for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.editor_templates to authenticated;

create or replace function public.editor_templates_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists editor_templates_updated_at on public.editor_templates;
create trigger editor_templates_updated_at
before update on public.editor_templates
for each row execute function public.editor_templates_set_updated_at();
