-- Supabase SQL Editor'da çalıştırılacak tablo oluşturma kodu
CREATE TABLE IF NOT EXISTS public.admin_feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  instagram_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Herkesin okuyabilmesi ve yöneticinin yazabilmesi için RLS kuralları
ALTER TABLE public.admin_feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on admin_feed_posts" ON public.admin_feed_posts;
CREATE POLICY "Allow public select on admin_feed_posts"
  ON public.admin_feed_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert on admin_feed_posts" ON public.admin_feed_posts;
CREATE POLICY "Allow public insert on admin_feed_posts"
  ON public.admin_feed_posts FOR ALL
  USING (true);
