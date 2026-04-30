'use client';

import Link from 'next/link';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

interface Props {
  id: string;
  name: string;
  description?: string | null;
  visibility?: 'public' | 'private';
  posters?: string[];
  itemCount?: number;
  likeCount?: number;
  className?: string;
}

export default function ListPreviewCard({
  id,
  name,
  description,
  visibility,
  posters = [],
  itemCount = 0,
  likeCount = 0,
  className = '',
}: Props) {
  return (
    <Link href={`/list/${id}`} className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/25 transition-colors ${className}`}>
      <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-[#111] mb-3 grid grid-cols-2 grid-rows-2 gap-[1px]">
        {Array.from({ length: 4 }).map((_, idx) => {
          const posterPath = posters[idx];
          const poster = posterPath ? `${POSTER_BASE}${posterPath}` : null;
          return (
            <div key={idx} className="bg-[#1A1A1A]">
              {poster
                ? <img src={poster} alt={name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-base">movie</span></div>
              }
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white truncate">{name}</h4>
        {visibility && <span className="text-[11px] text-white/35 uppercase">{visibility === 'public' ? 'Public' : 'Private'}</span>}
      </div>
      {description && <p className="text-xs text-white/45 line-clamp-2 mb-2">{description}</p>}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>{itemCount} dizi</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">favorite</span>
          {likeCount}
        </span>
      </div>
    </Link>
  );
}
