import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import { getShowDetail, getSeasonEpisodes, getSimilarShows, getTvWatchProviders, getShowCredits, type Episode } from '@/lib/tmdb';
import WatchlistButton from './WatchlistButton';
import WatchStatusButton from './WatchStatusButton';
import ShowTabs from './ShowTabs';
import AddToListButton from './AddToListButton';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const PERSON_BASE = 'https://image.tmdb.org/t/p/w185';

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await getShowDetail(id);
  const seasons = (show.seasons ?? []).filter((season) => season.episode_count > 0);
  const [allSeasonEpisodes, similar, watchProviders, credits] = await Promise.all([
    Promise.all(
      seasons.map(async (season) => ({
        seasonNumber: season.season_number,
        episodes: await getSeasonEpisodes(id, season.season_number),
      }))
    ),
    getSimilarShows(id),
    getTvWatchProviders(id),
    getShowCredits(id),
  ]);

  const providers = watchProviders?.flatrate || watchProviders?.buy || watchProviders?.rent || [];

  const backdrop = show.backdrop_path ? `${BACKDROP_BASE}${show.backdrop_path}` : null;
  const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : null;
  const year = show.first_air_date?.slice(0, 4) ?? '';
  const episodesBySeason: Record<number, Episode[]> = Object.fromEntries(
    allSeasonEpisodes.map((entry) => [entry.seasonNumber, entry.episodes])
  );

  return (
    <div className="font-body-md text-body-md antialiased min-h-screen pb-24 md:pb-0 overflow-x-hidden">
      <Sidebar />

      <div className="md:hidden fixed top-4 left-4 z-50">
        <Link href="/home" className="w-10 h-10 rounded-full bg-[#1A1A1A]/70 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </div>

      <main className="md:ml-[240px] md:w-[calc(100%-240px)] w-full overflow-x-hidden">
        {/* Hero */}
        <section className="relative w-full h-[560px] md:h-[680px]">
          <div className="absolute inset-0">
            {backdrop
              ? <img alt={show.name} className="w-full h-full object-cover object-center" src={backdrop} />
              : <div className="w-full h-full bg-[#141414]" />
            }
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#070707_0%,rgba(7,7,7,0.78)_38%,rgba(7,7,7,0.16)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,#070707_0%,rgba(7,7,7,0.78)_18%,rgba(7,7,7,0.2)_62%,rgba(7,7,7,0.05)_100%)]" />

          <div className="absolute bottom-0 left-0 w-full px-margin-mobile md:px-12 pb-12 md:pb-16 flex flex-col items-start max-w-[1180px] mx-auto">
            <p className="premium-kicker mb-3">Dizi Detayı</p>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-normal leading-[0.98] max-w-4xl">{show.name}</h1>

            <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs font-medium text-white/60">
              {show.genres.map((g, i) => (
                <span key={g.id} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-white/25">•</span>}
                  <span>{g.name}</span>
                </span>
              ))}
              {year && <span className="text-white/40 flex items-center gap-1.5"><span className="text-white/25">•</span> {year}</span>}
              {show.number_of_seasons > 0 && <span className="text-white/40 flex items-center gap-1.5"><span className="text-white/25">•</span> {show.number_of_seasons} Sezon</span>}
              {show.number_of_episodes > 0 && <span className="text-white/40 flex items-center gap-1.5"><span className="text-white/25">•</span> {show.number_of_episodes} Bölüm</span>}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#D4A017] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-white">{show.vote_average.toFixed(1)}</span>
              <span className="text-white/40 text-sm">{show.vote_count.toLocaleString()} oy</span>
            </div>

            {providers.length > 0 && (
              <div className="flex flex-col items-start gap-1.5 mb-5">
                <div className="flex items-center -space-x-2.5 overflow-hidden py-1">
                  {providers.map((p) => (
                    <div
                      key={p.provider_id}
                      title={p.provider_name}
                      className="relative inline-block w-9 h-9 rounded-full ring-2 ring-[#070707] overflow-hidden bg-[#121216] border border-white/10 shadow-md shrink-0 hover:z-10 hover:scale-110 transition-transform duration-200"
                    >
                      {p.logo_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#18181c] text-white/40 text-xs font-bold">
                          {p.provider_name[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-white/70 tracking-wide">
                  {providers.map((p) => p.provider_name).join(' • ')}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <WatchStatusButton showId={show.id} showName={show.name} posterPath={show.poster_path} />
              <WatchlistButton show={{
                id: show.id,
                name: show.name,
                poster_path: show.poster_path,
                vote_average: show.vote_average,
                first_air_date: show.first_air_date,
              }} />
              <AddToListButton show={{
                id: show.id,
                name: show.name,
                poster_path: show.poster_path,
              }} />
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="px-margin-mobile md:px-12 max-w-[900px] mt-8 w-full overflow-x-hidden">
          {show.overview && (
            <p className="text-white/50 text-sm leading-relaxed mb-8 max-w-3xl">{show.overview}</p>
          )}

          {/* Oyuncular & Kadro */}
          {credits.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#C91520]">groups</span>
                Oyuncular & Kadro
              </h3>
              <div className="flex items-center gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {credits.map((actor) => (
                  <div key={actor.id} className="flex flex-col items-center shrink-0 w-20 text-center select-none">
                    <div className="w-14 h-14 rounded-full border border-white/10 overflow-hidden bg-[#141418] shadow-md flex items-center justify-center mb-1.5">
                      {actor.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-white/20 text-xl">person</span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-white truncate w-full">{actor.name}</p>
                    <p className="text-[10px] text-white/40 truncate w-full mt-0.5">{actor.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ShowTabs
            showId={show.id}
            episodesBySeason={episodesBySeason}
            similar={similar}
            poster={poster}
            seasons={seasons}
          />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
