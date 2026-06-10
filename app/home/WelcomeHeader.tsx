'use client';

import { useState } from 'react';
import NotificationsBell from './NotificationsBell';
import CalendarModal from './CalendarModal';

export default function WelcomeHeader() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <div className="flex justify-between items-end mb-8 w-full">
      <div>
        <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">Hoş geldin</p>
        <div className="flex items-center gap-3.5 flex-wrap">
          <h1 className="font-display-xl text-3xl md:text-display-xl text-white">Merhaba 👋</h1>
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white transition-all shadow-[0_4px_25px_rgba(0,0,0,0.35)] backdrop-blur-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-solid"
          >
            <span className="material-symbols-outlined text-[13px] text-[#D4A017]">calendar_today</span>
            <span>Bölüm Takvimi</span>
          </button>
        </div>
      </div>
      <div className="hidden md:block">
        <NotificationsBell />
      </div>
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
    </div>
  );
}
