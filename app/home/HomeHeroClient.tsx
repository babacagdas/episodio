'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Show } from '@/lib/tmdb';

const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

const GENRE_MAP: Record<number, string> = {
  10759: 'Aksiyon & Macera',
  16: 'Animasyon',
  35: 'Komedi',
  80: 'Suç',
  99: 'Belgesel',
  18: 'Dram',
  10751: 'Aile',
  9648: 'Gizem',
  10765: 'Bilim Kurgu & Fantastik',
  10768: 'Savaş & Politika',
  37: 'Vahşi Batı',
};

interface HomeHeroClientProps {
  shows: Show[];
}

export default function HomeHeroClient({ shows = [] }: HomeHeroClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    if (shows.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % shows.length);
  }, [shows.length]);

  const prevSlide = useCallback(() => {
    if (shows.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + shows.length) % shows.length);
  }, [shows.length]);

  useEffect(() => {
    if (isPaused || shows.length <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, shows.length, nextSlide]);

  if (!shows || shows.length === 0) return null;

  const currentShow = shows[currentIndex];

  const genres = currentShow.genre_ids
    ?.map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, 2);

  const releaseYear = currentShow.first_air_date
    ? new Date(currentShow.first_air_date).getFullYear()
    : null;

  return (
    <section 
      className="relative mb-8 w-full select-none overflow-hidden rounded-3xl bg-[#000000]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Container with Crossfade Transition */}
      <div className="relative h-[420px] w-full sm:h-[460px] md:h-[500px]">
        {shows.map((show, idx) => {
          const bUrl = show.backdrop_path
            ? show.backdrop_path.startsWith('/')
              ? `${TMDB_BACKDROP_BASE}${show.backdrop_path}`
              : show.backdrop_path
            : '/splash_bg.jpg';

          const isActive = idx === currentIndex;

          return (
            <div
              key={show.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={bUrl}
                alt={show.name}
                fill
                priority={idx === 0}
                quality={85}
                sizes="(max-width: 768px) 100vw, (max-width: 1536px) calc(100vw - 280px), 1280px"
                className="object-cover object-top opacity-70 transition-transform duration-10000 ease-linear scale-105"
              />
            </div>
          );
        })}

        {/* Natural Borderless Dark Gradients - Seamlessly blending with page #000000 */}
        {/* Left-to-Right Gradient */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#000000] via-[#000000]/85 via-40% md:via-35% to-transparent" />
        {/* Bottom-to-Top Gradient */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#000000] via-[#000000]/50 via-25% to-transparent" />
        {/* Top Gradient Overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#000000]/60 via-transparent to-transparent" />

        {/* Foreground Content */}
        <div className="relative z-30 flex h-full flex-col justify-end p-6 sm:p-8 md:p-10">
          
          {/* Left Content Area */}
          <div className="relative z-10 max-w-2xl flex flex-col justify-end h-full">

            {/* Show Title */}
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-xl leading-none">
              {currentShow.name}
            </h1>

            {/* Overview */}
            {currentShow.overview && (
              <p className="mt-3 line-clamp-2 max-w-xl text-xs sm:text-sm font-medium leading-relaxed text-white/70 sm:line-clamp-3">
                {currentShow.overview}
              </p>
            )}

            {/* Call to Action Buttons (Smaller/Compact) */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={`/show/${currentShow.id}`}
                className="group/btn inline-flex items-center gap-1.5 rounded-full bg-[#C91520] px-3.5 py-1.5 text-[11.5px] font-bold text-white shadow-md transition-all duration-200 hover:bg-[#E21825] active:scale-95"
              >
                <span>Detayları İncele</span>
                <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover/btn:translate-x-0.5">
                  arrow_forward
                </span>
              </Link>

              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 bg-transparent px-3 py-1.5 text-[11.5px] font-bold text-white/60 hover:text-white transition-colors active:scale-95 cursor-pointer select-none"
              >
                <span className="material-symbols-outlined text-[14px]">search</span>
                <span>Tüm Diziler</span>
              </Link>
            </div>
          </div>

          {/* Bottom Controls: Navigation Arrows & Slide Thumbnails */}
          <div className="mt-6 flex items-center justify-between gap-4 pt-2">
            
            {/* Pagination Indicators / Dots */}
            <div className="flex items-center gap-2">
              {shows.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentIndex
                      ? 'w-8 bg-[#C91520]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Right Mini Thumbnails & Prev/Next Arrows */}
            <div className="flex items-center gap-3">
              {/* Mini Slide Preview Thumbnails (Visible on lg screens) */}
              <div className="hidden lg:flex items-center gap-2 mr-2">
                {shows.map((show, idx) => {
                  const pUrl = show.poster_path
                    ? show.poster_path.startsWith('/')
                      ? `${TMDB_POSTER_BASE}${show.poster_path}`
                      : show.poster_path
                    : null;

                  if (!pUrl) return null;

                  return (
                    <button
                      key={show.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative h-12 w-8 overflow-hidden rounded-md border transition-all duration-300 ${
                        idx === currentIndex
                          ? 'border-[#C91520] scale-110 shadow-md ring-2 ring-[#C91520]/40'
                          : 'border-white/10 opacity-50 hover:opacity-100 hover:scale-105'
                      }`}
                      title={show.name}
                    >
                      <img src={pUrl} alt={show.name} className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={prevSlide}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Önceki Dizi"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  onClick={nextSlide}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Sonraki Dizi"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
