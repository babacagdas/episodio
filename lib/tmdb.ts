export interface Show {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
  /** discover/list uçlarında gelir */
  overview?: string;
}

export interface Season {
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
}

export interface ShowDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  genres: { id: number; name: string }[];
  status: string;
  seasons: Season[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  runtime: number | null;
  vote_average: number;
  air_date: string;
}

function getTmdbApiKey(): string {
  return process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY ?? '';
}

export async function getShowDetail(id: string): Promise<ShowDetail> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) throw new Error('TMDB API key eksik');
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error('Dizi detayı alınamadı');
  return res.json();
}

export async function getSeasonEpisodes(showId: string, seasonNumber: number): Promise<Episode[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?api_key=${apiKey}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.episodes ?? [];
}

export async function searchShows(query: string): Promise<Show[]> {
  if (!query.trim()) return [];
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  const res = await fetch(
    `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=tr-TR&query=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results as Show[];
}

export async function getSimilarShows(id: string): Promise<Show[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}/similar?api_key=${apiKey}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results as Show[];
}

export async function getTrendingShows(): Promise<Show[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results as Show[];
}

/** Profil kapağı için backdrop path (URL üretmek sayfada) */
export async function getTvBackdropPath(showId: string): Promise<string | null> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${showId}?api_key=${apiKey}&language=tr-TR`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { backdrop_path?: string | null };
    return data.backdrop_path ?? null;
  } catch {
    return null;
  }
}

/** İzlenen dizilerden tür çıkarmak için (sadece genre_ids) */
export async function getTvGenreIds(showId: string): Promise<number[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${showId}?api_key=${apiKey}&language=tr-TR`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { genres?: { id: number }[] };
    return (data.genres ?? []).map((g) => g.id);
  } catch {
    return [];
  }
}

export async function discoverShowsByGenre(genreId: number, page = 1): Promise<Show[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=tr-TR&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as Show[];
}
