'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const WATCHED_PAGE_SIZE = 12;

interface WatchlistRow {
  show_id: number;
  show_name: string;
  poster_path: string | null;
}

interface WatchedShowsSectionProps {
  profileId: string;
  canViewWatched: boolean;
  initialShows: WatchlistRow[];
  totalCount: number;
}

export default function WatchedShowsSection({
  profileId,
  canViewWatched,
  initialShows,
  totalCount,
}: WatchedShowsSectionProps) {
  const [shows, setShows] = useState(initialShows);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  async function loadMore() {
    if (loadingMore || !canViewWatched) return;
    setLoadingMore(true);
    setError('');

    const from = shows.length;
    const to = from + WATCHED_PAGE_SIZE - 1;
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from('watch_status')
      .select('show_id, show_name, poster_path')
      .eq('user_id', profileId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (loadError) {
      setError(loadError.message);
    } else if (data?.length) {
      setShows((prev) => [...prev, ...data]);
    }
    setLoadingMore(false);
  }

  return (
    <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-8 mb-16">
      <h2 className="text-white font-semibold mb-4">İzlediklerim</h2>
      {!canViewWatched ? (
        <div className="glass-card p-5 text-sm text-white/40">
          Bu kullanıcı izlediklerini gizli tutuyor.
        </div>
      ) : shows.length === 0 ? (
        <div className="glass-card p-5 text-sm text-white/40">
          Bu kullanıcının izlediği dizi şu an yok.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {shows.map((item) => {
              const poster = item.poster_path ? `${POSTER_BASE}${item.poster_path}` : null;
              return (
                <Link
                  key={item.show_id}
                  href={`/show/${item.show_id}`}
                  className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 transition-all duration-300 block"
                >
                  {poster
                    ? <img alt={item.show_name} className="w-full h-full object-cover" src={poster} />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-3">
                    <h4 className="text-xs font-semibold text-white truncate">{item.show_name}</h4>
                  </div>
                </Link>
              );
            })}
          </div>
          {error && <p className="mt-4 text-center text-xs text-[#C91520]">{error}</p>}
          {shows.length < totalCount && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
              >
                {loadingMore ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : null}
                Devamını Gör
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
