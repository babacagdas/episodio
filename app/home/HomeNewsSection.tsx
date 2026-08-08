'use client';

import { useState, useRef } from 'react';
import type { NewsItem } from '@/lib/news';

export default function HomeNewsSection({ news }: { news: NewsItem[] }) {
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!news || news.length === 0) return null;

  const sliderNews = news.slice(0, 4);
  const gridNews = news.slice(2, 6);

  function scrollSlider(direction: 'left' | 'right') {
    if (!sliderRef.current) return;
    const amount = sliderRef.current.clientWidth * 0.75;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }

  return (
    <section className="mb-10">
      {/* Header (No Canlı Akış badge) */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C91520]/20 text-[#C91520] shrink-0">
            <span className="material-symbols-outlined text-[20px]">newspaper</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Dizi Dünyasından Haberler</h2>
        </div>

        {/* Slider Nav Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scrollSlider('left')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            onClick={() => scrollSlider('right')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Top News Horizontal Slider */}
      <div
        ref={sliderRef}
        className="flex items-center gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory mb-5 pb-1"
      >
        {sliderNews.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveNews(item)}
            className="snap-start shrink-0 min-w-[85%] sm:min-w-[65%] lg:min-w-[55%] group relative cursor-pointer overflow-hidden rounded-3xl bg-[#121216] border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl"
          >
            <div className="relative aspect-[21/9] sm:aspect-[22/9] w-full overflow-hidden bg-[#18181c]">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/55 to-transparent" />

              {/* Badges */}
              <div className="absolute left-3 top-3 sm:left-4 sm:top-4 flex items-center gap-2">
                <span className="rounded-full bg-[#C91520] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow-lg uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium text-white/70 border border-white/10">
                  {item.source}
                </span>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-5 flex flex-col justify-end">
                <span className="text-[10px] sm:text-[11px] font-medium text-white/50 mb-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {item.pubDate}
                </span>
                <h3 className="text-xs sm:text-lg font-bold text-white group-hover:text-[#C91520] transition-colors line-clamp-2 leading-tight">
                  {item.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid News Cards (2 Columns on Mobile!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {gridNews.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveNews(item)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-[#121216] border border-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#18181c]">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white/80 border border-white/10">
                  {item.source}
                </span>
              </div>
              <div className="p-2.5 sm:p-3">
                <span className="text-[10px] font-medium text-white/40 mb-0.5 block">{item.pubDate}</span>
                <h4 className="text-[11px] sm:text-xs font-bold text-white line-clamp-2 group-hover:text-[#C91520] transition-colors leading-snug">
                  {item.title}
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compact & Ultra Readable News Reader Modal */}
      {activeNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveNews(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-[#0A0A0D] border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#C91520]/20 text-[#C91520] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                  {activeNews.category}
                </span>
                <span className="text-xs text-white/40">• {activeNews.source}</span>
              </div>
              <button
                onClick={() => setActiveNews(null)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Compact Header Image */}
            <div className="relative h-36 sm:h-44 w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-md shrink-0">
              <img
                src={activeNews.imageUrl}
                alt={activeNews.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content & Readable Text */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                {activeNews.title}
              </h3>
              <p className="text-[11px] text-white/40">{activeNews.pubDate} tarihinde yayınlandı</p>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed pt-1">
                {activeNews.snippet} Sevilen yapımla ilgili yeni sezon hazırlıkları ve yayın takvimi duyuruları heyecanla takip ediliyor.
              </p>
            </div>

            {/* Read Original Button */}
            <div className="pt-2 flex justify-end">
              <a
                href={activeNews.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#C91520] hover:bg-[#E50914] px-4 py-2 text-xs font-bold text-white shadow-lg transition-all"
              >
                Kaynak Sitede Oku
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
