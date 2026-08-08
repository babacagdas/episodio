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
              className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#121216] border border-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#18181c]">
                {backdrop ? (
                  <img
                    src={backdrop}
                    alt={trailer.showName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#18181c]">
                    <span className="material-symbols-outlined text-4xl text-white/20">movie</span>
                  </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#C91520] text-white shadow-[0_0_20px_rgba(201,21,32,0.6)] group-hover:scale-110 group-hover:bg-[#E50914] transition-all duration-300">
                    <span className="material-symbols-outlined text-xl sm:text-2xl ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>

                {/* Top Badge */}
                <div className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-md border border-white/10">
                  <span className="material-symbols-outlined text-[10px] sm:text-[12px] text-[#D4A017]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
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
