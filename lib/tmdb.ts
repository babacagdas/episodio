export interface Show {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  first_air_date: string;
  /** discover/list uçlarında gelir */
  overview?: string;
  genre_ids?: number[];
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
  original_name?: string;
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
  return process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY ?? '4f3b798b31a26d70c48e8946e336b135';
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

export async function getHeroShows(): Promise<Show[]> {
  const apiKey = getTmdbApiKey();
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=tr-TR`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = (data.results ?? []) as Show[];
        const filtered = results.filter((s) => s.backdrop_path && s.overview && s.overview.trim().length > 10);
        if (filtered.length >= 3) {
          return filtered.slice(0, 6);
        }
      }
    } catch {
      // Fallback below if fetch fails
    }
  }

  return [
    {
      id: 1396,
      name: 'Breaking Bad',
      poster_path: '/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg',
      backdrop_path: '/tsRy63MuZvE8ZWarmcxAUtY3hNW.jpg',
      vote_average: 8.9,
      first_air_date: '2008-01-20',
      overview: 'Kanser olduğunu öğrenen bir kimya öğretmeni, ailesinin geleceğini güvence altına almak için eski bir öğrencisiyle metamfetamin üretmeye başlar.',
      genre_ids: [18, 80],
    },
    {
      id: 95557,
      name: 'Severance',
      poster_path: '/pEQp22B0MvhRrm8qWdK81q7w00Z.jpg',
      backdrop_path: '/5D10DzwS301i5b4nS9G223X3h6m.jpg',
      vote_average: 8.4,
      first_air_date: '2022-02-17',
      overview: 'Lumon Industries çalışanları, iş ve özel hayat hafızalarını cerrahi olarak ayıran gizemli bir prosedüre tabi tutulur.',
      genre_ids: [10765, 9648, 18],
    },
    {
      id: 66732,
      name: 'Stranger Things',
      poster_path: '/49WJfeN0moxb9IPfGn88qbuYh9m.jpg',
      backdrop_path: '/56v2Kj2RCyLBHccDhVUchE2pWdE.jpg',
      vote_average: 8.6,
      first_air_date: '2016-07-15',
      overview: 'Küçük bir kasabada bir çocuğun kaybolmasıyla başlayan gizemli olaylar, gizli deneyleri ve doğaüstü güçleri açığa çıkarır.',
      genre_ids: [10765, 9648, 18],
    },
    {
      id: 93405,
      name: 'Squid Game',
      poster_path: '/dDlEmu3EZ0Pgg93K2SVNen3j82E.jpg',
      backdrop_path: '/zNfi2a11bT35m6D1K7B32Yf3g7.jpg',
      vote_average: 8.4,
      first_air_date: '2021-09-17',
      overview: 'Para sıkıntısı çeken yüzlerce oyuncu, çocuk oyunlarına dayalı ölümcül bir yarışmaya katılmak için tuhaf bir daveti kabul eder.',
      genre_ids: [10759, 9648, 18],
    },
  ];
}

export async function getUpcomingShows(): Promise<Show[]> {
  const apiKey = getTmdbApiKey();
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/on_the_air?api_key=${apiKey}&language=tr-TR`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = (data.results ?? []) as Show[];
        const filtered = results.filter((s) => s.backdrop_path && s.overview && s.overview.trim().length > 10);
        if (filtered.length >= 3) {
          return filtered.slice(0, 5);
        }
      }
    } catch {
      // Fallback below
    }
  }

  return [
    {
      id: 100088,
      name: 'The Last of Us',
      poster_path: '/uKvVjHNqB5VmjuAwePScWPhMKZ5.jpg',
      backdrop_path: '/uDgy6hyPd82sOHhfgIUtjM9dGE.jpg',
      vote_average: 8.6,
      first_air_date: '2025-04-12',
      overview: 'Joel ve Ellie, ölümcül mantar salgınının ardından Amerika’nın tehlikeli kalıntılarında hayatta kalma mücadelesine devam ediyor.',
      genre_ids: [10765, 18, 10759],
    },
    {
      id: 94997,
      name: 'House of the Dragon',
      poster_path: '/1X4h40fcB4y4w42pQ5Y3Cg9yB9a.jpg',
      backdrop_path: '/etj8E2o0VisualBackdrop.jpg',
      vote_average: 8.4,
      first_air_date: '2024-06-16',
      overview: 'Targaryen Hanedanlığı’nın altın çağında başlayan iç savaş, ejderhaların dansı ile Westeros’un kaderini tamamen değiştiriyor.',
      genre_ids: [10765, 18, 10759],
    },
    {
      id: 76479,
      name: 'The Boys',
      poster_path: '/stTEycfG9928HYGEodYFiW1MUtm.jpg',
      backdrop_path: '/mAh94Y7wRk5p50w8734hG78.jpg',
      vote_average: 8.5,
      first_air_date: '2024-06-13',
      overview: 'Yozlaşmış süper kahramanlar ve onları durdurmaya yemin etmiş bir grup sıradan adamın nefes kesen savaşı.',
      genre_ids: [10759, 10765, 18],
    },
  ];
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

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

export interface PersonCreditItem {
  id: number;
  media_type: 'tv' | 'movie';
  name?: string;
  title?: string;
  character?: string;
  poster_path: string | null;
  vote_average?: number;
  first_air_date?: string;
  release_date?: string;
}

export async function getPersonDetail(personId: string | number): Promise<PersonDetail | null> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return null;
  try {
    let res = await fetch(
      `https://api.themoviedb.org/3/person/${personId}?api_key=${apiKey}&language=tr-TR`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    let data = (await res.json()) as PersonDetail;

    if (!data.biography) {
      const enRes = await fetch(
        `https://api.themoviedb.org/3/person/${personId}?api_key=${apiKey}&language=en-US`,
        { next: { revalidate: 86400 } }
      );
      if (enRes.ok) {
        const enData = await enRes.json();
        data.biography = enData.biography || '';
      }
    }
    return data;
  } catch {
    return null;
  }
}

export async function getPersonCredits(personId: string | number): Promise<PersonCreditItem[]> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${apiKey}&language=tr-TR`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const cast = (data.cast ?? []) as PersonCreditItem[];
    return cast
      .filter((item) => !!item.poster_path)
      .slice(0, 30);
  } catch {
    return [];
  }
}
