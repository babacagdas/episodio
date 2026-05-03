'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import { useWatchlist } from '@/lib/useWatchlist';
import { CardSkeleton } from '@/components/Skeletons';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export default function WatchlistPage() {
  const { watchlist, loading } = useWatchlist();

  return (
    <div className="font-body-md min-h-screen antialiased pb-24 md:pb-0 overflow-x-hidden">
      <MobileHeader />
      <Sidebar />

      <main className="md:ml-[240px] md:w-[calc(100%-240px)] w-full px-6 md:px-12 pt-8 pb-24 flex flex-col gap-10 overflow-x-hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">İzleme Listesi</h1>
          <p className="text-sm text-white/40 mt-1">Kaydettiğin dizileri buradan takip edebilirsin.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <span className="material-symbols-outlined text-5xl mb-3">bookmark</span>
            <p className="text-sm">İzleme listene henüz dizi eklemedin.</p>
            <Link href="/search" className="mt-4 text-xs text-[#E50914] hover:text-white transition-colors">
              Keşfetmeye başla →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {watchlist.map((show) => {
              const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : null;
              return (
                <Link
                  key={show.id}
                  href={`/show/${show.id}`}
                  className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 hover:scale-[1.02] transition-all duration-300 block"
                >
                  {poster ? (
                    <img alt={show.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={poster} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/20 text-4xl">movie</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-full p-3">
                    <h4 className="text-xs font-semibold text-white truncate">{show.name}</h4>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
