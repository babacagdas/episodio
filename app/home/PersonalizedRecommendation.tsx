import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { discoverShowsByGenre, getShowDetail, getTvGenreIds } from '@/lib/tmdb';

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
  const slice = watchedIds.slice(0, 18);
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

  let overview = pick.overview?.trim() ?? '';
  if (!overview) {
    try {
      const detail = await getShowDetail(String(pick.id));
      overview = detail.overview?.trim() ?? '';
    } catch {
      overview = '';
    }
  }

  const poster = pick.poster_path ? `${POSTER_BASE}${pick.poster_path}` : FALLBACK;
  const year = pick.first_air_date?.slice(0, 4) ?? '';
  const rating = typeof pick.vote_average === 'number' ? pick.vote_average.toFixed(1) : null;

  return (
    <section className="mb-6 md:mb-8">
      <h2 className="font-headline-md text-headline-md text-white mb-4">Sana Özel Öneri</h2>
      <Link
        href={`/show/${pick.id}`}
        className="group flex max-w-2xl cursor-pointer items-start gap-3 sm:gap-4 border-0 bg-transparent p-0 transition-opacity hover:opacity-90"
      >
        <div className="relative aspect-[2/3] w-[6.5rem] shrink-0 overflow-hidden rounded-md sm:w-28 md:w-32">
          <Image
            src={poster}
            alt={pick.name}
            fill
            sizes="(max-width: 768px) 28vw, 160px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-label-bold text-label-bold text-white line-clamp-2">{pick.name}</h3>
          <p className="mt-1 font-body-md text-sm text-white/65 md:text-base">
            {year ? <span>{year}</span> : null}
            {year && rating ? <span className="mx-2 text-white/25">•</span> : null}
            {rating ? (
              <span className="text-white/70">
                ⭐ {rating}
              </span>
            ) : null}
            {!year && !rating ? <span className="text-white/35">—</span> : null}
          </p>
          {overview ? (
            <p className="mt-2 text-sm leading-relaxed text-white/45 line-clamp-4 md:text-[15px] md:leading-snug md:line-clamp-5">
              {overview}
            </p>
          ) : null}
        </div>
      </Link>
    </section>
  );
}
