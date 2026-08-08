'use client';

import { useState } from 'react';
import NotificationsBell from './NotificationsBell';
import CalendarModal from './CalendarModal';

export default function WelcomeHeader() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <div className="mb-8 flex w-full items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="premium-kicker mb-2">Episodio</p>
        <h1 className="text-3xl font-bold leading-tight tracking-normal text-white md:text-5xl">
          Bugün ne izliyoruz?
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45 md:text-[15px]">
          Listeni, yeni bölümleri ve arkadaşlarının keşiflerini tek akışta takip et.
        </p>
        <button
          onClick={() => setIsCalendarOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/82 transition-colors hover:border-white/[0.18] hover:bg-white/[0.075] hover:text-white"
        >
          <span className="material-symbols-outlined text-[16px] text-[#D4A017]">calendar_today</span>
          <span>Bölüm Takvimi</span>
        </button>
      </div>
      <div className="hidden md:block">
        <NotificationsBell />
      </div>
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
}
