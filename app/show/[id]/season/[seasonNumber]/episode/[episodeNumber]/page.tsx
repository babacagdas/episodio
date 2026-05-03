import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';
import { getSeasonEpisodes, getShowDetail } from '@/lib/tmdb';
import EpisodeDiscussion from './EpisodeDiscussion';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const STILL_BASE = 'https://image.tmdb.org/t/p/w780';

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string; seasonNumber: string; episodeNumber: string }>;
}) {
  const { id, seasonNumber, episodeNumber } = await params;
  const show = await getShowDetail(id);
  const episodes = await getSeasonEpisodes(id, Number(seasonNumber));
  const episode = episodes.find((item) => item.episode_number === Number(episodeNumber));

  if (!episode) {
    return (
      <div className="min-h-screen text-white bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-lg font-semibold mb-2">Bölüm bulunamadı</p>
          <Link href={`/show/${id}`} className="text-[#D4A017] hover:text-white transition-colors text-sm">
            Dizi detayına geri dön
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = episode.still_path
    ? `${STILL_BASE}${episode.still_path}`
    : show.backdrop_path
      ? `${BACKDROP_BASE}${show.backdrop_path}`
      : null;

  return (
    <div className="font-body-md text-body-md antialiased min-h-screen pb-24 md:pb-0 overflow-x-hidden">
      <Sidebar />

      <div className="md:hidden fixed top-4 left-4 z-50">
        <Link href={`/show/${id}`} className="w-10 h-10 rounded-full bg-[#1A1A1A]/70 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </div>

      <main className="md:ml-[240px] md:w-[calc(100%-240px)] w-full overflow-x-hidden">
        <section className="relative w-full h-[430px] md:h-[520px]">
          <div className="absolute inset-0">
            {heroImage
              ? <img alt={episode.name} className="w-full h-full object-cover object-top" src={heroImage} />
              : <div className="w-full h-full bg-[#141414]" />
            }
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.4) 60%, transparent 100%)' }} />

          <div className="absolute bottom-0 left-0 w-full px-margin-mobile md:px-12 pb-10 max-w-[1200px] mx-auto">
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-2">
              {show.name} • Sezon {seasonNumber} • Bölüm {episode.episode_number}
            </p>
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-2">{episode.name}</h1>
            <div className="flex items-center gap-3 text-xs text-white/40">
              {episode.runtime && <span>{episode.runtime} dk</span>}
              {episode.air_date && <span>{episode.air_date}</span>}
              {episode.vote_average > 0 && <span>TMDB {episode.vote_average.toFixed(1)}</span>}
            </div>
          </div>
        </section>

        <section className="px-margin-mobile md:px-12 max-w-[900px] mt-8 w-full overflow-x-hidden">
          {episode.overview && (
            <p className="text-white/60 text-sm leading-relaxed mb-8">{episode.overview}</p>
          )}
          <EpisodeDiscussion
            showId={show.id}
            seasonNumber={Number(seasonNumber)}
            episodeNumber={Number(episodeNumber)}
          />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
