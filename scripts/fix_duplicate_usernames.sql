-- 1. Var olan mükerrer (duplicate) kullanıcı adlarını temizle (sonraki kullanıcılara _1, _2 ekler)
WITH duplicates AS (
  SELECT id, username,
         ROW_NUMBER() OVER (
           PARTITION BY LOWER(username) 
           ORDER BY updated_at ASC NULLS LAST, id ASC
         ) AS rn
  FROM public.profiles
  WHERE username IS NOT NULL AND username != ''
)
UPDATE public.profiles p
SET username = p.username || '_' || (d.rn - 1)
FROM duplicates d
WHERE p.id = d.id AND d.rn > 1;

-- 2. Veritabanına kesin ve kalıcı UNIQUE (Benzersiz) kısıtlaması ekle
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_username_lower
ON public.profiles (LOWER(username))
WHERE username IS NOT NULL;
