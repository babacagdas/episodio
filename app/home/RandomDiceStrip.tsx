'use client';

import { useState, useEffect } from 'react';
import RandomShowModal from '@/app/search/RandomShowModal';
import type { Show } from '@/lib/tmdb';

export default function RandomDiceStrip() {
  const [modalOpen, setModalOpen] = useState(false);
  const [shows, setShows] = useState<Show[]>([]);

  useEffect(() => {
    fetch('/api/trending')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShows(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <section
        onClick={() => setModalOpen(true)}
        className="group relative my-6 flex w-full items-center justify-between border-y border-white/[0.06] bg-transparent py-3 px-1 transition-colors hover:border-white/15 cursor-pointer select-none"
      >
        {/* Sol: Orta Büyüklükte Zar */}
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl inline-block -rotate-12 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            🎲
          </span>
          <span className="text-sm sm:text-base font-bold text-white transition-colors group-hover:text-[#D4A017]">
            Bugün Ne İzlesem?
          </span>
        </div>

        {/* Sağ: İnce Ok ve İpucu */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40 group-hover:text-white transition-colors">
          <span className="hidden sm:inline">Zarı At</span>
          <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover:translate-x-1">
            chevron_right
          </span>
        </div>
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
