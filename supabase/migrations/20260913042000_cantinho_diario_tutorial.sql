create table if not exists public.cantinho_diario_preferencias (
  user_id uuid primary key references public.users(id) on delete cascade,
  tutorial_visto boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.cantinho_diario_preferencias enable row level security;

drop policy if exists "cantinho diario preferencias select own" on public.cantinho_diario_preferencias;
create policy "cantinho diario preferencias select own"
  on public.cantinho_diario_preferencias for select
  using (auth.uid() = user_id);

drop policy if exists "cantinho diario preferencias insert own" on public.cantinho_diario_preferencias;
create policy "cantinho diario preferencias insert own"
  on public.cantinho_diario_preferencias for insert
  with check (auth.uid() = user_id);

drop policy if exists "cantinho diario preferencias update own" on public.cantinho_diario_preferencias;
create policy "cantinho diario preferencias update own"
  on public.cantinho_diario_preferencias for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.marcar_cantinho_diario_tutorial_visto()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  insert into public.cantinho_diario_preferencias (user_id, tutorial_visto)
  values (auth.uid(), true)
  on conflict (user_id) do update
    set tutorial_visto = true,
        updated_at = now();

  return true;
end;
$$;

grant execute on function public.marcar_cantinho_diario_tutorial_visto() to authenticated;
