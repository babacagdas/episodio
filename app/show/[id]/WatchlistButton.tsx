'use client';

import { useWatchlist, type WatchlistItem } from '@/lib/useWatchlist';

export default function WatchlistButton({ show }: { show: WatchlistItem }) {
  const { toggle, isInWatchlist } = useWatchlist();
  const inList = isInWatchlist(show.id);

  return (
    <button
      onClick={() => toggle(show)}
      className={`px-5 py-3 border font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 backdrop-blur-sm ${
        inList
          ? 'bg-[#C91520]/[0.18] border-[#C91520]/55 text-[#F2A8AE]'
          : 'bg-white/10 border-white/20 text-white hover:bg-white/[0.18]'
      }`}
    >
      <span className="material-symbols-outlined text-lg" style={inList ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        bookmark
      </span>
      {inList ? 'Listede' : 'Listeye Ekle'}
    </button>
  );
}
