CREATE POLICY "boss own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'boss' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "boss own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'boss' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "boss own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'boss' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "boss own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'boss' AND auth.uid()::text = (storage.foldername(name))[1]);