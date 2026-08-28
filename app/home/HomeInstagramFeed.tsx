'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface FeedPost {
  id: string;
  image_url: string;
  title?: string | null;
  caption?: string | null;
  instagram_url?: string | null;
  created_at?: string | null;
}

export default function HomeInstagramFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadFeedPosts() {
      try {
        const res = await fetch('/api/feed-posts');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPosts(data);
          }
        }
      } catch (err) {
        console.error('Feed posts error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFeedPosts();
  }, []);

  const nextSlide = useCallback(() => {
    if (posts.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
  }, [posts.length]);

  const prevSlide = useCallback(() => {
    if (posts.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
  }, [posts.length]);

  useEffect(() => {
    if (isPaused || posts.length <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, posts.length, nextSlide]);

  if (loading) {
    return (
      <section className="relative mb-8 w-full select-none overflow-hidden rounded-3xl bg-[#000000]">
        <div className="h-[420px] sm:h-[460px] md:h-[500px] w-full rounded-3xl bg-white/5 animate-pulse border border-white/10" />
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <section
      className="relative mb-8 w-full select-none overflow-hidden rounded-3xl bg-[#000000] border border-white/10 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Hero Container with Crossfade Transition */}
      <div className="relative h-[420px] w-full sm:h-[460px] md:h-[500px]">
        {posts.map((post, idx) => {
          const isActive = idx === currentIndex;

          return (
            <div
              key={post.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={post.image_url}
                alt={post.title || 'Episodio Vitrin'}
                className="h-full w-full object-cover object-center transition-transform duration-10000 ease-linear scale-105"
              />
            </div>
          );
        })}

        {/* Sinematik Arka Plan Gradyanları */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-[#000000] via-[#000000]/85 via-40% md:via-35% to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#000000] via-[#000000]/50 via-25% to-transparent" />
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#000000]/60 via-transparent to-transparent" />

        {/* Hero Ön Plan İçeriği */}
        <div className="relative z-30 flex h-full flex-col justify-end p-6 sm:p-8 md:p-10">
          
          {/* Sol Metin ve Buton Alanı */}
          <div className="relative z-10 max-w-2xl flex flex-col justify-end h-full">

            {/* Üst Rozet */}
            <div className="mb-3 inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#f09433]/20 via-[#e6683c]/20 to-[#bc1888]/20 border border-[#e6683c]/30 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#f09433] shadow-lg">
              <span className="h-2 w-2 rounded-full bg-[#e6683c] animate-pulse" />
              <span>Episodio Vitrin</span>
            </div>

            {/* Afiş Başlığı */}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl drop-shadow-xl leading-none">
              {currentPost.title || 'Episodio Öne Çıkanlar'}
            </h1>

            {/* Açıklama Yazısı */}
            {currentPost.caption && (
              <p className="mt-3 line-clamp-2 max-w-xl text-xs sm:text-sm font-medium leading-relaxed text-white/80 sm:line-clamp-3 drop-shadow">
                {currentPost.caption}
              </p>
            )}

            {/* Aksiyon Butonları */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {currentPost.instagram_url ? (
                <a
                  href={currentPost.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] px-5 py-2.5 text-xs font-bold text-white shadow-xl shadow-[#bc1888]/20 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <span>Instagram'da İncele</span>
                  <span className="material-symbols-outlined text-sm transition-transform duration-200 group-hover/btn:translate-x-0.5">
                    open_in_new
                  </span>
                </a>
              ) : (
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn inline-flex items-center gap-2 rounded-full bg-[#C91520] hover:bg-[#E50914] px-5 py-2.5 text-xs font-bold text-white shadow-xl transition-all duration-200 active:scale-95"
                >
                  <span>Instagram Sayfamız</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              )}
            </div>
          </div>

          {/* Alt Kontroller: Slider Noktaları & Oklar */}
          <div className="mt-6 flex items-center justify-between gap-4 pt-2">
            
            {/* Sayfalama Noktaları */}
            <div className="flex items-center gap-2">
              {posts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentIndex
                      ? 'w-8 bg-[#e6683c]'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Sağ Oklar ve Minyatür Önizlemeler */}
            <div className="flex items-center gap-3">
              {/* Mini Slide Önizlemeleri (Masaüstünde) */}
              <div className="hidden lg:flex items-center gap-2 mr-2">
                {posts.map((post, idx) => (
                  <button
                    key={post.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-12 w-9 overflow-hidden rounded-lg border transition-all duration-300 ${
                      idx === currentIndex
                        ? 'border-[#e6683c] scale-110 shadow-md ring-2 ring-[#e6683c]/40'
                        : 'border-white/10 opacity-50 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Önceki / Sonraki Oklar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Önceki Afiş"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/30 active:scale-90"
                  aria-label="Sonraki Afiş"
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
