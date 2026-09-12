alter table if exists public.users
  add column if not exists agua_meta_ml integer,
  add column if not exists agua_reset_at timestamptz,
  add column if not exists jejum_reset_at timestamptz;

comment on column public.users.agua_meta_ml is 'Meta diaria de hidratacao personalizada por usuario, em ml.';
comment on column public.users.agua_reset_at is 'Marcador administrativo para limpar o rastreador local de agua do usuario.';
comment on column public.users.jejum_reset_at is 'Marcador administrativo para limpar o historico local de jejum do usuario.';

notify pgrst, 'reload schema';