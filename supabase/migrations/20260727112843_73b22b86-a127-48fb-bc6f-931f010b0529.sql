
CREATE TABLE public.trataka_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  duracao_seg integer NOT NULL DEFAULT 0,
  duracao_alvo_seg integer NOT NULL DEFAULT 0,
  modo text NOT NULL DEFAULT 'silencio',
  som_ambiente text,
  concluida boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trataka_sessoes TO authenticated;
GRANT ALL ON public.trataka_sessoes TO service_role;

ALTER TABLE public.trataka_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_trataka_all" ON public.trataka_sessoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX trataka_sessoes_user_data_idx ON public.trataka_sessoes (user_id, criado_em DESC);
