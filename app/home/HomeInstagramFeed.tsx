'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

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

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const scrollLeft = sliderRef.current.scrollLeft;
    const itemWidth = sliderRef.current.firstElementChild?.clientWidth || 300;
    const index = Math.round(scrollLeft / (itemWidth + 16));
    setActiveIndex(index);
  };

  const scrollTo = (index: number) => {
    if (!sliderRef.current) return;
    const itemWidth = sliderRef.current.firstElementChild?.clientWidth || 300;
    sliderRef.current.scrollTo({
      left: index * (itemWidth + 16),
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-44 rounded-full border border-white/10 bg-white/5 animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          <div className="w-[280px] sm:w-[340px] aspect-[4/5] rounded-3xl bg-white/5 animate-pulse border border-white/10 shrink-0" />
          <div className="w-[280px] sm:w-[340px] aspect-[4/5] rounded-3xl bg-white/5 animate-pulse border border-white/10 shrink-0 hidden sm:block" />
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="mb-9">
      {/* Üst Başlık & Rozet */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white shadow-md">
            <span className="material-symbols-outlined text-base">photo_camera</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Episodio Vitrin</span>
              <span className="rounded-full bg-gradient-to-r from-[#f09433]/20 to-[#bc1888]/20 border border-[#e6683c]/30 px-2 py-0.5 text-[10px] font-bold text-[#f09433]">
                Instagram
              </span>
            </h2>
            <p className="text-xs text-white/40 font-medium">Öne çıkan gönderiler, dizi haberleri ve editlemeler</p>
          </div>
        </div>

        {posts.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-30 transition-all"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo(Math.min(posts.length - 1, activeIndex + 1))}
              disabled={activeIndex >= posts.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white disabled:opacity-30 transition-all"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* 📸 4:5 Instagram Dikey Format Slider */}
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            className="group relative snap-start shrink-0 w-[270px] sm:w-[320px] md:w-[340px] aspect-[4/5] rounded-3xl border border-white/10 bg-[#0c0c10] overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          >
            {/* Arka Plan 4:5 Görseli */}
            <img
              src={post.image_url}
              alt={post.title || 'Episodio Vitrin'}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Derinlik Gradyanı */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 transition-opacity group-hover:opacity-95" />

            {/* Üst Logo Rozeti */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Episodio</span>
              </div>

              {post.instagram_url && (
                <a
                  href={post.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:bg-[#bc1888] hover:text-white transition-all shadow-lg"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>

            {/* Alt Metin ve Buton Alanı */}
            <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex flex-col justify-end">
              {post.title && (
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug drop-shadow-md mb-1.5">
                  {post.title}
                </h3>
              )}

              {post.caption && (
                <p className="text-xs text-white/80 line-clamp-3 leading-relaxed font-normal mb-3 drop-shadow">
                  {post.caption}
                </p>
              )}

              {post.instagram_url && (
                <a
                  href={post.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#bc1888]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Instagram'da Göre Git</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
