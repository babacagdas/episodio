-- Manager Paneli ve Haftalık Analiz verilerinin RLS engellerine takılmadan %100 eksiksiz çekilmesi için SQL betiği

-- 1. Profiles Tablosu Okuma İzni
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);

-- 2. Lists Tablosu Okuma İzni
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lists_select_public" ON public.lists;
CREATE POLICY "lists_select_public" ON public.lists FOR SELECT USING (true);

-- 3. Reviews Tablosu Okuma İzni
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT USING (true);

-- 4. Show Notes Tablosu Okuma İzni
ALTER TABLE public.show_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "show_notes_select_public" ON public.show_notes;
CREATE POLICY "show_notes_select_public" ON public.show_notes FOR SELECT USING (true);

-- 5. Episode Discussions Tablosu Okuma İzni
ALTER TABLE public.episode_discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "episode_discussions_select_public" ON public.episode_discussions;
CREATE POLICY "episode_discussions_select_public" ON public.episode_discussions FOR SELECT USING (true);

-- 6. Episode Comment Replies Tablosu Okuma İzni
ALTER TABLE public.episode_comment_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "episode_comment_replies_select_public" ON public.episode_comment_replies;
CREATE POLICY "episode_comment_replies_select_public" ON public.episode_comment_replies FOR SELECT USING (true);

-- 7. Watch Status Tablosu Okuma İzni
ALTER TABLE public.watch_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "watch_status_select_public" ON public.watch_status;
CREATE POLICY "watch_status_select_public" ON public.watch_status FOR SELECT USING (true);
