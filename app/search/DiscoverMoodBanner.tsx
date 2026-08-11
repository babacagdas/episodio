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
    <section className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#121212] p-5 sm:p-6 shadow-xl transition-all duration-300 my-6">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#C91520]/15 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Left Side: Text & Mood Pills */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-['Poppins',sans-serif] text-base font-extrabold text-white sm:text-xl tracking-tight">
                Ruh Haline Göre Dizi Bul
              </h3>
              <p className="mt-1 text-xs font-medium text-white/50">
                Anlık modunuza en uygun dizileri tek tıkla canlı keşfedin.
              </p>
            </div>
            {activeSelection && (
              <button
                type="button"
                onClick={() => onSelectFilter(null)}
                className="text-xs font-semibold text-[#C91520] hover:underline shrink-0 ml-2"
              >
                Filtreyi Temizle
              </button>
            )}
          </div>

          {/* Clean Material Symbols Mood Buttons (No Emojis) */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {MOODS.map((m) => {
              const isSelected = activeSelection?.type === 'genre' && activeSelection.value === m.genreId;
              return (
                <button
                  key={m.genreId}
                  type="button"
                  onClick={() => handleMoodClick(m)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#C91520] text-white shadow-[0_4px_20px_rgba(201,21,32,0.4)] scale-105'
                      : 'bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/10 active:scale-95 border border-white/5'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[17px] ${isSelected ? 'text-white' : 'text-[#C91520]'}`}>
                    {m.icon}
                  </span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Compact Fanned 3-Poster Cards (Dizi Eşleştirici Tarzı Görsel) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center self-center md:self-auto py-1">
          <div className="relative flex h-24 w-28 items-center justify-center sm:h-28 sm:w-32">
            {/* Poster 1: Peaky Blinders (Left) */}
            <div className="absolute left-0 top-1/2 h-20 w-13 -translate-y-1/2 -rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg"
                alt="Peaky Blinders"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Poster 3: Stranger Things (Right) */}
            <div className="absolute right-0 top-1/2 h-20 w-13 -translate-y-1/2 rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"
                alt="Stranger Things"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Poster 2: Breaking Bad (Center - Front) */}
            <div className="relative z-10 h-22 w-14 scale-105 rounded-lg border border-[#C91520]/60 bg-[#181818] overflow-hidden shadow-xl sm:h-24 sm:w-15">
              <img
                src="https://image.tmdb.org/t/p/w342/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg"
                alt="Breaking Bad"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
