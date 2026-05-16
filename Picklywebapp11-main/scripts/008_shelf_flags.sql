-- ============================================================
-- 008_shelf_flags.sql
-- is_favorite and is_repurchase columns on user_products
-- ============================================================

ALTER TABLE public.user_products
  ADD COLUMN IF NOT EXISTS is_favorite   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_repurchase boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_products_favorites
  ON public.user_products (user_id)
  WHERE is_favorite = true;

COMMENT ON COLUMN public.user_products.is_favorite   IS 'User-toggled favourite flag — shown on profile';
COMMENT ON COLUMN public.user_products.is_repurchase IS 'User-flagged repurchase intent — shown on profile';
