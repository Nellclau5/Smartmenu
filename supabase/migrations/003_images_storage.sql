-- Images plats + bucket Supabase Storage

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'smart-menu-images',
  'smart-menu-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read smart menu images" ON storage.objects;
CREATE POLICY "Public read smart menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'smart-menu-images');

DROP POLICY IF EXISTS "Owners manage restaurant images" ON storage.objects;
CREATE POLICY "Owners manage restaurant images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'smart-menu-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM restaurants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'smart-menu-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM restaurants WHERE user_id = auth.uid()
    )
  );
