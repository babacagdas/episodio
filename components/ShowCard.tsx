import Image from 'next/image';
import Link from 'next/link';
import type { Show } from '@/lib/tmdb';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const FALLBACK = 'https://placehold.co/342x513/141414/555?text=Poster+Yok';

export default function ShowCard({
  show,
  rank,
  isWatched,
  onToggleWatch,
}: {
  show: Show;
  rank?: number;
  isWatched?: boolean;
  onToggleWatch?: (show: Show, e: React.MouseEvent) => void;
}) {
  const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : FALLBACK;
  const year = show.first_air_date?.slice(0, 4) ?? '';
  const rating = typeof show.vote_average === 'number' ? show.vote_average.toFixed(1) : null;

  return (
    <Link
      href={`/show/${show.id}`}
      prefetch={true}
      className="group relative block aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111] shadow-md transition-colors duration-200 hover:border-white/20"
    >
      {/* Poster Image (Stationary on Hover) */}
      <Image
        src={poster}
        alt={show.name}
        fill
        sizes="(max-width: 768px) 33vw, (max-width: 1024px) 16vw, 16vw"
        className="object-cover"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent opacity-90" />

      {/* Quick Watch Status Toggle (Letterboxd Style Eye Button) */}
      {onToggleWatch && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWatch(show, e);
          }}
          className={`absolute left-1.5 top-1.5 z-20 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border transition-all cursor-pointer ${
            isWatched
              ? 'bg-[#C91520] border-[#C91520] text-white shadow-[0_0_10px_rgba(201,21,32,0.6)]'
              : 'bg-black/60 border-white/20 text-white/50'
          }`}
          title={isWatched ? 'İzleme Listenden Çıkar' : 'İzledim Olarak İşaretle'}
        >
          <span className="material-symbols-outlined text-[13px] sm:text-[15px]">
            {isWatched ? 'visibility' : 'visibility_off'}
          </span>
        </button>
      )}

      {/* Compact Rating Badge (Tüm kutu, yıldız ve yazı mobilde orantılı %25 küçültüldü) */}
      {rating && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-sm scale-75 sm:scale-100 origin-top-right">
          <span className="material-symbols-outlined text-[10px] text-[#FFC107]" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span>{rating}</span>
        </div>
      )}

      {/* Compact Rank Badge */}
      {rank !== undefined && rank > 0 && !onToggleWatch && (
        <div className="absolute left-1.5 top-1.5 flex items-center justify-center rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white/90 backdrop-blur-sm">
          #{rank}
        </div>
      )}

      {/* Small Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/75 text-white backdrop-blur-sm">
          <span className="material-symbols-outlined text-base ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_arrow
          </span>
        </div>
      </div>

      {/* Bottom Metadata (Stationary Text) */}
      <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end">
        <h3 className="text-xs sm:text-sm font-bold leading-snug text-white line-clamp-2">
          {show.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-white/50">
          {year && <span>{year}</span>}
          {year && <span className="h-1 w-1 rounded-full bg-white/30" />}
          <span>Dizi</span>
        </div>
      </div>
    </Link>
  );
}
