'use client';

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
  { label: 'Kafa Dağıtmalık', genreId: 35, icon: 'sentiment_very_satisfied' },
  { label: 'Zihin Bükücü', genreId: 10765, icon: 'psychology' },
  { label: 'Adrenalin', genreId: 10759, icon: 'bolt' },
  { label: 'Derin Drama', genreId: 18, icon: 'auto_awesome' },
  { label: 'Korku & Gerilim', genreId: 9648, icon: 'dark_mode' },
];

export default function DiscoverMoodBanner({ onSelectFilter, activeSelection }: DiscoverMoodBannerProps) {
  function handleMoodClick(mood: typeof MOODS[0]) {
    if (activeSelection?.type === 'genre' && activeSelection.value === mood.genreId) {
      onSelectFilter(null);
    } else {
      onSelectFilter({ type: 'genre', value: mood.genreId, label: mood.label });
    }
  }

  return (
    <section className="relative w-full border-y border-white/[0.06] bg-transparent py-3.5 px-2 sm:px-4 my-5 transition-colors">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Clean Frameless Mood Buttons (No Emojis) */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          {MOODS.map((m) => {
            const isSelected = activeSelection?.type === 'genre' && activeSelection.value === m.genreId;
            return (
              <button
                key={m.genreId}
                type="button"
                onClick={() => handleMoodClick(m)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#C91520] text-white shadow-[0_2px_12px_rgba(201,21,32,0.4)] scale-105'
                    : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-white' : 'text-[#C91520]'}`}>
                  {m.icon}
                </span>
                <span>{m.label}</span>
              </button>
            );
          })}

          {activeSelection && (
            <button
              type="button"
              onClick={() => onSelectFilter(null)}
              className="text-xs font-semibold text-[#C91520] hover:underline px-2"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Right Side: "Bugün Ne İzlesem" Typography Style Right Text */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:text-[#D4A017] transition-colors cursor-default">
            Ruh Haline Göre Dizileri Seç
          </span>
        </div>

      </div>
    </section>
  );
}
