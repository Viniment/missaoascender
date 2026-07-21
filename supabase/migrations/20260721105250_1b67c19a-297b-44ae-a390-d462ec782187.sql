CREATE TABLE public.pensamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  situacao TEXT NOT NULL,
  pensamento_automatico TEXT NOT NULL,
  emocao TEXT,
  intensidade_emocao INTEGER,
  distorcoes TEXT[] DEFAULT '{}',
  evidencias_favor TEXT,
  evidencias_contra TEXT,
  pensamento_alternativo TEXT,
  intensidade_final INTEGER,
  ai_analise JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pensamentos TO authenticated;
GRANT ALL ON public.pensamentos TO service_role;

ALTER TABLE public.pensamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pensamentos" ON public.pensamentos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_pensamentos_updated_at BEFORE UPDATE ON public.pensamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.urge_surfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  desejo TEXT,
  intensidade_inicial INTEGER NOT NULL,
  intensidade_final INTEGER,
  duracao_seg INTEGER NOT NULL DEFAULT 0,
  ciclos_respiracao INTEGER NOT NULL DEFAULT 0,
  cedeu BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.urge_surfs TO authenticated;
GRANT ALL ON public.urge_surfs TO service_role;

ALTER TABLE public.urge_surfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own urge_surfs" ON public.urge_surfs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);