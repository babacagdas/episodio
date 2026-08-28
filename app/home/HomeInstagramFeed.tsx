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
        <div className="h-[460px] sm:h-[520px] w-full rounded-3xl bg-white/5 animate-pulse" />
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <section
      className="relative mb-9 w-full select-none overflow-hidden rounded-3xl bg-[#07070A]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 📸 Çerçevesiz, Boyutuna Göre Adapte Olan Hero Banner */}
      <div className="relative w-full flex flex-col md:flex-row items-stretch justify-start p-4 sm:p-6 md:p-8 min-h-[460px] sm:min-h-[520px] overflow-hidden">
        
        {/* Sinematik Arka Plan Blur Işığı */}
        {posts.map((post, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={post.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={post.image_url}
                alt=""
                className="h-full w-full object-cover blur-3xl opacity-25 scale-125"
              />
            </div>
          );
        })}

        {/* 1. SOL TARAF: FOTOĞRAF (Her zaman sol tarafa sabit, kırpmasız, tam boyut) */}
        <div className="relative z-20 shrink-0 w-full sm:w-[320px] md:w-[380px] lg:w-[420px] aspect-[4/5] overflow-hidden rounded-2xl">
          {posts.map((post, idx) => {
            const isActive = idx === currentIndex;
            return (
              <img
                key={post.id}
                src={post.image_url}
                alt={post.title || 'Episodio Afiş'}
                className={`absolute inset-0 h-full w-full object-contain transition-all duration-700 ${
                  isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                }`}
              />
            );
          })}
        </div>

        {/* 2. SAĞ TARAF / ALT ALAN: BAŞLIK, AÇIKLAMA (Fotoğrafı kapamaz) & MİNİCİK INSTAGRAM BUTONU */}
        <div className="relative z-20 flex-1 flex flex-col justify-end pt-5 md:pt-0 md:pl-8 pb-1">
          
          {/* Başlık ve Açıklama Metni (Banner alt çizgisinin hemen üstünde, fotoğrafı kapamadan) */}
          <div className="mb-4">
            {currentPost.title && (
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-xl leading-tight mb-2">
                {currentPost.title}
              </h2>
            )}

            {currentPost.caption && (
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/80 line-clamp-3 max-w-xl drop-shadow">
                {currentPost.caption}
              </p>
            )}
          </div>

          {/* Sol Alt Köşede Minicik Instagram Butonu + Kontroller */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/10">
            
            {/* Minicik Instagram İkon Butonu (Sol Alt Köşede) */}
            <div className="flex items-center gap-3">
              <a
                href={currentPost.instagram_url || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram'da Aç"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
              </a>

              {/* Slayt Noktaları */}
              {posts.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {posts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        idx === currentIndex
                          ? 'w-6 bg-gradient-to-r from-[#f09433] to-[#bc1888]'
                          : 'w-1.5 bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Slayt Navigasyon Okları */}
            {posts.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                  aria-label="Önceki"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                  aria-label="Sonraki"
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
