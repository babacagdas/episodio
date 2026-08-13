-- Dizi Genel Yorumları Yanıt Tablosu
CREATE TABLE IF NOT EXISTS public.review_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Güvenlik Politikaları
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes yorum yanıtlarını görebilir" ON public.review_replies
    FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi yanıtlarını ekleyebilir" ON public.review_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi yanıtlarını silebilir" ON public.review_replies
    FOR DELETE USING (auth.uid() = user_id);
