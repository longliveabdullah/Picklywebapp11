-- Pickly backend ship: onboarding prefs persistence, analysis payload, lightweight scan decisions memory
-- Run in Supabase SQL editor after verifying table names match your project.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS vegan boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hair_type text,
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS categories text[],
  ADD COLUMN IF NOT EXISTS shopping_style text,
  ADD COLUMN IF NOT EXISTS purchase_priorities text[];

COMMENT ON COLUMN user_profiles.categories IS 'Onboarding product categories';
COMMENT ON COLUMN user_profiles.shopping_style IS 'e.g. budget, mid_range, luxury';
COMMENT ON COLUMN user_profiles.purchase_priorities IS 'Ranked priorities from onboarding';

ALTER TABLE scan_history
  ADD COLUMN IF NOT EXISTS analysis_json jsonb,
  ADD COLUMN IF NOT EXISTS analyze_mode text,
  ADD COLUMN IF NOT EXISTS effective_mode text,
  ADD COLUMN IF NOT EXISTS product_brand text,
  ADD COLUMN IF NOT EXISTS product_category text;

CREATE INDEX IF NOT EXISTS idx_scan_history_user_created ON scan_history (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_scan_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  category text NOT NULL DEFAULT '',
  normalized_name text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('scan_dismissed', 'added_to_shelf', 'added_to_routine')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_scan_decisions_user_fp ON user_scan_decisions(user_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_scan_decisions_user_created ON user_scan_decisions(user_id, created_at DESC);
