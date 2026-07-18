
CREATE POLICY "admins select any user" ON public.users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins select any inimigo" ON public.inimigo FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update any inimigo" ON public.inimigo FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete any inimigo" ON public.inimigo FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins all conquistas" ON public.conquistas FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins all habito_logs" ON public.habito_logs FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins all transacoes_ouro" ON public.transacoes_ouro FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
