'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

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
  const [imageLoaded, setImageLoaded] = useState(false);
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
            // Tüm resimleri önceden tarayıcı belleğine (Cache) yükle
            data.forEach((p: FeedPost) => {
              if (p.image_url) {
                const img = new window.Image();
                img.src = p.image_url;
              }
            });
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
      <section className="relative mb-8 w-full select-none bg-transparent">
        <div className="relative w-full flex flex-col items-center justify-center min-h-[440px] sm:min-h-[500px]">
          {/* Episodio Logosu Parlayıp Sönen Efekt + Gündem Yükleniyor Metni */}
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#C91520]/20 blur-2xl animate-pulse" />
              <Image
                src="/logo.png"
                alt="Episodio"
                width={160}
                height={45}
                priority
                className="relative z-10 h-9 w-auto object-contain animate-pulse drop-shadow-[0_0_25px_rgba(201,21,32,0.5)]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white/60 tracking-wider">
              <span>Gündem Yükleniyor...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <section
      className="relative mb-8 w-full select-none bg-transparent"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 🖼️ Arka Plansız, Siyahlıkla Karışan Ortalanmış Afiş Görseli */}
      <div className="relative w-full flex flex-col items-center justify-center py-2 overflow-hidden">
        
        {/* Ortada Duran Görsel Afiş Container */}
        <div className="relative shrink-0 w-full sm:w-[340px] md:w-[400px] lg:w-[440px] aspect-[4/5] overflow-hidden rounded-2xl flex items-center justify-center bg-black/40">
          
          {/* Görsel Yüklenene Kadar Sadece 1 DEFA Gösterilecek Episodio Parlama Yükleme Ekranı */}
          {!imageLoaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#07070A] p-6 text-center transition-opacity duration-500">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#C91520]/25 blur-2xl animate-pulse" />
                <Image
                  src="/logo.png"
                  alt="Episodio"
                  width={150}
                  height={40}
                  priority
                  className="relative z-10 h-8 w-auto object-contain animate-pulse drop-shadow-[0_0_20px_rgba(201,21,32,0.6)]"
                />
              </div>
              <p className="text-[11px] font-bold text-white/60 tracking-widest uppercase flex items-center gap-1.5 mt-1">
                <span>Gündem Yükleniyor...</span>
              </p>
            </div>
          )}

          {posts.map((post, idx) => {
            const isActive = idx === currentIndex;
            return (
              <img
                key={post.id}
                src={post.image_url}
                alt=""
                loading="eager"
                decoding="async"
                onLoad={() => {
                  if (isActive && !imageLoaded) setImageLoaded(true);
                }}
                className={`absolute inset-0 h-full w-full object-contain transition-all duration-700 ${
                  isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                }`}
              />
            );
          })}
        </div>

        {/* Alt Alan: Sol Tarafta Sol Menü İkonu Gibi Minicik Şık Instagram Butonu & Sağda Slayt Okları */}
        <div className="w-full flex items-center justify-between gap-4 pt-3 mt-2 px-1">
          
          {/* Sol Alt Köşe: Sol Menüdeki İkon Gibi Minicik Estetik Instagram Butonu */}
          <div className="flex items-center gap-3">
            <a
              href={currentPost.instagram_url || 'https://www.instagram.com/episodiotr/'}
              target="_blank"
              rel="noreferrer"
              aria-label="Episodio Instagram"
              title="Instagram'da Aç"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-all duration-200 hover:border-[#C91520]/50 hover:bg-[#C91520]/15 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
              </svg>
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
                        ? 'w-5 bg-[#C91520]'
                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sağ Alt Köşe: Slayt Okları */}
          {posts.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-90"
                aria-label="Önceki"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-90"
                aria-label="Sonraki"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
