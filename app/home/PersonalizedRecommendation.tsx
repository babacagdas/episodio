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

  const poster = pick.poster_path ? `${POSTER_BASE}${pick.poster_path}` : FALLBACK;
  const year = pick.first_air_date?.slice(0, 4) ?? '';

  return (
    <section className="mb-6 md:mb-8">
      <h2 className="font-headline-md text-headline-md text-white mb-4">Sana Özel Öneri</h2>
      <Link
        href={`/show/${pick.id}`}
        className="group flex max-w-lg overflow-hidden rounded-card border border-white/5 transition-colors hover:border-white/20 sm:max-w-xl"
      >
        <div className="relative aspect-[2/3] w-[38%] max-w-[140px] shrink-0 sm:max-w-[156px]">
          <Image
            src={poster}
            alt={pick.name}
            fill
            sizes="(max-width: 768px) 42vw, 200px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
          <p className="font-label-sm mb-1.5 text-[10px] text-white/50">İzlemek İsteyebileceklerin</p>
          <h3 className="font-label-bold text-label-bold text-white drop-shadow-md line-clamp-2">{pick.name}</h3>
          <p className="font-label-sm mt-1 text-[10px] text-gray-300">
            {year && `${year} • `}⭐ {pick.vote_average.toFixed(1)}
          </p>
        </div>
      </Link>
    </section>
  );
}
