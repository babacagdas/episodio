import Image from 'next/image';
import Link from 'next/link';
import type { Show } from '@/lib/tmdb';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const FALLBACK = 'https://placehold.co/342x513/141414/555?text=Poster+Yok';

export default function ShowCard({ show, rank }: { show: Show; rank: number }) {
  const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : FALLBACK;
  const year = show.first_air_date?.slice(0, 4) ?? '';

  return (
    <Link
      href={`/show/${show.id}`}
      className="aspect-[2/3] relative rounded-card overflow-hidden group cursor-pointer border border-white/5 block"
    >
      <Image
        src={poster}
        alt={show.name}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {rank <= 3 && (
        <div className="absolute top-2 left-2 bg-[#1A1A1A] text-white font-label-sm text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-white/10 backdrop-blur-md">
          #{rank} Sıra
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-[#0A0A0A]/90 to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
        <h3 className="font-label-bold text-label-bold text-white mb-1 drop-shadow-md line-clamp-2">
          {show.name}
        </h3>
        <p className="font-label-sm text-[10px] text-gray-300">
          {year && `${year} • `}⭐ {show.vote_average.toFixed(1)}
        </p>
      </div>
    </Link>
  );
}
