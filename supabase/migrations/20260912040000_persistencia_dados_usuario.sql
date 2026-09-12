-- Persistência central para estados que antes ficavam somente no navegador.
-- O banco passa a ser a fonte de verdade; cada chave pertence exclusivamente ao usuário.

create table if not exists public.user_app_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chave text not null,
  valor jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chave)
);

create index if not exists user_app_state_user_chave on public.user_app_state(user_id, chave);

grant select, insert, update, delete on public.user_app_state to authenticated;
grant all on public.user_app_state to service_role;

alter table public.user_app_state enable row level security;

drop policy if exists "own app state" on public.user_app_state;
create policy "own app state" on public.user_app_state
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists user_app_state_updated_at on public.user_app_state;
create trigger user_app_state_updated_at
before update on public.user_app_state
for each row execute function public.update_updated_at_column();

comment on table public.user_app_state is 'Estado persistente do aplicativo por usuário. Substitui armazenamento local como fonte de verdade.';
comment on column public.user_app_state.chave is 'Identificador lógico do estado, por exemplo jejum_sessoes, jejum_ativo, agua_dia:YYYY-MM-DD, urge_surfing e projetos.';
comment on column public.user_app_state.valor is 'Estado serializado em JSONB.';

notify pgrst, 'reload schema';
