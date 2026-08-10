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

    // 2.15 saniyelik daha uzun zar dönme heyecanı
    setTimeout(() => {
      setSelectedShow(picked);
      setIsSpinning(false);
      setHasRolled(true);
    }, 2150);
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 select-none">
      {/* Özel Keyframe Animasyonları */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gentleShake {
            0%, 100% { transform: rotate(-14deg) translateY(0); }
            50% { transform: rotate(-8deg) translateY(-8px); }
          }
          @keyframes spin3DLong {
            0% { transform: rotate(-14deg) scale(1); }
            50% { transform: rotate(1080deg) scale(1.4); }
            100% { transform: rotate(2160deg) scale(1); }
          }
          @keyframes slideInRight {
            0% { opacity: 0; transform: translateX(80px); }
            100% { opacity: 1; transform: translateX(0); }
          }
        `
      }} />

      {/* Arka Plan Yoğun Bulanık Overlay (Tıklayınca zarı tekrar atar veya kapatabilir) */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl transition-opacity duration-300"
        onClick={() => {
          if (!hasRolled && !isSpinning) rollDice();
          else if (hasRolled && !isSpinning) onClose();
        }}
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

        {/* 1. EKRAN: Zarı Atmak İçin Ekrana Tıklama / 2.15s Dönme Durumu */}
        {(!hasRolled || isSpinning) && (
          <div
            onClick={rollDice}
            className="flex flex-col items-center justify-center cursor-pointer py-12"
          >
            <div
              className={`text-8xl sm:text-9xl filter drop-shadow-[0_20px_40px_rgba(255,255,255,0.15)] transition-transform duration-300 ${
                isSpinning
                  ? 'animate-[spin3DLong_2.15s_cubic-bezier(0.25,1,0.5,1)_forwards]'
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

        {/* 2. EKRAN: Ortalanmış Büyük Afişli Çerçevesiz Şık Dizi Sonucu */}
        {hasRolled && !isSpinning && selectedShow && (
          <div className="w-full flex flex-col items-center text-center animate-[slideInRight_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            
            {/* Afişin Üstünde Küçük Çerçevesiz Tekrar At Butonu */}
            <button
              type="button"
              onClick={rollDice}
              className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[#D4A017] hover:text-white transition-colors cursor-pointer active:scale-95 bg-transparent border-none p-0 tracking-wide"
            >
              <span>Tekrar Zarı At</span>
              <span className="text-sm">🎲</span>
            </button>

            {/* Ortalanmış Büyük Dizi Afişi */}
            <div className="relative h-64 sm:h-76 w-44 sm:w-52 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#16161c] shadow-[0_25px_60px_rgba(0,0,0,0.9)] mb-4">
              {posterUrl ? (
                <img src={posterUrl} alt={selectedShow.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <span className="material-symbols-outlined text-4xl">movie</span>
                </div>
              )}
            </div>

            {/* Dizi Adı */}
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 tracking-tight">
              {selectedShow.name}
            </h2>

            {/* Puan & Çıkış Yılı */}
            <div className="flex items-center justify-center gap-2 mb-3 text-xs font-bold">
              {selectedShow.vote_average > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#D4A017]/20 px-2.5 py-0.5 text-xs font-black text-[#D4A017]">
                  ★ {selectedShow.vote_average.toFixed(1)}
                </span>
              )}
              {selectedShow.first_air_date && (
                <span className="text-xs font-semibold text-white/50">
                  {selectedShow.first_air_date.slice(0, 4)}
                </span>
              )}
            </div>

            {/* Açıklama */}
            <p className="line-clamp-3 text-xs sm:text-sm font-medium leading-relaxed text-white/70 max-w-sm mb-6">
              {selectedShow.overview || 'Bu dizi için henüz açıklama bulunmuyor.'}
            </p>

            {/* Zarif Diziye Git Butonu */}
            <Link
              href={`/show/${selectedShow.id}`}
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C91520] hover:bg-[#E50914] px-8 py-3 text-xs sm:text-sm font-black text-white shadow-[0_10px_30px_rgba(201,21,32,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
            >
              <span>Diziye Git</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>

          </div>
        )}

      </div>
    </div>
  );
}
