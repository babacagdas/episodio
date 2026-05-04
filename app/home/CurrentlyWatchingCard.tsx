import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w154';

export default async function CurrentlyWatchingCard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from('watch_status')
    .select('show_id, show_name, poster_path')
    .eq('user_id', user.id)
    .eq('status', 'watching')
    .order('updated_at', { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row) return null;

  const posterUrl = row.poster_path ? `${POSTER_BASE}${row.poster_path}` : null;

  return (
    <section className="mb-6 md:mb-8 max-w-2xl">
      <Link
        href={`/show/${row.show_id}`}
        className="flex items-stretch gap-4 rounded-xl p-1 transition-opacity hover:opacity-90"
      >
        <div className="relative aspect-[2/3] w-[5.75rem] shrink-0 overflow-hidden rounded-md ring-1 ring-white/15 sm:w-24 md:w-[6.75rem]">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-white/5 text-white/25">
              <span className="material-symbols-outlined text-3xl">movie</span>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1">
          <p className="text-xs font-medium text-white/45 sm:text-sm">▶ Şu an bunu izliyorum</p>
          <p className="line-clamp-2 text-base font-semibold leading-snug text-white sm:text-lg">{row.show_name}</p>
        </div>
      </Link>
    </section>
  );
}
