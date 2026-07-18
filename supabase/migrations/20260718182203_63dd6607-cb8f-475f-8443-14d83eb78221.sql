
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info',
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos autenticados leem avisos ativos" ON public.avisos FOR SELECT TO authenticated USING (ativo = true);
CREATE POLICY "Admins gerenciam avisos" ON public.avisos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.avisos_lidos (
  aviso_id UUID NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (aviso_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.avisos_lidos TO authenticated;
GRANT ALL ON public.avisos_lidos TO service_role;
ALTER TABLE public.avisos_lidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário gerencia suas próprias leituras" ON public.avisos_lidos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
