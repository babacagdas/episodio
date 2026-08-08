'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface HeroList {
  id: string;
  name: string;
  description: string | null;
  creatorName: string;
  creatorAvatar: string | null;
  posters: string[];
  itemCount: number;
  likeCount: number;
}

const POSTER_BASE = 'https://image.tmdb.org/t/p/w185';

export default function HomeHeroSlider({ lists = [] }: { lists?: HeroList[] }) {
  const [index, setIndex] = useState(0);
  const items = lists;
  const currentList = items[index];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (!currentList) return null;

  return (
    <div className="flex-1 flex flex-col justify-between h-full min-w-0 select-none">
      {/* List Card Container */}
      <div className="relative group/card flex-1 flex flex-col justify-between rounded-2xl border border-white/[0.05] bg-transparent p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)] min-h-[300px]">
        
        {/* Card Header (Creator badge + save action) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
              {currentList.creatorAvatar ? (
                <img src={currentList.creatorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-white/40 text-xs font-semibold leading-none">person</span>
              )}
            </div>
            <span className="text-white/40 text-[11px] font-semibold truncate leading-none pt-0.5">
              {currentList.creatorName}&apos;in listesi
            </span>
          </div>

          <button 
            className="text-white/30 hover:text-white transition-colors duration-200" 
            title="Listeyi kaydet"
            aria-label="Listeyi kaydet"
          >
            <span className="material-symbols-outlined text-[19px]">bookmark</span>
          </button>
        </div>

        {/* Card Content (Title & stats) */}
        <div className="mt-3">
          <Link 
            href={currentList.id.startsWith('default-') ? '/search' : `/list/${currentList.id}`}
            className="block text-white hover:text-[#C91520] transition-colors font-bold text-[17px] leading-tight truncate"
          >
            {currentList.name}
          </Link>
          <span className="block text-white/35 text-[10.5px] font-semibold mt-1">
            {currentList.itemCount} dizi &bull; {currentList.likeCount} kaydetme
          </span>
        </div>

        {/* Poster Row Grid with Chevron navigation overlay */}
        <div className="relative mt-4 flex-1 flex flex-col justify-center min-h-[140px]">
          <div className="grid grid-cols-4 gap-2">
            {currentList.posters.map((path, i) => (
              <div 
                key={i} 
                className="aspect-[2/3] rounded-lg overflow-hidden border border-white/[0.06] bg-white/[0.03] shadow-md transition-transform duration-300 hover:scale-[1.03]"
              >
                {path ? (
                  <img 
                    src={path.startsWith('/') ? `${POSTER_BASE}${path}` : path} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10">
                    <span className="material-symbols-outlined text-lg">movie</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chevron Navigation buttons (visible on hover) */}
          {items.length > 1 && (
            <button 
              onClick={handleNext}
              className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-[#07080b]/90 text-white shadow-lg transition-all duration-300 hover:bg-[#C91520] hover:border-[#C91520] hover:scale-105"
              title="Sonraki liste"
              aria-label="Sonraki liste"
            >
              <span className="material-symbols-outlined text-[18px] font-bold">chevron_right</span>
            </button>
          )}
        </div>

        {/* Pagination Dots at bottom-center */}
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-[#C91520]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
                title={`Liste ${i + 1}`}
                aria-label={`Liste ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
