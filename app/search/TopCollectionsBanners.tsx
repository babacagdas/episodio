'use client';

interface TopCollectionsBannersProps {
  onSelectCollection: (type: 'top10' | 'top50') => void;
  activeType: 'top10' | 'top50' | null;
}

export default function TopCollectionsBanners({ onSelectCollection, activeType }: TopCollectionsBannersProps) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* 1. TOP 10 BANNER */}
      <div
        onClick={() => onSelectCollection('top10')}
        className={`group relative flex items-center justify-between overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99] ${
          activeType === 'top10'
            ? 'bg-[#181820] ring-2 ring-[#C91520] shadow-[0_0_25px_rgba(201,21,32,0.4)]'
            : 'bg-[#121212] hover:bg-[#161616]'
        }`}
      >
        {/* Ambient Red Glow */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#C91520]/15 blur-2xl transition-opacity group-hover:opacity-100" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C91520]/20 text-[#C91520] text-[10px] font-black uppercase tracking-wider mb-2">
              Trend Liste
            </div>
            <h3 className="font-['Poppins',sans-serif] text-base font-black text-white sm:text-lg tracking-tight">
              Top 10 Diziler
            </h3>
            <p className="mt-1 text-xs font-medium leading-relaxed text-white/50">
              Bugünün en çok izlenen ve gündemde olan 10 dizisi.
            </p>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#C91520] transition-colors group-hover:text-white">
            <span>{activeType === 'top10' ? 'Aktif Filtre' : 'Listeyi İncele'}</span>
            <span className="material-symbols-outlined text-[15px] transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Fanned 3-Poster Cards (Top 10) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-1">
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            {/* Card 1: Peaky Blinders (Left) */}
            <div className="absolute left-0 top-1/2 h-20 w-13 -translate-y-1/2 -rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg"
                alt="Peaky Blinders"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 3: Stranger Things (Right) */}
            <div className="absolute right-0 top-1/2 h-20 w-13 -translate-y-1/2 rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/49WJfeN0moxb9IPfGn8AIqMGskD.jpg"
                alt="Stranger Things"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 2: Breaking Bad (Center - Front) */}
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

      {/* 2. TOP 50 BANNER */}
      <div
        onClick={() => onSelectCollection('top50')}
        className={`group relative flex items-center justify-between overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99] ${
          activeType === 'top50'
            ? 'bg-[#181820] ring-2 ring-[#D4A017] shadow-[0_0_25px_rgba(212,160,23,0.4)]'
            : 'bg-[#121212] hover:bg-[#161616]'
        }`}
      >
        {/* Ambient Gold Glow */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#D4A017]/15 blur-2xl transition-opacity group-hover:opacity-100" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4A017]/20 text-[#D4A017] text-[10px] font-black uppercase tracking-wider mb-2">
              Efsane Liste
            </div>
            <h3 className="font-['Poppins',sans-serif] text-base font-black text-white sm:text-lg tracking-tight">
              Top 50 Efsaneler
            </h3>
            <p className="mt-1 text-xs font-medium leading-relaxed text-white/50">
              Tüm zamanların en yüksek puanlı 50 efsane dizisi.
            </p>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#D4A017] transition-colors group-hover:text-white">
            <span>{activeType === 'top50' ? 'Aktif Filtre' : 'Listeyi İncele'}</span>
            <span className="material-symbols-outlined text-[15px] transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Fanned 3-Poster Cards (Top 50) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-1">
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            {/* Card 1: Game of Thrones (Left) */}
            <div className="absolute left-0 top-1/2 h-20 w-13 -translate-y-1/2 -rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/1XS1oqL89v2UkV8SDxs1mOzL18q.jpg"
                alt="Game of Thrones"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 3: The Sopranos (Right) */}
            <div className="absolute right-0 top-1/2 h-20 w-13 -translate-y-1/2 rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg"
                alt="The Sopranos"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 2: Chernobyl (Center - Front) */}
            <div className="relative z-10 h-22 w-14 scale-105 rounded-lg border border-[#D4A017]/60 bg-[#181818] overflow-hidden shadow-xl sm:h-24 sm:w-15">
              <img
                src="https://image.tmdb.org/t/p/w342/hlLXt2tOPT6RRYXBhsnAGya9bCH.jpg"
                alt="Chernobyl"
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
