'use client';

import { useWatchlist, type WatchlistItem } from '@/lib/useWatchlist';

export default function WatchlistButton({ show }: { show: WatchlistItem }) {
  const { toggle, isInWatchlist } = useWatchlist();
  const inList = isInWatchlist(show.id);

  return (
    <button
      onClick={() => toggle(show)}
      className={`px-6 py-2.5 border font-semibold text-sm rounded-full transition-all flex items-center gap-2 backdrop-blur-sm ${
        inList
          ? 'bg-[#E50914]/20 border-[#E50914]/50 text-[#E50914]'
          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
      }`}
    >
      <span className="material-symbols-outlined text-lg" style={inList ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        bookmark
      </span>
      {inList ? 'Listede' : 'Listeye Ekle'}
    </button>
  );
}
