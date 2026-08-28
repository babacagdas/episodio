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
      <section className="relative mb-8 w-full select-none overflow-hidden rounded-3xl bg-transparent">
        <div className="h-[460px] sm:h-[520px] w-full rounded-3xl bg-white/5 animate-pulse" />
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <section
      className="relative mb-9 w-full select-none bg-transparent"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 🖼️ Bilgisayar & Tablette Sol Taraf Görsel, Sağ Taraf Şık Logo ve Davet Metni */}
      <div className="relative w-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 py-2 overflow-hidden">
        
        {/* 1. SOL TARAF: Görsel Afiş (Bilgisayar ve tablette sola kaydırılmış, tam boyut) */}
        <div className="relative shrink-0 w-full sm:w-[320px] md:w-[380px] lg:w-[420px] aspect-[4/5] overflow-hidden rounded-2xl flex items-center justify-center">
          {posts.map((post, idx) => {
            const isActive = idx === currentIndex;
            return (
              <img
                key={post.id}
                src={post.image_url}
                alt=""
                className={`absolute inset-0 h-full w-full object-contain transition-all duration-700 ${
                  isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'
                }`}
              />
            );
          })}
        </div>

        {/* 2. SAĞ TARAF: Episodio Logosu + Çoklu Yazı Stilli Davet Yazısı */}
        <div className="relative z-20 flex-1 flex flex-col items-center md:items-start text-center md:text-left justify-center px-2 py-4">
          
          {/* Episodio Logosu */}
          <div className="mb-5">
            <Image
              src="/logo.png"
              alt="Episodio"
              width={180}
              height={50}
              priority
              className="h-9 md:h-11 w-auto object-contain"
            />
          </div>

          {/* Şık ve Çoklu Tipografili Yazı Stili */}
          <div className="max-w-md space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] font-extrabold text-[#C91520] flex items-center justify-center md:justify-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C91520] animate-ping" />
              <span>Resmi Sosyal Medya</span>
            </p>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug drop-shadow-md">
              Güncel Haberler, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888]">Kesitler</span> &amp; İçerikler
            </h2>

            <p className="text-sm sm:text-base font-serif italic text-white/80 tracking-wide pt-1">
              için bizi takip et.
            </p>
          </div>

          {/* Sosyal Medya İkon Butonu + Slayt Kontrolleri */}
          <div className="mt-7 flex items-center gap-4">
            <a
              href={currentPost.instagram_url || 'https://www.instagram.com/episodiotr/'}
              target="_blank"
              rel="noreferrer"
              aria-label="Episodio Instagram"
              title="Instagram'da Bizi Takip Et"
              className="group flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:border-[#C91520]/60 hover:bg-[#C91520]/15 hover:scale-105 active:scale-95 shadow-lg"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <span>@episodiotr Takip Et</span>
            </a>

            {/* Slayt Okları */}
            {posts.length > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
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

      </div>
    </section>
  );
}
