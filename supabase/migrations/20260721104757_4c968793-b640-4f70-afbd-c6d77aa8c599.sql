
CREATE TABLE public.fissuras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  intensidade_inicial INT NOT NULL,
  intensidade_final INT,
  emocao TEXT,
  contexto TEXT,
  desejo TEXT,
  duracao_relatada TEXT,
  tipo_detectado TEXT,
  protocolo JSONB,
  missao_imediata TEXT,
  missao_concluida BOOLEAN NOT NULL DEFAULT false,
  resolvida BOOLEAN NOT NULL DEFAULT false,
  tecnicas_usadas TEXT[] DEFAULT '{}'::text[]
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fissuras TO authenticated;
GRANT ALL ON public.fissuras TO service_role;

ALTER TABLE public.fissuras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_fissuras_select" ON public.fissuras FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_fissuras_insert" ON public.fissuras FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_fissuras_update" ON public.fissuras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_fissuras_delete" ON public.fissuras FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX fissuras_user_idx ON public.fissuras(user_id, criado_em DESC);
