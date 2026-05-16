-- ============================================================
-- 011_user_bio.sql
-- Short profile bio (shown under name on profile)
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS bio text;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_bio_length;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_bio_length
  CHECK (bio IS NULL OR char_length(trim(bio)) BETWEEN 1 AND 160);

COMMENT ON COLUMN public.user_profiles.bio IS 'User-written profile bio (profile header, share card)';
