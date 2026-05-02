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
  return process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY ?? '';
}

async function fetchDiscoverPage(
  page: number,
  opts: { genreId?: number; originCountry?: string; year?: number }
): Promise<CatalogShowRow[]> {
  const key = getTmdbKey();
  if (!key) return [];

  const tmdbUrl = new URL('https://api.themoviedb.org/3/discover/tv');
  tmdbUrl.searchParams.set('api_key', key);
  tmdbUrl.searchParams.set('language', 'tr-TR');
  tmdbUrl.searchParams.set('sort_by', 'popularity.desc');
  tmdbUrl.searchParams.set('page', String(page));
  if (opts.genreId) tmdbUrl.searchParams.set('with_genres', String(opts.genreId));
  if (opts.originCountry) tmdbUrl.searchParams.set('with_origin_country', opts.originCountry);
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

async function fetchDiscoverAllPages(opts: { genreId?: number; originCountry?: string; year?: number }) {
  const merged: CatalogShowRow[] = [];
  const seen = new Set<number>();
  for (let page = 1; page <= 5; page++) {
    const batch = await fetchDiscoverPage(page, opts);
    if (!batch.length) break;
    for (const row of batch) {
      if (!seen.has(row.tmdb_id)) {
        seen.add(row.tmdb_id);
        merged.push(row);
      }
    }
  }
  return merged;
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

  const genreId = genreIdRaw ? Number(genreIdRaw) : undefined;
  const year = yearRaw ? Number(yearRaw) : undefined;

  if (year !== undefined && (Number.isNaN(year) || year < 1900 || year > 2100)) {
    return NextResponse.json({ error: 'Geçersiz yıl' }, { status: 400 });
  }
  if (!genreId && !originCountry) {
    return NextResponse.json({ error: 'Kategori veya ülke seçin' }, { status: 400 });
  }
  if (genreId !== undefined && Number.isNaN(genreId)) {
    return NextResponse.json({ error: 'Geçersiz tür' }, { status: 400 });
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
