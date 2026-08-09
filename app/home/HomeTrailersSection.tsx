'use client';

import { useState } from 'react';
import type { TrailerItem } from '@/lib/tmdb';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export default function HomeTrailersSection({ trailers }: { trailers: TrailerItem[] }) {
  const [activeTrailer, setActiveTrailer] = useState<TrailerItem | null>(null);

  if (!trailers || trailers.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C91520]/20 text-[#C91520] shrink-0">
            <span className="material-symbols-outlined text-[20px]">play_circle</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Yeni Dizi Fragmanları</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {trailers.map((trailer) => {
          const backdrop = trailer.backdropPath
            ? `${BACKDROP_BASE}${trailer.backdropPath}`
            : trailer.posterPath
            ? `${POSTER_BASE}${trailer.posterPath}`
            : null;

          return (
            <div
              key={trailer.id}
              onClick={() => setActiveTrailer(trailer)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#121216] border border-white/[0.08] hover:border-white/20 transition-colors duration-200 shadow-md"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#18181c]">
                {backdrop ? (
                  <img
                    src={backdrop}
                    alt={trailer.showName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#18181c]">
                    <span className="material-symbols-outlined text-3xl text-white/20">movie</span>
                  </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play Button Overlay (Compact) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#C91520] text-white shadow-md transition-colors group-hover:bg-[#E50914]">
                    <span className="material-symbols-outlined text-sm sm:text-base ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>

                {/* Top Badge (Compact) */}
                <div className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold text-white backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[9px] sm:text-[10px] text-[#D4A017]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {trailer.voteAverage.toFixed(1)}
                </div>
              </div>

              {/* Text Info */}
              <div className="p-2.5 sm:p-3">
                <h3 className="text-[11px] sm:text-xs font-bold text-white truncate group-hover:text-[#C91520] transition-colors">
                  {trailer.showName}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-white/40 truncate mt-0.5">
                  {trailer.videoTitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* YouTube Video Modal */}
      {activeTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveTrailer(null)}
          />
          <div className="relative z-10 w-full max-w-3xl bg-[#0A0A0D] border border-white/10 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-bold text-white">{activeTrailer.showName}</h3>
                <p className="text-xs text-white/40 truncate max-w-md">{activeTrailer.videoTitle}</p>
              </div>
              <button
                onClick={() => setActiveTrailer(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Embed YouTube Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-lg">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeTrailer.youtubeKey}?autoplay=1`}
                title={activeTrailer.videoTitle}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
