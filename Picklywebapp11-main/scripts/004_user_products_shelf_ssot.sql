-- Shelf is SSOT for prices; wallet UI derives aggregates from these rows.
-- Run after 001_create_products_table.sql

ALTER TABLE public.user_products
  ADD COLUMN IF NOT EXISTS purchase_price numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_date date NOT NULL DEFAULT (CURRENT_DATE),
  ADD COLUMN IF NOT EXISTS routine_type text,
  ADD COLUMN IF NOT EXISTS fragrance_moment text;

COMMENT ON COLUMN public.user_products.purchase_price IS 'Canonical price for this shelf item; wallet totals sum this column.';
COMMENT ON COLUMN public.user_products.purchase_date IS 'Purchase date used for monthly wallet rollups.';

CREATE INDEX IF NOT EXISTS idx_user_products_user_purchase_date ON public.user_products (user_id, purchase_date DESC);
