-- Supabase SQL: Keşfet filtreleri için önbellek tablosu
-- Dashboard > SQL Editor'de bir kez çalıştırın.

create table if not exists public.catalog_tv_shows (
  tmdb_id bigint primary key,
  name text not null,
  poster_path text,
  vote_average double precision default 0,
  first_air_date date,
  genre_ids integer[] not null default '{}'::integer[],
  origin_country text[] not null default '{}'::text[],
  synced_at timestamptz not null default now()
);

create index if not exists idx_catalog_tv_shows_genres on public.catalog_tv_shows using gin (genre_ids);
create index if not exists idx_catalog_tv_shows_origin on public.catalog_tv_shows using gin (origin_country);
create index if not exists idx_catalog_tv_shows_air_date on public.catalog_tv_shows (first_air_date);

alter table public.catalog_tv_shows enable row level security;

drop policy if exists "catalog_tv_shows_select_public" on public.catalog_tv_shows;
create policy "catalog_tv_shows_select_public"
  on public.catalog_tv_shows for select
  using (true);
