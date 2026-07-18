ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_equipado jsonb NOT NULL DEFAULT '{"base":"warrior","hat":null,"armor":null,"aura":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS itens_desbloqueados text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS titulo text;