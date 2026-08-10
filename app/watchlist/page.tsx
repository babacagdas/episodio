'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import { useWatchlist } from '@/lib/useWatchlist';
import ShowCard from '@/components/ShowCard';
import { CardSkeleton } from '@/components/Skeletons';

export default function WatchlistPage() {
  const { watchlist, loading } = useWatchlist();

  return (
    <div className="font-body-md min-h-screen antialiased pb-24 md:pb-0 pt-[60px] md:pt-0 overflow-x-hidden">
      <MobileHeader />
      <Sidebar />

      <main className="md:ml-[200px] md:w-[calc(100%-200px)] w-full px-6 md:px-12 pt-8 pb-24 flex flex-col gap-10 overflow-x-hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">İzleme Listesi</h1>
          <p className="text-sm text-white/40 mt-1">Kaydettiğin dizileri buradan takip edebilirsin.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-[#121216] border border-white/5 text-center">
            <span className="material-symbols-outlined text-4xl text-white/20 mb-2">bookmark_border</span>
            <p className="text-sm text-white/60 font-semibold">Henüz izleme listenizde dizi yok.</p>
            <Link href="/search" className="mt-4 text-xs text-[#C91520] hover:text-white transition-colors">
              Keşfetmeye başla →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {watchlist.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
