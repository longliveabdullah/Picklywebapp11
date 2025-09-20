-- Add new profile fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS skin_tone TEXT,
ADD COLUMN IF NOT EXISTS skin_concerns TEXT[],
ADD COLUMN IF NOT EXISTS hair_conditions TEXT[];

-- Update the existing constraint to include new skin_tone values
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_skin_tone_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_skin_tone_check 
CHECK (skin_tone IS NULL OR skin_tone IN ('fair', 'light', 'medium', 'tan', 'dark', 'deep'));
