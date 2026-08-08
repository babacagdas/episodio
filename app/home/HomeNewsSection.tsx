'use client';

import { useState } from 'react';
import type { NewsItem } from '@/lib/news';

export default function HomeNewsSection({ news }: { news: NewsItem[] }) {
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);

  if (!news || news.length === 0) return null;

  const featured = news[0];
  const gridNews = news.slice(1, 5);

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C91520]/20 text-[#C91520] shrink-0">
            <span className="material-symbols-outlined text-[20px]">newspaper</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Dizi Dünyasından Haberler</h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Canlı Akış
        </div>
      </div>

      {/* Hero Featured News Banner */}
      {featured && (
        <div
          onClick={() => setActiveNews(featured)}
          className="group relative mb-4 cursor-pointer overflow-hidden rounded-3xl bg-[#121216] border border-white/10 hover:border-white/20 transition-all duration-300 shadow-xl"
        >
          <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-[#18181c]">
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0D]/80 via-transparent to-transparent hidden sm:block" />

            {/* Top Category Badge */}
            <div className="absolute left-3 top-3 sm:left-4 sm:top-4 flex items-center gap-2">
              <span className="rounded-full bg-[#C91520] px-3 py-1 text-[10px] sm:text-xs font-bold text-white shadow-lg uppercase tracking-wider">
                {featured.category}
              </span>
              <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] sm:text-xs font-medium text-white/70 border border-white/10">
                {featured.source}
              </span>
            </div>

            {/* Bottom Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col justify-end">
              <span className="text-[11px] font-semibold text-white/50 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {featured.pubDate}
              </span>
              <h3 className="text-base sm:text-2xl font-bold text-white group-hover:text-[#C91520] transition-colors line-clamp-2 leading-tight">
                {featured.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/60 line-clamp-2 mt-1.5 hidden sm:block">
                {featured.snippet}
              </p>
            </div>
          </div>
        </div>
      )}

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
              <div className="p-3">
                <span className="text-[10px] font-medium text-white/40 mb-0.5 block">{item.pubDate}</span>
                <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#C91520] transition-colors leading-snug">
                  {item.title}
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* News Reader Modal */}
      {activeNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setActiveNews(null)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-[#0A0A0D] border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#C91520]/20 text-[#C91520] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {activeNews.category}
                </span>
                <span className="text-xs text-white/40">• {activeNews.source}</span>
              </div>
              <button
                onClick={() => setActiveNews(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black border border-white/10 shadow-md shrink-0">
              <img
                src={activeNews.imageUrl}
                alt={activeNews.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                {activeNews.title}
              </h3>
              <p className="text-xs text-white/40">{activeNews.pubDate} tarihinde yayınlandı</p>
              <p className="text-sm text-white/70 leading-relaxed pt-2">
                {activeNews.snippet} Dizi severler için son zamanların en çok beklenen haberlerinden biri olan bu gelişmeyle ilgili tüm detaylar ve yapım ekibinden gelen açıklamalar yakında Episodio haber akışında yer almaya devam edecek.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={activeNews.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#C91520] hover:bg-[#E50914] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
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
