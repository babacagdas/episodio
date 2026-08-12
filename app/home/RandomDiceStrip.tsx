'use client';

import { useState, useEffect } from 'react';
import RandomShowModal from '@/app/search/RandomShowModal';
import type { Show } from '@/lib/tmdb';

export default function RandomDiceStrip() {
  const [modalOpen, setModalOpen] = useState(false);
  const [shows, setShows] = useState<Show[]>([]);

  useEffect(() => {
    fetch('/api/shows/random-pool')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShows(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gentleShake {
            0%, 100% { transform: rotate(-12deg) translateY(0); }
            50% { transform: rotate(-6deg) translateY(-5px); }
          }
        `
      }} />

      <section
        onClick={() => setModalOpen(true)}
        className="group relative my-7 flex w-full flex-col items-center justify-center border-y border-white/[0.06] bg-transparent py-5 px-4 text-center transition-colors hover:border-white/20 cursor-pointer select-none"
      >
        {/* Ortada Titreyen Büyütülmüş Zar */}
        <span className="text-4xl sm:text-5xl inline-block -rotate-12 animate-[gentleShake_2s_infinite_ease-in-out] filter drop-shadow-[0_10px_25px_rgba(255,255,255,0.15)] transition-transform group-hover:scale-115 mb-2.5">
          🎲
        </span>

        {/* Altında Büyütülmüş Metin */}
        <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white transition-colors group-hover:text-[#D4A017]">
          Bugün Ne İzlesem?
        </span>

        {/* Yanıp Sönen Sarı Renkle Minik Tıkla Yazısı */}
        <span className="mt-1 text-[11px] sm:text-xs font-extrabold tracking-widest text-amber-400 animate-pulse uppercase">
          (Tıkla)
        </span>
      </section>

      {/* İnteraktif 3D Zar Modalı */}
      <RandomShowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        shows={shows}
      />
    </>
  );
}
