import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

interface WatchingShow {
  show_id: number;
  show_name: string;
  poster_path: string | null;
  seasonNum: number;
  episodeNum: number;
  hasComment: boolean;
  linkHref: string;
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
      const showIds = rows.map((r) => r.show_id);

      // Fetch user's latest episode comments for these shows
      const { data: latestComments } = await supabase
        .from('episode_discussions')
        .select('show_id, season_number, episode_number, created_at')
        .eq('user_id', user.id)
        .in('show_id', showIds)
        .order('created_at', { ascending: false });

      const commentMap: Record<number, { season: number; episode: number }> = {};
      if (latestComments) {
        for (const c of latestComments) {
          if (!commentMap[c.show_id]) {
            commentMap[c.show_id] = {
              season: c.season_number,
              episode: c.episode_number,
            };
          }
        }
      }

      watchingList = await Promise.all(
        rows.map(async (row) => {
          let resolvedName = row.show_name;
          let resolvedPoster = row.poster_path;

          if (!resolvedName || resolvedName.startsWith('Show #') || resolvedName.startsWith('Dizi #')) {
            // 1. Try watchlist
            const { data: wlRow } = await supabase
              .from('watchlist')
              .select('show_name, poster_path')
              .eq('user_id', user.id)
              .eq('show_id', row.show_id)
              .maybeSingle();

            if (wlRow?.show_name && !wlRow.show_name.startsWith('Show #') && !wlRow.show_name.startsWith('Dizi #')) {
              resolvedName = wlRow.show_name;
              if (wlRow.poster_path) resolvedPoster = wlRow.poster_path;
            } else {
              // 2. Try TMDB API
              const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
              if (apiKey) {
                try {
                  const res = await fetch(`https://api.themoviedb.org/3/tv/${row.show_id}?api_key=${apiKey}&language=tr-TR`);
                  if (res.ok) {
                    const tmdb = await res.json();
                    if (tmdb.name) {
                      resolvedName = tmdb.name;
                      if (tmdb.poster_path) resolvedPoster = tmdb.poster_path;
                    }
                  }
                } catch {
                  // ignore
                }
              }
            }

            // Permanently repair bad watch_status row in database
            if (resolvedName && !resolvedName.startsWith('Show #') && !resolvedName.startsWith('Dizi #')) {
              supabase
                .from('watch_status')
                .update({ show_name: resolvedName, poster_path: resolvedPoster })
                .eq('user_id', user.id)
                .eq('show_id', row.show_id)
                .then(() => {});
            }
          }

          const comment = commentMap[row.show_id];
          const seasonNum = comment ? comment.season : 1;
          const episodeNum = comment ? comment.episode : 1;
          const hasComment = !!comment;
          const linkHref = comment
            ? `/show/${row.show_id}/season/${seasonNum}/episode/${episodeNum}`
            : `/show/${row.show_id}`;

          return {
            show_id: row.show_id,
            show_name: resolvedName || `Dizi #${row.show_id}`,
            poster_path: resolvedPoster,
            seasonNum,
            episodeNum,
            hasComment,
            linkHref,
          };
        })
      );
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
                İzlemeye başladığın ve yorum yaptığın içerikler burada kaldığın bölüm takibiyle görünür.
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
                href={show.linkHref}
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
                  
                  {/* Dinamik Sezon & Bölüm */}
                  <p className="text-[11px] font-bold text-white/50 mt-0.5">
                    {show.seasonNum}. Sezon &bull; {show.episodeNum}. Bölüm
                  </p>

                  <span className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-[#D4A017] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[13px]">rate_review</span>
                    <span>Yorumla ve Puanla</span>
                  </span>

                  {/* İlerleme Çubuğu */}
                  <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C91520] to-[#D4A017] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, show.episodeNum * 12)}%` }}
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
