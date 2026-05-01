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
    <div className="font-body-md text-body-md antialiased min-h-screen pb-24 md:pb-0">
      <Sidebar />

      <div className="md:hidden fixed top-4 left-4 z-50">
        <Link href="/home" className="w-10 h-10 rounded-full bg-[#1A1A1A]/70 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </div>

      <main className="md:ml-[240px] w-full">
        {/* Hero */}
        <section className="relative w-full h-[530px] md:h-[600px]">
          <div className="absolute inset-0">
            {backdrop
              ? <img alt={show.name} className="w-full h-full object-cover object-top" src={backdrop} />
              : <div className="w-full h-full bg-[#141414]" />
            }
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.4) 60%, transparent 100%)' }} />

          <div className="absolute bottom-0 left-0 w-full px-margin-mobile md:px-12 pb-10 flex flex-col items-start max-w-[1200px]">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">{show.name}</h1>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {show.genres.map((g) => (
                <span key={g.id} className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-medium border border-white/10">{g.name}</span>
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
        <section className="px-margin-mobile md:px-12 max-w-[900px] mt-8">
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
