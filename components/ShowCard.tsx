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
      className="aspect-[2/3] relative block overflow-hidden rounded-xl border border-white/[0.08] bg-[#111] shadow-[0_16px_36px_rgba(0,0,0,0.28)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_22px_52px_rgba(0,0,0,0.42)] group"
    >
      <Image
        src={poster}
        alt={show.name}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.055]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/0 transition group-hover:ring-white/15" />

      {rank <= 3 && (
        <div className="absolute left-2 top-2 rounded-md border border-white/15 bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          #{rank} Sıra
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-3">
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-md">
          {show.name}
        </h3>
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/[0.68]">
          {year && <span>{year}</span>}
          {year && <span className="h-1 w-1 rounded-full bg-white/30" />}
          <span className="inline-flex items-center gap-1 text-white/[0.78]">
            <span className="material-symbols-outlined text-[13px] text-[#D4A017]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            {show.vote_average.toFixed(1)}
          </span>
        </p>
      </div>
    </Link>
  );
}
