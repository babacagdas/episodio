import Image from 'next/image';
import Link from 'next/link';
import type { Show } from '@/lib/tmdb';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const FALLBACK = 'https://placehold.co/342x513/141414/555?text=Poster+Yok';

export default function ShowCard({ show, rank }: { show: Show; rank?: number }) {
  const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : FALLBACK;
  const year = show.first_air_date?.slice(0, 4) ?? '';
  const rating = typeof show.vote_average === 'number' ? show.vote_average.toFixed(1) : null;

  return (
    <Link
      href={`/show/${show.id}`}
      className="group relative block aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d11] shadow-[0_14px_36px_rgba(0,0,0,0.38)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#C91520]/50 hover:shadow-[0_20px_48px_rgba(201,21,32,0.22)]"
    >
      {/* Poster Image */}
      <Image
        src={poster}
        alt={show.name}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
      />

      {/* Top Gradient for Badge Readability */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 via-black/20 to-transparent opacity-80" />

      {/* Bottom Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300" />

      {/* Hover Ring Highlight */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 group-hover:ring-white/20 transition-all duration-300" />

      {/* Top Right Rating Badge */}
      {rating && (
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-white/10 bg-black/65 px-2 py-0.5 text-[11px] font-extrabold text-white backdrop-blur-md shadow-md transition-transform duration-300 group-hover:scale-105">
          <span className="material-symbols-outlined text-[12px] text-[#FFC107]" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span>{rating}</span>
        </div>
      )}

      {/* Top Left Rank Badge */}
      {rank !== undefined && rank > 0 && (
        <div
          className={`absolute left-2.5 top-2.5 flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border shadow-lg ${
            rank === 1
              ? 'bg-amber-500/85 border-amber-300/50 text-amber-950 shadow-amber-900/40'
              : rank === 2
              ? 'bg-slate-200/90 border-slate-100/50 text-slate-950 shadow-slate-900/40'
              : rank === 3
              ? 'bg-amber-700/90 border-amber-400/50 text-white shadow-amber-950/40'
              : 'bg-black/65 border-white/10 text-white/90'
          }`}
        >
          #{rank}
        </div>
      )}

      {/* Play Icon Subtle Overlay on Hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C91520]/90 text-white shadow-[0_0_24px_rgba(201,21,32,0.8)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
          <span className="material-symbols-outlined text-2xl ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_arrow
          </span>
        </div>
      </div>

      {/* Bottom Metadata */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col justify-end">
        <h3 className="text-xs sm:text-sm font-extrabold leading-snug text-white drop-shadow-md group-hover:text-[#FF3B47] transition-colors line-clamp-2">
          {show.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
          {year && <span>{year}</span>}
          {year && <span className="h-1 w-1 rounded-full bg-white/30" />}
          <span className="text-white/40 group-hover:text-white/60 transition-colors">Dizi</span>
        </div>
      </div>
    </Link>
  );
}

