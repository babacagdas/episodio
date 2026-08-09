'use client';

import Link from 'next/link';

export default function HomeFeatureBanners() {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* 1. Mutlaka İzlenmesi Gerekenler -> /swiper */}
      <Link
        href="/swiper"
        className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-[#121212] p-5 shadow-lg transition-colors duration-200 hover:bg-[#161616] active:scale-[0.99]"
      >
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#C91520]/10 blur-2xl transition-opacity group-hover:opacity-100" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <h3 className="font-['Poppins',sans-serif] text-base font-extrabold text-white sm:text-lg">
              Dizi Eşleştirici
            </h3>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-white/50">
              Sevdiğini sağa, sevmediğini sola yolla, hemen listeni hazırla.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#C91520] transition-colors group-hover:text-white">
            <span>Listeni Hazırla</span>
            <span className="material-symbols-outlined text-[15px] transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Compact Fanned 3-Poster Cards (Peaky Blinders, Breaking Bad, Sopranos) */}
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

            {/* Card 3: The Sopranos (Right) */}
            <div className="absolute right-0 top-1/2 h-20 w-13 -translate-y-1/2 rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg"
                alt="The Sopranos"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 2: Breaking Bad (Center - Front) */}
            <div className="relative z-10 h-22 w-14 scale-105 rounded-lg border border-[#D4A017]/60 bg-[#181818] overflow-hidden shadow-xl sm:h-24 sm:w-15">
              <img
                src="https://image.tmdb.org/t/p/w342/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg"
                alt="Breaking Bad"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* 2. Oyuncu Eşleştirici -> /actor-match */}
      <Link
        href="/actor-match"
        className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-[#121212] p-5 shadow-lg transition-colors duration-200 hover:bg-[#161616] active:scale-[0.99]"
      >
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#C91520]/10 blur-2xl transition-opacity group-hover:opacity-100" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <h3 className="font-['Poppins',sans-serif] text-base font-extrabold text-white sm:text-lg">
              Oyuncu Eşleştirici
            </h3>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-white/50">
              Sevdiğin oyuncuları sağa kaydır, profilinde sırala.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#C91520] transition-colors group-hover:text-white">
            <span>Oyuncu Eşleştir</span>
            <span className="material-symbols-outlined text-[15px] transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Compact Fanned 3-Actor Cards (Bryan Cranston, Pedro Pascal, Cillian Murphy) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-1">
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            {/* Actor 1: Bryan Cranston (Left) */}
            <div className="absolute left-0 top-1/2 h-20 w-13 -translate-y-1/2 -rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/npIIZJGSrcJIJ6yHdmbqO6Jzo5I.jpg"
                alt="Bryan Cranston"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 3: Cillian Murphy (Right) */}
            <div className="absolute right-0 top-1/2 h-20 w-13 -translate-y-1/2 rotate-12 rounded-lg border border-white/10 bg-[#181818] overflow-hidden shadow-md sm:h-22 sm:w-14">
              <img
                src="https://image.tmdb.org/t/p/w342/2lKs67r7FI4bPu0AXxMUJZxmUXn.jpg"
                alt="Cillian Murphy"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 2: Pedro Pascal (Center - Front) */}
            <div className="relative z-10 h-22 w-14 scale-105 rounded-lg border border-[#C91520]/60 bg-[#181818] overflow-hidden shadow-xl sm:h-24 sm:w-15">
              <img
                src="https://image.tmdb.org/t/p/w342/oKcMbVn0NJTNzQt0ClKKvVXkm60.jpg"
                alt="Pedro Pascal"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
