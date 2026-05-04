-- Profil kapağı: TMDB TV id (backdrop URL DB'de tutulmaz, uygulama TMDB'den çeker).
-- Supabase: Dashboard → SQL Editor → yapıştır → Run

alter table public.profiles
  add column if not exists cover_show_id integer null;

-- Kolon geldi mi kontrol (isteğe bağlı; sonuçta bir satır görmelisin):
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles' and column_name = 'cover_show_id';
