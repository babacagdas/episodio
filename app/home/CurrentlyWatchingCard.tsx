import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

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
    <section className="mb-6 md:mb-8 max-w-xl">
      <Link
        href={`/show/${row.show_id}`}
        className="flex items-stretch gap-3 rounded-xl border border-white/10 bg-[#141414] p-3 transition-colors hover:border-white/20 hover:bg-[#1A1A1A]"
      >
        <div className="relative h-[4.875rem] w-[3.25rem] shrink-0 overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-white/25">
              <span className="material-symbols-outlined text-2xl">movie</span>
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
          <p className="text-[11px] font-medium text-white/45 md:text-xs">▶ Şu an bunu izliyorum</p>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white md:text-base">{row.show_name}</p>
        </div>
      </Link>
    </section>
  );
}
