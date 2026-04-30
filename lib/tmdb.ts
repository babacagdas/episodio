export interface Show {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
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

export async function getShowDetail(id: string): Promise<ShowDetail> {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error('Dizi detayı alınamadı');
  return res.json();
}

export async function getSeasonEpisodes(showId: string, seasonNumber: number): Promise<Episode[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.episodes ?? [];
}

export async function searchShows(query: string): Promise<Show[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://api.themoviedb.org/3/search/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results as Show[];
}

export async function getSimilarShows(id: string): Promise<Show[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}/similar?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results as Show[];
}

export async function getTrendingShows(): Promise<Show[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error('TMDB verisi alınamadı');
  const data = await res.json();
  return data.results as Show[];
}
