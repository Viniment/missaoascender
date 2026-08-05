CREATE TABLE public.estudo_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  emoji text NOT NULL DEFAULT '📚',
  descricao text,
  banner_url text,
  banner_preset text,
  banner_pos numeric NOT NULL DEFAULT 50,
  banner_zoom numeric NOT NULL DEFAULT 100,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estudo_categorias TO authenticated;
GRANT ALL ON public.estudo_categorias TO service_role;
ALTER TABLE public.estudo_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own estudo_categorias" ON public.estudo_categorias FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.estudo_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  categoria_id uuid REFERENCES public.estudo_categorias(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT 'Sem título',
  conteudo jsonb,
  conteudo_texto text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  favorita boolean NOT NULL DEFAULT false,
  fixada boolean NOT NULL DEFAULT false,
  na_lixeira boolean NOT NULL DEFAULT false,
  excluida_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estudo_notas TO authenticated;
GRANT ALL ON public.estudo_notas TO service_role;
ALTER TABLE public.estudo_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own estudo_notas" ON public.estudo_notas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX estudo_notas_user_idx ON public.estudo_notas (user_id, categoria_id);

CREATE TRIGGER estudo_categorias_updated_at BEFORE UPDATE ON public.estudo_categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER estudo_notas_updated_at BEFORE UPDATE ON public.estudo_notas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();