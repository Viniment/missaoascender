CREATE POLICY "estudos own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'estudos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "estudos own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'estudos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "estudos own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'estudos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "estudos own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'estudos' AND auth.uid()::text = (storage.foldername(name))[1]);