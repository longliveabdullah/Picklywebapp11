-- ============================================================
-- 009_future_buys.sql
-- Replaces pickly-future-buys:<userId> localStorage key.
-- Stores wish-list / saved-for-later scans per user.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_future_buys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id     uuid REFERENCES public.scan_history(id) ON DELETE SET NULL,
  product_name text,
  snapshot    jsonb NOT NULL DEFAULT '{}'::jsonb,
  added_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_future_buys_user ON public.user_future_buys (user_id, added_at DESC);

ALTER TABLE public.user_future_buys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "future_buys_owner_select" ON public.user_future_buys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "future_buys_owner_insert" ON public.user_future_buys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "future_buys_owner_delete" ON public.user_future_buys FOR DELETE USING (auth.uid() = user_id);
