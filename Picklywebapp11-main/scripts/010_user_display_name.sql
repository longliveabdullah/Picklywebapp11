-- ============================================================
-- 010_user_display_name.sql
-- Persist user-chosen display name on profile (cross-device SSOT)
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS display_name text;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_display_name_length;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_display_name_length
  CHECK (display_name IS NULL OR char_length(trim(display_name)) BETWEEN 1 AND 50);

CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name
  ON public.user_profiles (user_id)
  WHERE display_name IS NOT NULL;

COMMENT ON COLUMN public.user_profiles.display_name IS 'User-visible name (profile, home, social, AI prompts)';
