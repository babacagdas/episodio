import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type LooseSupabase = SupabaseClient<any, any, any, any>;

export interface CatalogShowRow {
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string | null;
  genre_ids: number[];
  origin_country: string[];
}

function getTmdbKey() {
  return process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY ?? 'd0e8d91e3b9f6091fc38629f10e2e049';
}

async function fetchDiscoverPage(
  page: number,
  opts: {
    genreId?: number;
    originCountry?: string;
    year?: number;
    providerId?: number;
    format?: string;
    top?: number;
    minRating?: number;
    decade?: string;
    sortBy?: string;
  }
): Promise<CatalogShowRow[]> {
  const key = getTmdbKey();
  if (!key) return [];

  const tmdbUrl = new URL('https://api.themoviedb.org/3/discover/tv');
  tmdbUrl.searchParams.set('api_key', key);
  tmdbUrl.searchParams.set('language', 'tr-TR');
  tmdbUrl.searchParams.set('sort_by', opts.sortBy || (opts.top === 50 ? 'vote_average.desc' : 'popularity.desc'));
  
  if (opts.minRating || opts.top === 50) {
    tmdbUrl.searchParams.set('vote_count.gte', '250');
    if (opts.minRating) {
      tmdbUrl.searchParams.set('vote_average.gte', String(opts.minRating));
    }
  }

  if (opts.decade) {
    if (opts.decade === '2020s') {
      tmdbUrl.searchParams.set('first_air_date.gte', '2020-01-01');
      tmdbUrl.searchParams.set('first_air_date.lte', '2029-12-31');
    } else if (opts.decade === '2010s') {
      tmdbUrl.searchParams.set('first_air_date.gte', '2010-01-01');
      tmdbUrl.searchParams.set('first_air_date.lte', '2019-12-31');
    } else if (opts.decade === '2000s') {
      tmdbUrl.searchParams.set('first_air_date.gte', '2000-01-01');
      tmdbUrl.searchParams.set('first_air_date.lte', '2009-12-31');
    } else if (opts.decade === '90s') {
      tmdbUrl.searchParams.set('first_air_date.gte', '1990-01-01');
      tmdbUrl.searchParams.set('first_air_date.lte', '1999-12-31');
    }
  }

  tmdbUrl.searchParams.set('page', String(page));
  if (opts.genreId) tmdbUrl.searchParams.set('with_genres', String(opts.genreId));
  if (opts.originCountry) tmdbUrl.searchParams.set('with_origin_country', opts.originCountry);
  if (opts.providerId) {
    tmdbUrl.searchParams.set('with_watch_providers', String(opts.providerId));
    tmdbUrl.searchParams.set('watch_region', 'TR');
  }
  if (opts.format === 'mini') {
    tmdbUrl.searchParams.set('with_type', '2');
  } else if (opts.format === 'short') {
    tmdbUrl.searchParams.set('with_runtime.lte', '35');
  } else if (opts.format === 'marathon') {
    tmdbUrl.searchParams.set('sort_by', 'vote_count.desc');
    tmdbUrl.searchParams.set('vote_count.gte', '300');
  }
  if (opts.year) {
    tmdbUrl.searchParams.set('first_air_date.gte', `${opts.year}-01-01`);
    tmdbUrl.searchParams.set('first_air_date.lte', `${opts.year}-12-31`);
  }

  const res = await fetch(tmdbUrl.toString(), { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  const results = (data.results ?? []) as {
    id: number;
    name: string;
    poster_path: string | null;
    vote_average: number;
    first_air_date: string;
    genre_ids?: number[];
    origin_country?: string[];
  }[];

  return results.map((r) => ({
    tmdb_id: r.id,
    name: r.name,
    poster_path: r.poster_path,
    vote_average: r.vote_average ?? 0,
    first_air_date: r.first_air_date ? r.first_air_date.slice(0, 10) : null,
    genre_ids: r.genre_ids ?? [],
    origin_country: r.origin_country ?? [],
  }));
}

async function fetchDiscoverAllPages(opts: {
  genreId?: number;
  originCountry?: string;
  year?: number;
  providerId?: number;
  format?: string;
  top?: number;
  minRating?: number;
  decade?: string;
  sortBy?: string;
}) {
  const merged: CatalogShowRow[] = [];
  const seen = new Set<number>();
  const maxPages = opts.top === 10 ? 1 : 2;

  const pages = await Promise.all(
    Array.from({ length: maxPages }, (_, i) => fetchDiscoverPage(i + 1, opts))
  );

  for (const batch of pages) {
    for (const row of batch) {
      if (!seen.has(row.tmdb_id)) {
        seen.add(row.tmdb_id);
        merged.push(row);
      }
    }
  }
  return opts.top ? merged.slice(0, opts.top) : merged;
}

async function hydrateCatalog(
  admin: LooseSupabase,
  opts: { genreId?: number; originCountry?: string; year?: number }
) {
  const rows = await fetchDiscoverAllPages(opts);
  if (!rows.length) return;

  const { error } = await admin
    .from('catalog_tv_shows')
    .upsert(
    rows.map((r) => ({
      tmdb_id: r.tmdb_id,
      name: r.name,
      poster_path: r.poster_path,
      vote_average: r.vote_average,
      first_air_date: r.first_air_date,
      genre_ids: r.genre_ids,
      origin_country: r.origin_country,
      synced_at: new Date().toISOString(),
    })),
    { onConflict: 'tmdb_id' }
    );
  if (error) console.error('catalog_tv_shows upsert', error.message);
}

function mapToShow(r: {
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string | null;
}) {
  return {
    id: r.tmdb_id,
    name: r.name,
    poster_path: r.poster_path,
    vote_average: r.vote_average,
    first_air_date: r.first_air_date ?? '',
  };
}

async function selectFromCatalog(
  admin: LooseSupabase,
  genreId?: number,
  originCountry?: string,
  year?: number
): Promise<CatalogShowRow[]> {
  let q = admin.from('catalog_tv_shows')
    .select('tmdb_id, name, poster_path, vote_average, first_air_date, genre_ids, origin_country');
  if (genreId) q = q.contains('genre_ids', [genreId]);
  if (originCountry) q = q.contains('origin_country', [originCountry]);
  if (year) {
    q = q.gte('first_air_date', `${year}-01-01`).lte('first_air_date', `${year}-12-31`);
  }
  const { data, error } = await q.order('vote_average', { ascending: false }).limit(60);
  if (error) {
    console.error('catalog_tv_shows select', error.message);
    return [];
  }
  return (data ?? []) as CatalogShowRow[];
}

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams;
  const genreIdRaw = qs.get('genreId');
  const originCountry = qs.get('originCountry')?.trim().toUpperCase() || undefined;
  const yearRaw = qs.get('year');
  const providerIdRaw = qs.get('providerId');
  const format = qs.get('format')?.trim() || undefined;
  const topRaw = qs.get('top');

  const minRatingRaw = qs.get('minRating');
  const decade = qs.get('decade')?.trim() || undefined;
  const sortBy = qs.get('sortBy')?.trim() || undefined;

  const genreId = genreIdRaw ? Number(genreIdRaw) : undefined;
  const year = yearRaw ? Number(yearRaw) : undefined;
  const providerId = providerIdRaw ? Number(providerIdRaw) : undefined;
  const top = topRaw ? Number(topRaw) : undefined;
  const minRating = minRatingRaw ? Number(minRatingRaw) : undefined;

  if (year !== undefined && (Number.isNaN(year) || year < 1900 || year > 2100)) {
    return NextResponse.json({ error: 'Geçersiz yıl' }, { status: 400 });
  }

  // Eğer platform, format, top, minRating, decade veya sortBy seçilmişse doğrudan TMDB Discover API'den çek
  if (providerId || format || top || minRating || decade || sortBy) {
    const merged = await fetchDiscoverAllPages({ genreId, originCountry, year, providerId, format, top, minRating, decade, sortBy });
    return NextResponse.json(merged.map(mapToShow));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  /** TMDB yanıtı (Supabase yok / tablo yok ise) */
  const tmdbFallback = async () => {
    const merged = await fetchDiscoverAllPages({ genreId, originCountry, year });
    return NextResponse.json(merged.map(mapToShow));
  };

  if (!supabaseUrl || !serviceRoleKey) return tmdbFallback();

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  }) as LooseSupabase;

  let rows = await selectFromCatalog(admin, genreId, originCountry, year);

  if (rows.length === 0) {
    await hydrateCatalog(admin, { genreId, originCountry, year });
    rows = await selectFromCatalog(admin, genreId, originCountry, year);
  }

  if (rows.length === 0) return tmdbFallback();

  return NextResponse.json(rows.map(mapToShow));
}
