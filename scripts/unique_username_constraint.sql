-- Supabase SQL Editor'da 1 kez çalıştırılacak benzersiz kullanıcı adı indeksi
-- Bu sorgu veritabanında büyük/küçük harf duyarsız (case-insensitive) aynı kullanıcı adının kaydedilmesini engeller.

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_username_lower
ON public.profiles (LOWER(username))
WHERE username IS NOT NULL;
