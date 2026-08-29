'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TrailerItem } from '@/lib/tmdb';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export default function HomeTrailersSection({ trailers: initialTrailers = [] }: { trailers?: TrailerItem[] }) {
  const [trailers, setTrailers] = useState<TrailerItem[]>(initialTrailers);
  const [loading, setLoading] = useState(initialTrailers.length === 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeModalTrailer, setActiveModalTrailer] = useState<TrailerItem | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialTrailers.length > 0) {
      setTrailers(initialTrailers);
      setLoading(false);
      return;
    }

    async function fetchTrailers() {
      try {
        const res = await fetch('/api/trailers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setTrailers(data);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }

    fetchTrailers();
  }, [initialTrailers]);

  const nextSlide = useCallback(() => {
    if (trailers.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % trailers.length);
  }, [trailers.length]);

  const prevSlide = useCallback(() => {
    if (trailers.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + trailers.length) % trailers.length);
  }, [trailers.length]);

  // 5 saniyede bir otomatik kayan yatay slider
  useEffect(() => {
    if (isPaused || trailers.length <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, trailers.length, nextSlide]);

  if (loading) {
    return (
      <div className="relative mb-8 w-full h-[340px] sm:h-[380px] md:h-[420px] rounded-3xl bg-[#0a0a0d] border border-white/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-white/30 text-xs animate-pulse">
          <span className="material-symbols-outlined text-3xl text-[#C91520]">movie</span>
          <span>Fragmanlar Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!trailers || trailers.length === 0) return null;

  const currentTrailer = trailers[currentIndex];

  return (
    <section 
      className="relative mb-8 w-full select-none overflow-hidden rounded-3xl bg-[#000000]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sinematik Banner Alanı */}
      <div className="relative h-[340px] w-full sm:h-[380px] md:h-[420px]">
        {trailers.map((trailer, idx) => {
          const bUrl = trailer.backdropPath
            ? `${BACKDROP_BASE}${trailer.backdropPath}`
            : trailer.posterPath
            ? `${POSTER_BASE}${trailer.posterPath}`
            : '/splash_bg.jpg';

          const isActive = idx === currentIndex;

          return (
            <div
              key={trailer.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={bUrl}
                alt={trailer.showName}
                className="h-full w-full object-cover object-top opacity-60 transition-transform duration-10000 ease-linear scale-105"
              />
            </div>
          );
        })}

        {/* Kenarlıksız Doğal Siyah Gradyanlar (Borderless Dark Fade) */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#000000] via-[#000000]/85 via-40% md:via-35% to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#000000] via-[#000000]/50 via-25% to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#000000]/60 via-transparent to-transparent" />

        {/* Ön Katman İçeriği */}
        <div className="relative z-30 flex h-full flex-col justify-end p-6 sm:p-8 md:p-9">
          
          {/* İçerik Bloğu */}
          <div className="mt-auto max-w-2xl">
            {/* Etiket / Kicker */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[12px] sm:text-[13px] font-black tracking-widest uppercase">
                <span className="text-[#C91520]">YENİ DİZİ</span>{' '}
                <span className="text-white">FRAGMANLARI</span>
              </span>
            </div>

            {/* Dizi Başlığı */}
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl drop-shadow-xl leading-none">
              {currentTrailer.showName}
            </h2>

            {/* Fragman Başlığı / Açıklaması */}
            {currentTrailer.videoTitle && (
              <p className="mt-2.5 line-clamp-1 max-w-xl text-xs sm:text-sm font-medium leading-relaxed text-white/70">
                {currentTrailer.videoTitle}
              </p>
            )}

            {/* Oynat / Fragmanı İzle Butonu (Zarif Buton) */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveModalTrailer(currentTrailer)}
                className="group/btn inline-flex items-center gap-1.5 rounded-full bg-[#C91520] px-3.5 py-1.5 text-[11.5px] font-bold text-white shadow-md transition-all duration-200 hover:bg-[#E50914] active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                <span>Fragmanı İzle</span>
              </button>
            </div>
          </div>

          {/* Alt Kontroller: 5 Saniyede Bir Kayan Yatay Slider Önizleme Kartları */}
          <div className="mt-5 flex items-center justify-between gap-4 pt-2">
            
            {/* Gösterge Çubukları */}
            <div className="flex items-center gap-1.5">
              {trailers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentIndex
                      ? 'w-7 bg-[#C91520]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Sade & Arka Plansız Kayan Yatay Fragman Kartları */}
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-2.5">
                {trailers.map((t, idx) => {
                  const poster = t.backdropPath
                    ? `${BACKDROP_BASE}${t.backdropPath}`
                    : t.posterPath
                    ? `${POSTER_BASE}${t.posterPath}`
                    : null;

                  if (!poster) return null;

                  const isCurrent = idx === currentIndex;

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setActiveModalTrailer(t);
                      }}
                      className={`group relative h-14 w-24 cursor-pointer overflow-hidden rounded-xl transition-all duration-300 ${
                        isCurrent
                          ? 'ring-2 ring-[#C91520] scale-105 opacity-100 shadow-lg'
                          : 'opacity-55 hover:opacity-100 hover:scale-105'
                      }`}
                      title={`${t.showName} - Fragman İzle`}
                    >
                      <img src={poster} alt={t.showName} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg drop-shadow-md group-hover:scale-125 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                          play_circle
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Yön Okları */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={prevSlide}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Önceki Fragman"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  onClick={nextSlide}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Sonraki Fragman"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* YouTube Video Oynatıcı Modal */}
      {activeModalTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setActiveModalTrailer(null)}
          />
          <div className="relative z-10 w-full max-w-3xl bg-[#0A0A0D] border border-white/10 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl animate-[chatScaleIn_0.25s_ease-out]">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-bold text-white">{activeModalTrailer.showName}</h3>
                <p className="text-xs text-white/40 truncate max-w-md">{activeModalTrailer.videoTitle}</p>
              </div>
              <button
                onClick={() => setActiveModalTrailer(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Embed YouTube Video Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-lg">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeModalTrailer.youtubeKey}?autoplay=1`}
                title={activeModalTrailer.videoTitle}
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
