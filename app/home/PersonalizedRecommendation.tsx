import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { discoverShowsByGenre, getTvGenreIds } from '@/lib/tmdb';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const FALLBACK = 'https://placehold.co/342x513/141414/555?text=Poster+Yok';

export default async function PersonalizedRecommendation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: watchedRows } = await supabase
    .from('watch_status')
    .select('show_id')
    .eq('user_id', user.id)
    .in('status', ['completed', 'watching'])
    .order('updated_at', { ascending: false })
    .limit(30);

  const watchedIds = [...new Set((watchedRows ?? []).map((r) => r.show_id))];
  if (watchedIds.length === 0) return null;

  const genreCounts = new Map<number, number>();
  const slice = watchedIds.slice(0, 6);
  await Promise.all(
    slice.map(async (sid) => {
      const gids = await getTvGenreIds(String(sid));
      for (const g of gids) {
        genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
      }
    })
  );

  if (genreCounts.size === 0) return null;

  const sorted = [...genreCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const topGenreId = sorted[0]?.[0];
  if (topGenreId == null) return null;

  const discovered = await discoverShowsByGenre(topGenreId);
  const watchedSet = new Set(watchedIds);
  const candidates = discovered.filter((s) => !watchedSet.has(s.id));
  if (candidates.length === 0) return null;

  const pool = candidates.slice(0, 24);
  const pick = pool[Math.floor(Math.random() * pool.length)];

  const overview = pick.overview?.trim() ?? '';

  const poster = pick.poster_path ? `${POSTER_BASE}${pick.poster_path}` : FALLBACK;
  const backdrop = null;
  const year = pick.first_air_date?.slice(0, 4) ?? '';
  const rating = typeof pick.vote_average === 'number' ? pick.vote_average.toFixed(1) : null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="premium-section-title">Sana Özel Öneri</h2>
        </div>
      </div>

      <Link
        href={`/show/${pick.id}`}
        className="group relative flex min-h-[18rem] overflow-hidden rounded-xl border border-white/[0.06] bg-transparent shadow-[0_18px_60px_rgba(0,0,0,0.34)] transition-colors duration-300 hover:border-white/[0.12]"
      >
        {backdrop ? (
          <Image
            src={backdrop}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover opacity-38 transition-opacity duration-300 group-hover:opacity-45"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#090909_0%,rgba(9,9,9,0.92)_34%,rgba(9,9,9,0.46)_100%)]" />
        <div className="relative z-10 flex w-full flex-col gap-5 p-5 sm:flex-row sm:p-6 md:p-7">
          <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#111] shadow-[0_18px_38px_rgba(0,0,0,0.38)] sm:w-32 md:w-36">
            <Image
              src={poster}
              alt={pick.name}
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 max-w-2xl flex-1 flex-col justify-center">
            <h3 className="line-clamp-2 text-2xl font-bold leading-tight text-white md:text-4xl">{pick.name}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/62">
              {year ? <span>{year}</span> : null}
              {year && rating ? <span className="h-1 w-1 rounded-full bg-white/30" /> : null}
              {rating ? (
                <span className="inline-flex items-center gap-1 text-white/75">
                  <span className="material-symbols-outlined text-[15px] text-[#D4A017]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {rating}
                </span>
              ) : null}
            </div>
            {overview ? (
              <p className="mt-4 line-clamp-4 max-w-xl text-sm leading-relaxed text-white/58 md:text-[15px]">
                {overview}
              </p>
            ) : null}
            <div className="mt-5 inline-flex w-[112px] items-center justify-center rounded-full bg-white px-3 py-2 text-center text-xs font-bold text-black transition-opacity group-hover:opacity-90">
              Detayları Gör
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
