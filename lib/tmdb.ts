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

export interface EpisodeShort {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
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
  next_episode_to_air?: EpisodeShort | null;
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

export interface TrailerItem {
  id: string;
  showId: number;
  showName: string;
  videoTitle: string;
  youtubeKey: string;
  backdropPath: string | null;
  posterPath: string | null;
  voteAverage: number;
  firstAirDate: string;
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
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as Show[];
}

export async function getLatestTvTrailers(): Promise<TrailerItem[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/tv/day?api_key=${apiKey}&language=tr-TR`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const shows = (data.results ?? []) as (Show & { backdrop_path?: string | null })[];

    const trailers: TrailerItem[] = [];
    await Promise.all(
      shows.slice(0, 8).map(async (show) => {
        try {
          let videoRes = await fetch(
            `https://api.themoviedb.org/3/tv/${show.id}/videos?api_key=${apiKey}&language=tr-TR`,
            { next: { revalidate: 3600 } }
          );
          let videoData = videoRes.ok ? await videoRes.json() : { results: [] };
          let results = (videoData.results ?? []) as { key: string; site: string; type: string; name: string; published_at?: string }[];

          if (results.length === 0) {
            videoRes = await fetch(
              `https://api.themoviedb.org/3/tv/${show.id}/videos?api_key=${apiKey}&language=en-US`,
              { next: { revalidate: 3600 } }
            );
            videoData = videoRes.ok ? await videoRes.json() : { results: [] };
            results = (videoData.results ?? []) as { key: string; site: string; type: string; name: string; published_at?: string }[];
          }

          const youtubeVideos = results
            .filter((v) => v.site === 'YouTube')
            .sort((a, b) => {
              const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
              const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
              return dateB - dateA;
            });

          const trailer = youtubeVideos.find((v) => v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Promo') || youtubeVideos[0];

          if (trailer) {
            trailers.push({
              id: trailer.key,
              showId: show.id,
              showName: show.name,
              videoTitle: trailer.name || `${show.name} Son Bölüm Fragmanı`,
              youtubeKey: trailer.key,
              backdropPath: show.backdrop_path ?? null,
              posterPath: show.poster_path ?? null,
              voteAverage: show.vote_average ?? 0,
              firstAirDate: show.first_air_date ?? '',
            });
          }
        } catch {
          // ignore
        }
      })
    );

    return trailers;
  } catch {
    return [];
  }
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProvidersResult {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export async function getTvWatchProviders(showId: string): Promise<WatchProvidersResult | null> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${showId}/watch/providers?api_key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results ?? {};
    return results.TR || results.US || null;
  } catch {
    return null;
  }
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export async function getShowCredits(showId: string): Promise<CastMember[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${showId}/credits?api_key=${apiKey}&language=tr-TR`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.cast ?? []).slice(0, 15) as CastMember[];
  } catch {
    return [];
  }
}
