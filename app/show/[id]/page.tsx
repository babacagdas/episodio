import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import { getShowDetail, getSeasonEpisodes, getSimilarShows, type Episode } from '@/lib/tmdb';
import WatchlistButton from './WatchlistButton';
import WatchStatusButton from './WatchStatusButton';
import ShowTabs from './ShowTabs';
import AddToListButton from './AddToListButton';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await getShowDetail(id);
  const seasons = (show.seasons ?? []).filter((season) => season.episode_count > 0);
  const [allSeasonEpisodes, similar] = await Promise.all([
    Promise.all(
      seasons.map(async (season) => ({
        seasonNumber: season.season_number,
        episodes: await getSeasonEpisodes(id, season.season_number),
      }))
    ),
    getSimilarShows(id),
  ]);

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

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {show.genres.map((g) => (
                <span key={g.id} className="px-2.5 py-1 rounded-md bg-white/10 text-white/70 text-xs font-semibold border border-white/10">{g.name}</span>
              ))}
              {year && <span className="text-white/40 text-xs">• {year}</span>}
              {show.number_of_seasons > 0 && <span className="text-white/40 text-xs">• {show.number_of_seasons} Sezon</span>}
              {show.number_of_episodes > 0 && <span className="text-white/40 text-xs">• {show.number_of_episodes} Bölüm</span>}
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[#D4A017] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-white">{show.vote_average.toFixed(1)}</span>
              <span className="text-white/40 text-sm">{show.vote_count.toLocaleString()} oy</span>
            </div>

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
