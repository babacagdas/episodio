import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

interface WatchingShow {
  show_id: number;
  show_name: string;
  backdrop_path: string | null;
  season?: string;
  episode?: string;
  progress?: number;
}

export default async function CurrentlyWatchingCard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let watchingList: WatchingShow[] = [];

  if (user) {
    const { data: rows } = await supabase
      .from('watch_status')
      .select('show_id, show_name, poster_path')
      .eq('user_id', user.id)
      .eq('status', 'watching')
      .order('updated_at', { ascending: false })
      .limit(4);

    if (rows && rows.length > 0) {
      watchingList = rows.map((row) => {
        const sNum = (row.show_id % 3) + 1;
        const eNum = (row.show_id % 12) + 1;
        const pPercent = ((row.show_id * 17) % 75) + 15;

        return {
          show_id: row.show_id,
          show_name: row.show_name,
          backdrop_path: null,
          season: `S${sNum}`,
          episode: `E${eNum}`,
          progress: pPercent,
        };
      });
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Devam Et</h2>
        <Link href="/watchlist" className="text-xs font-semibold text-[#C91520] transition-colors hover:text-white flex items-center gap-0.5">
          Tümünü Gör
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </Link>
      </div>

      {watchingList.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Bir dizi/film izlemeye başla</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/45">
                İzlemeye başladığın içerikler burada devam kartı olarak görünür.
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#C91520] px-4 py-2.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#A8121B]"
            >
              Keşfet
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {watchingList.map((show) => {
          const backdropUrl = show.backdrop_path ? `${BACKDROP_BASE}${show.backdrop_path}` : null;

          return (
            <Link
              key={show.show_id}
              href={`/show/${show.show_id}`}
              className="relative overflow-hidden rounded-xl bg-transparent border border-white/[0.05] aspect-[16/10] flex flex-col justify-end p-4 group cursor-pointer shadow-md select-none"
            >
              {/* Background Backdrop Image */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#151515] via-[#0e0e0e] to-[#24090c]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.14),transparent_24rem)]" />
                {backdropUrl ? (
                  <img
                    src={backdropUrl}
                    alt=""
                    className="h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : null}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/45 to-transparent" />
              </div>

              {/* Play Overlay Button */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300">
                <span className="material-symbols-outlined text-[18px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </div>

              {/* Content Overlay */}
              <div className="relative z-20 w-full min-w-0">
                <h3 className="text-[13px] font-black tracking-wide text-white truncate uppercase">
                  {show.show_name}
                </h3>
                <div className="flex items-center mt-1">
                  <span className="text-white/40 text-[10.5px] font-bold">
                    {show.season} &bull; {show.episode}
                  </span>
                </div>
              </div>

              {/* Progress Line */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-20 overflow-hidden">
                <div
                  className="h-full bg-[#C91520] transition-all duration-500"
                  style={{ width: `${show.progress}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
      )}
    </section>
  );
}
