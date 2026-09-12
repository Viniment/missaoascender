alter table public.users
  add column if not exists agua_meta_ml integer not null default 4000,
  add column if not exists jejum_reset_at timestamptz,
  add column if not exists agua_reset_at timestamptz;

alter table public.users
  drop constraint if exists users_agua_meta_ml_check;

alter table public.users
  add constraint users_agua_meta_ml_check check (agua_meta_ml > 0 and agua_meta_ml <= 1000000);
