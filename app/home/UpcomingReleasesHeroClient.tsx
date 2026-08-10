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

interface UpcomingReleasesHeroClientProps {
  shows: Show[];
}

export default function UpcomingReleasesHeroClient({ shows = [] }: UpcomingReleasesHeroClientProps) {
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
    }, 6500);

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

  const releaseDateObj = currentShow.first_air_date ? new Date(currentShow.first_air_date) : null;
  const formattedReleaseDate = releaseDateObj
    ? releaseDateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  let daysRemainingText: string | null = null;
  if (releaseDateObj) {
    const now = new Date();
    const diffTime = releaseDateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      daysRemainingText = `${diffDays} Gün Kaldı`;
    } else if (diffDays === 0) {
      daysRemainingText = `Bugün Yayında!`;
    }
  }

  return (
    <section 
      className="relative mb-8 w-full select-none overflow-hidden rounded-3xl bg-[#000000]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Container with Crossfade Transition */}
      <div className="relative h-[380px] w-full sm:h-[420px] md:h-[450px]">
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
                className="object-cover object-top opacity-65 transition-transform duration-10000 ease-linear scale-105"
              />
            </div>
          );
        })}

        {/* Natural Borderless Dark Gradients */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#000000] via-[#000000]/85 via-40% md:via-35% to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#000000] via-[#000000]/50 via-25% to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#000000]/60 via-transparent to-transparent" />

        {/* Foreground Content */}
        <div className="relative z-30 flex h-full flex-col justify-end p-6 sm:p-8 md:p-9">
          
          {/* Center Details */}
          <div className="mt-auto max-w-2xl">
            {/* Tag / Kicker */}
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-[13px] sm:text-[14px] font-black tracking-widest uppercase">
                <span className="text-emerald-400">YAKINDA</span>{' '}
                <span className="text-white">EKRANLARDA &bull; YENİ SEZONLAR</span>
              </span>
            </div>
            {/* Release Date & Countdown Indicator (Backgroundless) */}
            {formattedReleaseDate && (
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-white/80">
                <span className="material-symbols-outlined text-[15px] text-emerald-400">event</span>
                <span>Yayın Tarihi: {formattedReleaseDate}</span>
                {daysRemainingText && (
                  <>
                    <span className="text-white/30">&bull;</span>
                    <span className="text-emerald-400 font-extrabold tracking-wide">{daysRemainingText}</span>
                  </>
                )}
              </div>
            )}

            {/* Show Title */}
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-xl leading-none">
              {currentShow.name}
            </h2>

            {/* Overview */}
            {currentShow.overview && (
              <p className="mt-2.5 line-clamp-2 max-w-xl text-xs sm:text-sm font-medium leading-relaxed text-white/70 sm:line-clamp-3">
                {currentShow.overview}
              </p>
            )}

            {/* Call to Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={`/show/${currentShow.id}`}
                className="group/btn inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[11.5px] font-bold text-white shadow-md transition-all duration-200 hover:bg-emerald-500 active:scale-95"
              >
                <span>Detayları İncele</span>
                <span className="material-symbols-outlined text-[14px] transition-transform duration-200 group-hover/btn:translate-x-0.5">
                  arrow_forward
                </span>
              </Link>

              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">search</span>
                <span>Tüm Diziler</span>
              </Link>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="mt-4 flex items-center justify-between gap-4 pt-2">
            
            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {shows.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentIndex
                      ? 'w-8 bg-emerald-500'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Right Mini Thumbnails & Prev/Next Arrows */}
            <div className="flex items-center gap-3">
              {/* Mini Slide Preview Thumbnails */}
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
                      className={`relative h-11 w-7 overflow-hidden rounded-md border transition-all duration-300 ${
                        idx === currentIndex
                          ? 'border-emerald-500 scale-110 shadow-md ring-2 ring-emerald-500/40'
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
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Önceki Dizi"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  onClick={nextSlide}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Sonraki Dizi"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
