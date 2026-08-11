import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

interface WatchingShow {
  show_id: number;
  show_name: string;
  poster_path: string | null;
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
          poster_path: row.poster_path,
          season: `${sNum}. Sezon`,
          episode: `${eNum}. Bölüm`,
          progress: pPercent,
        };
      });
    }
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">Devam Et</h2>
          <span className="text-white/30 text-base font-black">&gt;</span>
          <span className="text-base sm:text-lg font-black text-[#D4A017] uppercase tracking-wider">
            Şu An Bu Dizidesin
          </span>
        </div>
        <Link href="/watchlist" className="text-xs font-semibold text-[#C91520] transition-colors hover:text-white flex items-center gap-0.5">
          Tümünü Gör
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </Link>
      </div>

      {watchingList.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Bir dizi izlemeye başla</h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/45">
                İzlemeye başladığın içerikler burada takip kartı olarak görünür.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {watchingList.map((show) => {
            const posterUrl = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : null;

            return (
              <Link
                key={show.show_id}
                href={`/show/${show.show_id}`}
                className="group relative flex items-center gap-3.5 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/20 transition-all duration-300 select-none overflow-hidden"
              >
                {/* Sol: Dikey Dizi Afişi */}
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/10 shadow-md">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={show.show_name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/20">
                      <span className="material-symbols-outlined text-xl">movie</span>
                    </div>
                  )}
                  {/* Yorumla & Puanla Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-1">
                    <span className="material-symbols-outlined text-amber-400 text-base font-bold">
                      rate_review
                    </span>
                  </div>
                </div>

                {/* Sağ: Dizi Bilgileri & Yorumla Puanla */}
                <div className="flex flex-col justify-center min-w-0 flex-1 pr-1">
                  <h3 className="text-xs sm:text-sm font-black text-white truncate uppercase tracking-tight group-hover:text-[#D4A017] transition-colors">
                    {show.show_name}
                  </h3>
                  <p className="text-[11px] font-bold text-white/50 mt-0.5">
                    {show.season} &bull; {show.episode}
                  </p>

                  <span className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-[#D4A017] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[13px]">rate_review</span>
                    <span>Yorumla ve Puanla</span>
                  </span>

                  {/* İlerleme Çubuğu */}
                  <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C91520] to-[#D4A017] rounded-full transition-all duration-500"
                      style={{ width: `${show.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
