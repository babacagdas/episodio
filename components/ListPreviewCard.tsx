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
    <Link href={`/list/${id}`} className={`rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-colors block p-3 ${className}`}>
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#1A1A1A] mb-3 grid grid-cols-2 grid-rows-2">
        {Array.from({ length: 4 }).map((_, idx) => {
          const posterPath = posters[idx];
          const poster = posterPath ? `${POSTER_BASE}${posterPath}` : null;
          return (
            <div key={idx} className="w-full h-full">
              {poster
                ? <img src={poster} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-[#222]"><span className="material-symbols-outlined text-white/20 text-base">movie</span></div>
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
