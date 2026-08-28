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
        <div className="h-[480px] sm:h-[520px] w-full rounded-3xl bg-white/5 animate-pulse border border-white/10" />
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <section
      className="relative mb-9 w-full select-none overflow-hidden rounded-3xl bg-[#07070A] border border-white/10 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 📸 Fotoğrafın Orijinal Boyutunu %100 Koresiz Gösteren Hero Konteyneri */}
      <div className="relative min-h-[460px] sm:min-h-[500px] md:min-h-[540px] w-full flex flex-col justify-between p-5 sm:p-7 md:p-9 overflow-hidden">
        
        {/* Arka Planda Yumuşak Sinematik Blur Görsel */}
        {posts.map((post, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={post.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={post.image_url}
                alt=""
                className="h-full w-full object-cover blur-3xl opacity-35 scale-125"
              />
            </div>
          );
        })}

        {/* Gradyan Katmanları */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#07070A] via-[#07070A]/85 via-45% to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#07070A] via-[#07070A]/40 to-transparent pointer-events-none" />

        {/* Ana Gövde: Sol Metin + Sağ Orijinal 4:5 Görsel */}
        <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 h-full my-auto">
          
          {/* Sol Detay Bilgileri */}
          <div className="flex-1 max-w-xl flex flex-col justify-center">
            {/* Rozet */}
            <div className="mb-3.5 inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#f09433]/20 via-[#e6683c]/20 to-[#bc1888]/20 border border-[#e6683c]/35 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-[#f09433] shadow-md">
              <span className="h-2 w-2 rounded-full bg-[#e6683c] animate-pulse" />
              <span>Episodio Vitrin</span>
            </div>

            {/* Afiş Başlığı */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-xl leading-tight">
              {currentPost.title || 'Episodio Öne Çıkanlar'}
            </h1>

            {/* Açıklama Metni */}
            {currentPost.caption && (
              <p className="mt-3 text-xs sm:text-sm font-medium leading-relaxed text-white/80 line-clamp-3 drop-shadow">
                {currentPost.caption}
              </p>
            )}

            {/* Aksiyon Butonları */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {currentPost.instagram_url ? (
                <a
                  href={currentPost.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] px-6 py-3 text-xs font-bold text-white shadow-xl shadow-[#bc1888]/25 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <span>Instagram'da Göre Git</span>
                  <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover/btn:translate-x-0.5">
                    open_in_new
                  </span>
                </a>
              ) : (
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#C91520] hover:bg-[#E50914] px-6 py-3 text-xs font-bold text-white shadow-xl transition-all duration-200 active:scale-95"
                >
                  <span>Instagram Hesabımız</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </a>
              )}
            </div>
          </div>

          {/* Sağ Alan: Yüklenen Fotoğrafın Kırpılmadan Orijinal Formatında Çerçevesi */}
          <div className="relative shrink-0 w-full sm:w-[320px] md:w-[360px] aspect-[4/5] rounded-3xl border border-white/15 bg-black/80 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] group">
            {posts.map((post, idx) => {
              const isActive = idx === currentIndex;
              return (
                <img
                  key={post.id}
                  src={post.image_url}
                  alt={post.title || 'Episodio Vitrin'}
                  className={`absolute inset-0 h-full w-full object-contain p-1 transition-all duration-700 ${
                    isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Alt Kontroller & Sayfalama */}
        <div className="relative z-20 flex items-center justify-between gap-4 pt-6 border-t border-white/10 mt-6">
          {/* Noktalar */}
          <div className="flex items-center gap-2">
            {posts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  idx === currentIndex
                    ? 'w-8 bg-gradient-to-r from-[#f09433] to-[#bc1888]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Oklar ve Minyatürler */}
          <div className="flex items-center gap-3">
            {/* Minyatür Afişler */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
              {posts.map((post, idx) => (
                <button
                  key={post.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-11 w-9 overflow-hidden rounded-lg border transition-all duration-300 ${
                    idx === currentIndex
                      ? 'border-[#e6683c] scale-110 shadow-md ring-2 ring-[#e6683c]/50'
                      : 'border-white/10 opacity-50 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={post.image_url} alt="" className="h-full w-full object-contain bg-black" />
                </button>
              ))}
            </div>

            {/* Ok Butonları */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
                aria-label="Önceki"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
                aria-label="Sonraki"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
