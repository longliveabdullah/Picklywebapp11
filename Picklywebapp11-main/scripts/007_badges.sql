-- ============================================================
-- 007_badges.sql
-- Badge catalog + per-user earned badges
-- ============================================================

CREATE TABLE IF NOT EXISTS public.badges (
  code        text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL,
  icon        text NOT NULL DEFAULT '🏅',
  criteria    jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code text NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  earned_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges (user_id);

ALTER TABLE public.badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_public_read"      ON public.badges      FOR SELECT USING (true);
CREATE POLICY "user_badges_owner_read"  ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
-- Only server-side (service role) can award badges — no direct INSERT policy for users.

-- ── Seed catalog ─────────────────────────────────────────────
INSERT INTO public.badges (code, name, description, icon, criteria) VALUES
  ('shelf_master',    'Shelf Master',     'Added 10 products to your shelf.',    '🧴', '{"shelf_count": 10}'),
  ('clean_streak',    'Clean Streak',     '5 clean-scored products in a row.',   '🌿', '{"clean_streak": 5}'),
  ('routine_curator', 'Routine Curator',  'Built both AM and PM routines.',      '✨', '{"am_steps": 1, "pm_steps": 1}'),
  ('ingredient_pro',  'Ingredient Pro',   'Scanned 50 products total.',          '🔬', '{"scan_count": 50}'),
  ('community_star',  'Community Star',   'Reached 100 followers.',              '💚', '{"followers": 100}'),
  ('top_reviewer',    'Top Reviewer',     'Posted 25 product reviews.',          '🏆', '{"review_count": 25}'),
  ('first_scan',      'First Scan',       'Completed your first product scan.',  '📸', '{"scan_count": 1}'),
  ('shelf_starter',   'Shelf Starter',    'Added your first shelf product.',     '🛒', '{"shelf_count": 1}')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  criteria = EXCLUDED.criteria;
