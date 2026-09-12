create table if not exists public.user_app_state (
  user_id uuid not null references public.users(id) on delete cascade,
  chave text not null,
  valor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.user_app_state enable row level security;

drop policy if exists "users manage own app state" on public.user_app_state;
create policy "users manage own app state"
  on public.user_app_state
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_user_app_state_user_id
  on public.user_app_state(user_id);

create or replace function public.set_user_app_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_app_state_updated_at on public.user_app_state;
create trigger trg_user_app_state_updated_at
before update on public.user_app_state
for each row
execute function public.set_user_app_state_updated_at();

notify pgrst, 'reload schema';
