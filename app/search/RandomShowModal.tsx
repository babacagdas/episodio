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
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);

  const rollDice = () => {
    if (!shows || shows.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setHasRolled(false);

    const idx = Math.floor(Math.random() * shows.length);
    const picked = shows[idx];

    setTimeout(() => {
      setSelectedShow(picked);
      setIsSpinning(false);
      setHasRolled(true);
    }, 650);
  };

  useEffect(() => {
    if (open) {
      setHasRolled(false);
      setIsSpinning(false);
      setSelectedShow(null);
    }
  }, [open]);

  if (!open) return null;

  const posterUrl = selectedShow?.poster_path
    ? `https://image.tmdb.org/t/p/w500${selectedShow.poster_path}`
    : selectedShow?.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${selectedShow.backdrop_path}`
    : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Özel Keyframe Animasyonları */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gentleShake {
            0%, 100% { transform: rotate(-14deg) translateY(0); }
            50% { transform: rotate(-8deg) translateY(-8px); }
          }
          @keyframes spin3D {
            0% { transform: rotate(-14deg) scale(1); }
            50% { transform: rotate(360deg) scale(1.35); }
            100% { transform: rotate(720deg) scale(1); }
          }
          @keyframes slideInRight {
            0% { opacity: 0; transform: translateX(90px); }
            100% { opacity: 1; transform: translateX(0); }
          }
        `
      }} />

      {/* Arka Plan Yoğun Bulanık Overlay */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Kapat Butonu */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/50 transition-colors hover:bg-white/20 hover:text-white"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>

      {/* Ana İçerik Alanı */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-md">

        {/* 1. EKRAN: Zarı Atmak İçin Ekrana Tıklama / Dönme Durumu */}
        {(!hasRolled || isSpinning) && (
          <div
            onClick={rollDice}
            className="flex flex-col items-center justify-center cursor-pointer select-none py-12"
          >
            <div
              className={`text-8xl sm:text-9xl filter drop-shadow-[0_20px_40px_rgba(255,255,255,0.15)] transition-transform duration-300 ${
                isSpinning
                  ? 'animate-[spin3D_0.65s_cubic-bezier(0.25,1,0.5,1)_forwards]'
                  : 'animate-[gentleShake_2s_infinite_ease-in-out]'
              }`}
            >
              🎲
            </div>

            <p className="mt-8 text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-[#D4A017] animate-pulse text-center">
              {isSpinning ? 'Kaderin Belirleniyor...' : 'Zarı Atmak İçin Ekrana Tıkla'}
            </p>
          </div>
        )}

        {/* 2. EKRAN: Sağdan Sola Kayarak Gelen Çerçevesiz Dizi Kartı */}
        {hasRolled && !isSpinning && selectedShow && (
          <div className="w-full flex flex-col items-center animate-[slideInRight_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            
            {/* Çerçevesiz Şeffaf Cam Kart */}
            <div className="relative w-full rounded-3xl bg-[#0d0d12]/90 p-5 sm:p-6 shadow-[0_30px_70px_rgba(0,0,0,0.95)] backdrop-blur-3xl border border-white/10">
              
              {/* Üst Zar İkonu & Başlık */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl -rotate-12 inline-block">🎲</span>
                  <span className="text-xs font-black uppercase tracking-wider text-[#D4A017]">
                    Günün Sürpriz Seçimi
                  </span>
                </div>

                <button
                  type="button"
                  onClick={rollDice}
                  className="text-xs font-bold text-emerald-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Tekrar At</span>
                  <span className="text-sm">🎲</span>
                </button>
              </div>

              {/* Dizi Afişi & Bilgiler */}
              <div className="flex gap-4 items-start mb-5">
                {/* Afiş */}
                <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#16161c] shadow-lg">
                  {posterUrl ? (
                    <img src={posterUrl} alt={selectedShow.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/20">
                      <span className="material-symbols-outlined text-2xl">movie</span>
                    </div>
                  )}
                </div>

                {/* Bilgiler */}
                <div className="flex flex-1 flex-col min-w-0">
                  <h3 className="truncate text-lg font-black text-white leading-tight mb-1">
                    {selectedShow.name}
                  </h3>

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

                  <p className="line-clamp-4 text-[12px] font-medium leading-relaxed text-white/65">
                    {selectedShow.overview || 'Bu dizi için henüz açıklama bulunmuyor.'}
                  </p>
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={rollDice}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>Tekrar Zarı At</span>
                  <span className="text-sm">🎲</span>
                </button>

                <Link
                  href={`/show/${selectedShow.id}`}
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#C91520] text-xs font-black text-white shadow-md transition-all hover:bg-[#E50914] active:scale-95 flex items-center justify-center gap-1"
                >
                  <span>Diziye Git</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
