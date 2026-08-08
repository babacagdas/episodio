'use client';

import { useWatchlist, type WatchlistItem } from '@/lib/useWatchlist';

export default function WatchlistButton({ show }: { show: WatchlistItem }) {
  const { toggle, isInWatchlist } = useWatchlist();
  const inList = isInWatchlist(show.id);

  return (
    <button
      onClick={() => toggle(show)}
      className={`px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 border backdrop-blur-md ${
        inList
          ? 'bg-[#C91520]/20 border-[#C91520]/40 text-[#EF4444]'
          : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-white/90 hover:text-white'
      }`}
    >
      <span className="material-symbols-outlined text-base" style={inList ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        bookmark
      </span>
      <span>{inList ? 'Listede' : 'İzleneceklere Ekle'}</span>
    </button>
  );
}
