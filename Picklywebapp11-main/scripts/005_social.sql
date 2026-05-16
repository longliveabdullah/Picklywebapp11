-- ============================================================
-- 005_social.sql
-- Community circles, feed posts, likes, comments, product reviews
-- Run after 004_user_products_shelf_ssot.sql
-- ============================================================

-- ── Circles catalog ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.circles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  accent      text NOT NULL DEFAULT '#697254',
  created_at  timestamptz DEFAULT now()
);

-- ── Circle members ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.circle_members (
  circle_id  uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'member'
               CHECK (role IN ('member', 'curator', 'owner')),
  joined_at  timestamptz DEFAULT now(),
  PRIMARY KEY (circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.circle_members (user_id);

-- ── Feed posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  image_path  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_created ON public.feed_posts (user_id, created_at DESC);

CREATE TRIGGER update_feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Post likes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes (post_id);

-- ── Post comments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments (post_id, created_at ASC);

-- ── Product reviews ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  brand        text,
  category     text,
  rating       int NOT NULL CHECK (rating BETWEEN 1 AND 10),
  body         text,
  scan_id      uuid REFERENCES public.scan_history(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON public.product_reviews (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews (product_name, brand);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.circles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Circles: public read
CREATE POLICY "circles_public_read" ON public.circles FOR SELECT USING (true);

-- Circle members: authenticated can see all; insert own; delete own
CREATE POLICY "circle_members_select" ON public.circle_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "circle_members_insert" ON public.circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "circle_members_delete" ON public.circle_members FOR DELETE USING (auth.uid() = user_id);

-- Feed posts: public read; owner write
CREATE POLICY "feed_posts_public_read"  ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "feed_posts_insert"       ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_posts_update"       ON public.feed_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "feed_posts_delete"       ON public.feed_posts FOR DELETE USING (auth.uid() = user_id);

-- Post likes: authenticated read; owner write
CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post comments: public read; owner write
CREATE POLICY "post_comments_public_read" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_insert"      ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_comments_delete"      ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- Product reviews: public read; owner write
CREATE POLICY "product_reviews_public_read" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "product_reviews_insert"      ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "product_reviews_delete"      ON public.product_reviews FOR DELETE USING (auth.uid() = user_id);

-- ── Seed circles ─────────────────────────────────────────────
INSERT INTO public.circles (slug, name, description, accent) VALUES
  ('barrier-skin', 'Barrier Skin', 'Ceramide-first, fragrance-light skincare for sensitive and dry types.', '#A7AD89'),
  ('oily-acne', 'Oily & Acne-Prone', 'No-nonsense routines for oil control and clear skin.', '#697254'),
  ('curly-wavy', 'Curly & Wavy Hair', 'Moisture layering, curl definition, and scalp care.', '#8C916C'),
  ('fragrance-lovers', 'Fragrance Lovers', 'Niche finds, layering guides, and seasonal picks.', '#92735C'),
  ('clean-beauty', 'Clean Beauty', 'Ingredient-safe formulations with no greenwashing.', '#B69C85')
ON CONFLICT (slug) DO NOTHING;
