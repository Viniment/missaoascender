
-- Drop old
DROP TABLE IF EXISTS public.player_data CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Reusable updated_at trigger fn (already exists but recreate to be safe)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ users ============
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Herói',
  nivel INT NOT NULL DEFAULT 1,
  xp_atual INT NOT NULL DEFAULT 0,
  xp_proximo_nivel INT NOT NULL DEFAULT 100,
  ouro INT NOT NULL DEFAULT 0,
  vida_atual INT NOT NULL DEFAULT 100,
  vida_max INT NOT NULL DEFAULT 100,
  streak_atual INT NOT NULL DEFAULT 0,
  ultimo_bau_data DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own row" ON public.users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ onboarding_respostas ============
CREATE TABLE public.onboarding_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sonho TEXT,
  desculpas TEXT[] DEFAULT '{}',
  funcao_protetora TEXT,
  custo_procrastinacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_respostas TO authenticated;
GRANT ALL ON public.onboarding_respostas TO service_role;
ALTER TABLE public.onboarding_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.onboarding_respostas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER onb_updated_at BEFORE UPDATE ON public.onboarding_respostas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ inimigo ============
CREATE TABLE public.inimigo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  avatar_config JSONB DEFAULT '{}'::jsonb,
  hp_max INT NOT NULL DEFAULT 100,
  hp_atual INT NOT NULL DEFAULT 100,
  mentiras TEXT[] NOT NULL DEFAULT '{}',
  gatilho TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  derrotado_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inimigo_user_ativo ON public.inimigo(user_id, ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inimigo TO authenticated;
GRANT ALL ON public.inimigo TO service_role;
ALTER TABLE public.inimigo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.inimigo FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER inimigo_updated_at BEFORE UPDATE ON public.inimigo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ habitos ============
CREATE TABLE public.habitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('positivo','negativo')),
  peso_dano_cura INT NOT NULL DEFAULT 10,
  peso_xp INT NOT NULL DEFAULT 10,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX habitos_user ON public.habitos(user_id, ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habitos TO authenticated;
GRANT ALL ON public.habitos TO service_role;
ALTER TABLE public.habitos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.habitos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER habitos_updated_at BEFORE UPDATE ON public.habitos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ habito_logs ============
CREATE TABLE public.habito_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habito_id UUID NOT NULL REFERENCES public.habitos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  completado BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habito_id, data)
);
CREATE INDEX habito_logs_user_data ON public.habito_logs(user_id, data);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habito_logs TO authenticated;
GRANT ALL ON public.habito_logs TO service_role;
ALTER TABLE public.habito_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.habito_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ mini_vitorias ============
CREATE TABLE public.mini_vitorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  recompensa_ouro INT NOT NULL DEFAULT 10,
  recompensa_xp INT NOT NULL DEFAULT 20,
  recompensa_vida INT NOT NULL DEFAULT 10,
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mv_user ON public.mini_vitorias(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mini_vitorias TO authenticated;
GRANT ALL ON public.mini_vitorias TO service_role;
ALTER TABLE public.mini_vitorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.mini_vitorias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER mv_updated_at BEFORE UPDATE ON public.mini_vitorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ conquistas ============
CREATE TABLE public.conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT,
  descricao TEXT,
  desbloqueada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conquistas TO authenticated;
GRANT ALL ON public.conquistas TO service_role;
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.conquistas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ transacoes_ouro ============
CREATE TABLE public.transacoes_ouro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor INT NOT NULL,
  origem TEXT NOT NULL CHECK (origem IN ('bau_diario','mini_vitoria','habito','outro')),
  descricao TEXT,
  data TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX to_user ON public.transacoes_ouro(user_id, data DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transacoes_ouro TO authenticated;
GRANT ALL ON public.transacoes_ouro TO service_role;
ALTER TABLE public.transacoes_ouro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.transacoes_ouro FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ signup trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'display_name', 'Herói'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill for existing auth users
INSERT INTO public.users (id, nome)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', 'Herói') FROM auth.users
ON CONFLICT (id) DO NOTHING;
