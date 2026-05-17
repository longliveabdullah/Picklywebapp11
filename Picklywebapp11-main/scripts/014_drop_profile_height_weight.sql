-- 014_drop_profile_height_weight.sql
-- Drops unused height/weight columns from user_profiles.
-- Run in Supabase SQL editor after deploying app code that no longer reads/writes these fields.

ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS height,
  DROP COLUMN IF EXISTS weight;

UPDATE public.scan_history
SET user_profile_snapshot = user_profile_snapshot - 'height' - 'weight'
WHERE user_profile_snapshot ?| array['height', 'weight'];
