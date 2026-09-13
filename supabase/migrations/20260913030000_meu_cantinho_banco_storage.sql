-- Meu Cantinho: dados no Postgres e arquivos no Supabase Storage.
create table if not exists public.cantinho_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  emoji text not null default '✨',
  descricao text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cantinho_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid not null references public.cantinho_areas(id) on delete cascade,
  tipo text not null check (tipo in ('foto','video','musica')),
  origem text not null default 'upload' check (origem in ('upload','youtube')),
  storage_path text,
  url text,
  titulo text not null default '',
  legenda text not null default '',
  significado text not null default '',
  mime_type text,
  tamanho_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cantinho_media_source_check check (
    (origem = 'upload' and storage_path is not null and url is null)
    or (origem = 'youtube' and url is not null and storage_path is null)
  )
);

create index if not exists cantinho_areas_user_idx on public.cantinho_areas(user_id);
create index if not exists cantinho_media_user_idx on public.cantinho_media(user_id);
create index if not exists cantinho_media_area_idx on public.cantinho_media(area_id);

alter table public.cantinho_areas enable row level security;
alter table public.cantinho_media enable row level security;

drop policy if exists "cantinho areas own select" on public.cantinho_areas;
drop policy if exists "cantinho areas own insert" on public.cantinho_areas;
drop policy if exists "cantinho areas own update" on public.cantinho_areas;
drop policy if exists "cantinho areas own delete" on public.cantinho_areas;
create policy "cantinho areas own select" on public.cantinho_areas for select using (auth.uid() = user_id);
create policy "cantinho areas own insert" on public.cantinho_areas for insert with check (auth.uid() = user_id);
create policy "cantinho areas own update" on public.cantinho_areas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cantinho areas own delete" on public.cantinho_areas for delete using (auth.uid() = user_id);

drop policy if exists "cantinho media own select" on public.cantinho_media;
drop policy if exists "cantinho media own insert" on public.cantinho_media;
drop policy if exists "cantinho media own update" on public.cantinho_media;
drop policy if exists "cantinho media own delete" on public.cantinho_media;
create policy "cantinho media own select" on public.cantinho_media for select using (auth.uid() = user_id);
create policy "cantinho media own insert" on public.cantinho_media for insert with check (auth.uid() = user_id);
create policy "cantinho media own update" on public.cantinho_media for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cantinho media own delete" on public.cantinho_media for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('cantinho-media', 'cantinho-media', false)
on conflict (id) do nothing;

drop policy if exists "cantinho storage select own" on storage.objects;
drop policy if exists "cantinho storage insert own" on storage.objects;
drop policy if exists "cantinho storage update own" on storage.objects;
drop policy if exists "cantinho storage delete own" on storage.objects;
create policy "cantinho storage select own" on storage.objects for select to authenticated using (bucket_id = 'cantinho-media' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "cantinho storage insert own" on storage.objects for insert to authenticated with check (bucket_id = 'cantinho-media' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "cantinho storage update own" on storage.objects for update to authenticated using (bucket_id = 'cantinho-media' and (storage.foldername(name))[1] = (auth.uid())::text) with check (bucket_id = 'cantinho-media' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "cantinho storage delete own" on storage.objects for delete to authenticated using (bucket_id = 'cantinho-media' and (storage.foldername(name))[1] = (auth.uid())::text);
