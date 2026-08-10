'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Show } from '@/lib/tmdb';

interface RandomShowModalProps {
  open: boolean;
  onClose: () => void;
  shows: Show[];
}

export default function RandomShowModal({ open, onClose, shows }: RandomShowModalProps) {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  const pickRandomShow = () => {
    if (!shows || shows.length === 0) return;
    setIsShuffling(true);

    let count = 0;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * shows.length);
      setSelectedShow(shows[idx]);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsShuffling(false);
      }
    }, 60);
  };

  useEffect(() => {
    if (open) {
      pickRandomShow();
    }
  }, [open]);

  if (!open) return null;

  const posterUrl = selectedShow?.poster_path
    ? `https://image.tmdb.org/t/p/w500${selectedShow.poster_path}`
    : selectedShow?.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${selectedShow.backdrop_path}`
    : null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c10]/95 p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl animate-[chatScaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        
        {/* Glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#C91520]/25 blur-3xl" />

        {/* Kapat Butonu */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Başlık */}
        <div className="mb-4 flex items-center gap-2">
          <span className={`text-2xl transition-transform duration-300 ${isShuffling ? 'animate-spin' : ''}`}>🎲</span>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Ne İzlesem?
            </h2>
            <p className="text-[11px] font-semibold text-[#D4A017]">
              Bugün Senin İçin Özel Seçtik
            </p>
          </div>
        </div>

        {/* Dizi Detay Kartı */}
        {selectedShow ? (
          <div className={`transition-all duration-300 ${isShuffling ? 'scale-95 opacity-50 blur-[1px]' : 'scale-100 opacity-100'}`}>
            <div className="relative mb-4 flex gap-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 shadow-inner">
              {/* Afiş */}
              <div className="relative h-32 w-22 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#16161c] shadow-md">
                {posterUrl ? (
                  <img src={posterUrl} alt={selectedShow.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <span className="material-symbols-outlined text-2xl">movie</span>
                  </div>
                )}
              </div>

              {/* Bilgiler */}
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <h3 className="truncate text-base font-black text-white leading-tight">
                      {selectedShow.name}
                    </h3>
                  </div>

                  {/* Puan & Çıkış Yılı */}
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold">
                    {selectedShow.vote_average > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#D4A017]/20 px-2 py-0.5 text-[11px] font-black text-[#D4A017]">
                        ★ {selectedShow.vote_average.toFixed(1)}
                      </span>
                    )}
                    {selectedShow.first_air_date && (
                      <span className="text-[11px] text-white/40">
                        {selectedShow.first_air_date.slice(0, 4)}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-3 text-[11.5px] font-medium leading-relaxed text-white/60">
                    {selectedShow.overview || 'Bu dizi için henüz açıklama bulunmuyor.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={pickRandomShow}
                disabled={isShuffling}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
              >
                <span className="text-sm">🎲</span>
                <span>Tekrar Salla</span>
              </button>

              <Link
                href={`/show/${selectedShow.id}`}
                onClick={onClose}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C91520] px-4 text-xs font-black text-white shadow-md transition-all hover:bg-[#E50914] active:scale-95"
              >
                <span>Dizi Detayına Git</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-white/30 text-xs">
            Diziler hazırlanıyor...
          </div>
        )}
      </div>
    </div>
  );
}
