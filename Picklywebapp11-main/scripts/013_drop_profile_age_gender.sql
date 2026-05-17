-- 013_drop_profile_age_gender.sql
-- Drops unused age/gender columns from user_profiles.
-- Run in Supabase SQL editor after deploying app code that no longer reads/writes these fields.

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_gender_check;

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS gender;

-- Optional: remove age/gender from historical scan snapshots
UPDATE public.scan_history
SET user_profile_snapshot = user_profile_snapshot - 'age' - 'gender'
WHERE user_profile_snapshot ?| array['age', 'gender'];
