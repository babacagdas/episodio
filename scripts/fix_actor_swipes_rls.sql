-- Supabase SQL Editor'da çalıştırılacak actor_swipes RLS düzeltme kodu
ALTER TABLE public.actor_swipes ENABLE ROW LEVEL SECURITY;

-- 1. Herkesin favori oyuncuları okuyabilmesi politikası
DROP POLICY IF EXISTS "actor_swipes_select_public" ON public.actor_swipes;
CREATE POLICY "actor_swipes_select_public"
  ON public.actor_swipes FOR SELECT
  USING (true);

-- 2. Giriş yapmış kullanıcıların kendi favori oyuncularını ekleyebilmesi / silebilmesi
DROP POLICY IF EXISTS "actor_swipes_all_user" ON public.actor_swipes;
CREATE POLICY "actor_swipes_all_user"
  ON public.actor_swipes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
