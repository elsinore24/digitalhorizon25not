-- Update bucket configuration
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 52428800,  -- 50MB limit
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3']
WHERE id = 'narration-audio';

-- Ensure public access policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public Access to narration-audio'
  ) THEN
    CREATE POLICY "Public Access to narration-audio"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'narration-audio');
  END IF;
END
$$;
