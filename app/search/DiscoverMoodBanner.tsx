'use client';

import { useState } from 'react';

export interface MoodFilterSelection {
  type: 'genre' | 'format';
  value: number | string;
  label: string;
}

interface DiscoverMoodBannerProps {
  onSelectFilter: (selection: MoodFilterSelection | null) => void;
  activeSelection: MoodFilterSelection | null;
}

const MOODS = [
  { label: '🍿 Kafa Dağıtmalık', genreId: 35 },
  { label: '🧠 Zihin Bükücü', genreId: 10765 },
  { label: '⚡ Adrenalin', genreId: 10759 },
  { label: '🍷 Derin Drama', genreId: 18 },
  { label: '👻 Gerilim', genreId: 9648 },
];

const FORMATS = [
  { label: '⚡ Tek Oturuşta Biter (Mini Dizi)', format: 'mini' },
  { label: '⏳ Hızlı Tüketim (20-30 Dk)', format: 'short' },
  { label: '🏆 Efsane Maraton', format: 'marathon' },
];

export default function DiscoverMoodBanner({ onSelectFilter, activeSelection }: DiscoverMoodBannerProps) {
  function handleMoodClick(mood: typeof MOODS[0]) {
    if (activeSelection?.type === 'genre' && activeSelection.value === mood.genreId) {
      onSelectFilter(null);
    } else {
      onSelectFilter({ type: 'genre', value: mood.genreId, label: mood.label });
    }
  }

  function handleFormatClick(fmt: typeof FORMATS[0]) {
    if (activeSelection?.type === 'format' && activeSelection.value === fmt.format) {
      onSelectFilter(null);
    } else {
      onSelectFilter({ type: 'format', value: fmt.format, label: fmt.label });
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E0E14] via-[#12121A] to-[#0A0A0E] p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* Ambient Red & Gold Background Glows */}
      <div className="absolute top-0 left-0 w-64 h-32 bg-[#C91520]/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-32 bg-[#D4A017]/10 blur-3xl pointer-events-none rounded-full" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        
        {/* SOL TARAF: Ruh Haline Göre Dizi Bul */}
        <div className="space-y-3.5 pt-1 lg:pt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Ruh Haline Göre Keşfet</span>
            </h3>
            {activeSelection?.type === 'genre' && (
              <button
                type="button"
                onClick={() => onSelectFilter(null)}
                className="text-[11px] font-semibold text-[#C91520] hover:underline"
              >
                Temizle
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const isSelected = activeSelection?.type === 'genre' && activeSelection.value === m.genreId;
              return (
                <button
                  key={m.genreId}
                  type="button"
                  onClick={() => handleMoodClick(m)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all backdrop-blur-md ${
                    isSelected
                      ? 'bg-[#C91520] text-white shadow-[0_4px_20px_rgba(201,21,32,0.5)] scale-105'
                      : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/10 active:scale-95'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SAĞ TARAF: Süreye & Tarza Göre Keşfet */}
        <div className="space-y-3.5 pt-5 lg:pt-0 lg:pl-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#D4A017] flex items-center gap-1.5">
              <span>Süreye & Tarza Göre Keşfet</span>
            </h3>
            {activeSelection?.type === 'format' && (
              <button
                type="button"
                onClick={() => onSelectFilter(null)}
                className="text-[11px] font-semibold text-[#D4A017] hover:underline"
              >
                Temizle
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const isSelected = activeSelection?.type === 'format' && activeSelection.value === f.format;
              return (
                <button
                  key={f.format}
                  type="button"
                  onClick={() => handleFormatClick(f)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all backdrop-blur-md ${
                    isSelected
                      ? 'bg-[#D4A017] text-black shadow-[0_4px_20px_rgba(212,160,23,0.4)] scale-105'
                      : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/10 active:scale-95'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
