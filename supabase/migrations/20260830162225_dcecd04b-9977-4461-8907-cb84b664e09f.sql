ALTER TABLE public.pensamentos
  ADD COLUMN IF NOT EXISTS emocoes TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sem_alternativo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS distanciamento_texto TEXT,
  ADD COLUMN IF NOT EXISTS distanciamento_status TEXT,
  ADD COLUMN IF NOT EXISTS continuum_valor INTEGER,
  ADD COLUMN IF NOT EXISTS continuum_zero TEXT,
  ADD COLUMN IF NOT EXISTS continuum_cem TEXT,
  ADD COLUMN IF NOT EXISTS continuum_motivo TEXT,
  ADD COLUMN IF NOT EXISTS comportamento TEXT,
  ADD COLUMN IF NOT EXISTS consequencia TEXT;