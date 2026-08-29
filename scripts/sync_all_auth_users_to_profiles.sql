-- Supabase Paneli SQL Editor Ekranında 1 Defa Çalıştırılacak Düzeltilmiş Kod
-- 1. Profiles tablosuna created_at kolonunu ekle (eğer daha önce yoksa)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. auth.users Tablosundaki TÜM 30 Kullanıcıyı public.profiles Tablosuna Aktarır ve Senkronize Eder
INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at)
SELECT 
  id,
  COALESCE(
    NULLIF(raw_user_meta_data->>'username', ''),
    SPLIT_PART(email, '@', 1),
    'user_' || SUBSTRING(id::text, 1, 6)
  ) AS username,
  COALESCE(
    NULLIF(raw_user_meta_data->>'full_name', ''),
    NULLIF(raw_user_meta_data->>'name', ''),
    SPLIT_PART(email, '@', 1),
    'Episodio Üyesi'
  ) AS full_name,
  COALESCE(
    raw_user_meta_data->>'avatar_url',
    raw_user_meta_data->>'picture'
  ) AS avatar_url,
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  username = COALESCE(public.profiles.username, EXCLUDED.username),
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  created_at = COALESCE(public.profiles.created_at, EXCLUDED.created_at);

-- 3. Gelecekte Üye Olacak Herkes İçin Otomatik Profil Oluşturucu Tetikleyici (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Profiles Tablosu Okuma İzni (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
