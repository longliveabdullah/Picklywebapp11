-- ============================================================
-- 006_user_follows.sql
-- Social graph: follow / unfollow between users
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followee ON public.user_follows (followee_id);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_follows_public_read" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "user_follows_insert"      ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "user_follows_delete"      ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Convenience view: follower / following counts per user
CREATE OR REPLACE VIEW public.v_user_follow_counts AS
SELECT
  u.id AS user_id,
  COUNT(DISTINCT f.follower_id) AS followers,
  COUNT(DISTINCT g.followee_id) AS following
FROM auth.users u
LEFT JOIN public.user_follows f ON f.followee_id = u.id
LEFT JOIN public.user_follows g ON g.follower_id = u.id
GROUP BY u.id;
