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
  creatorName?: string;
  creatorAvatar?: string | null;
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
  creatorName = 'Kullanıcı',
  creatorAvatar = null,
  className = '',
}: Props) {
  // Use first poster as background backdrop
  const firstPoster = posters[0] ? `${POSTER_BASE}${posters[0]}` : null;

  return (
    <Link
      href={`/list/${id}`}
      className={`relative overflow-hidden rounded-xl bg-transparent border border-white/[0.05] aspect-[16/12] flex flex-col justify-between p-3 sm:p-4 group cursor-pointer shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-transparent hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)] ${className} select-none`}
    >
      {/* Background Poster backdrop with dark overlay */}
      <div className="absolute inset-0 z-0">
        {firstPoster ? (
          <img
            src={firstPoster}
            alt=""
            className="h-full w-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-[#0e1015]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/25 z-10" />
      </div>

      {/* Card Header (Creator info & bookmark button) */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {creatorAvatar ? (
              <img src={creatorAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white/40 text-[9px] font-black leading-none">person</span>
            )}
          </div>
          <span className="text-white/45 text-[9.5px] sm:text-[10.5px] font-bold truncate leading-none pt-0.5">{creatorName}</span>
        </div>

        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="text-white/30 hover:text-white transition-colors duration-200"
          title="Kaydet"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[17px]">bookmark</span>
        </button>
      </div>

      {/* Card Bottom (Title and stats) */}
      <div className="relative z-20 w-full min-w-0">
        <h4 className="text-[11.5px] sm:text-[13px] font-black leading-tight tracking-wide text-white group-hover:text-[#C91520] transition-colors line-clamp-2 truncate-2-lines uppercase">
          {name}
        </h4>
        <div className="text-white/35 text-[9.5px] sm:text-[10.5px] font-bold mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <span>{itemCount} dizi</span>
          <span>&bull;</span>
          <span>{likeCount} kaydetme</span>
        </div>
      </div>
    </Link>
  );
}
