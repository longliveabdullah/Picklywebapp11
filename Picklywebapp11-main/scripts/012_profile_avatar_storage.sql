-- ============================================================
-- 012_profile_avatar_storage.sql
-- Public bucket `profile-pictures` + avatar_url on user_profiles
-- Run in Supabase SQL editor (Storage bucket may already exist).
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN public.user_profiles.avatar_url IS 'Public URL of profile photo in storage bucket profile-pictures';

-- Ensure public bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- RLS on storage.objects (idempotent policy names)
DROP POLICY IF EXISTS "profile_pictures_public_read" ON storage.objects;
CREATE POLICY "profile_pictures_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "profile_pictures_owner_insert" ON storage.objects;
CREATE POLICY "profile_pictures_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_pictures_owner_update" ON storage.objects;
CREATE POLICY "profile_pictures_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_pictures_owner_delete" ON storage.objects;
CREATE POLICY "profile_pictures_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
