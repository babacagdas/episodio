'use client';

import Link from 'next/link';

export default function HomeFeatureBanners() {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* 1. Dizi Eşleştirici -> /swiper */}
      <Link
        href="/swiper"
        className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_12px_35px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] active:scale-[0.99]"
      >
        {/* Subtle Light Ambient Glow */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#C91520]/15 blur-3xl opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <h3 className="font-['Poppins',sans-serif] text-base font-extrabold text-white sm:text-lg">
              Dizi Eşleştirici
            </h3>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-white/55">
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

        {/* Compact Fanned 3-Poster Cards (Yelpaze Kart Görünümü - Mobilde & PC'de Birebir) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-1 pl-2">
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            {/* Card 1: Peaky Blinders (Sol Kart - Yelpaze Açılısı) */}
            <div className="absolute left-0 top-1/2 h-[76px] w-[52px] -translate-y-1/2 -rotate-[14deg] -translate-x-1.5 rounded-lg border border-white/20 bg-[#141414] overflow-hidden shadow-lg transition-transform duration-300 group-hover:-rotate-[18deg] group-hover:-translate-x-3 sm:h-[90px] sm:w-[60px]">
              <img
                src="https://image.tmdb.org/t/p/w342/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg"
                alt="Peaky Blinders"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 3: The Sopranos (Sağ Kart - Yelpaze Açılısı) */}
            <div className="absolute right-0 top-1/2 h-[76px] w-[52px] -translate-y-1/2 rotate-[14deg] translate-x-1.5 rounded-lg border border-white/20 bg-[#141414] overflow-hidden shadow-lg transition-transform duration-300 group-hover:rotate-[18deg] group-hover:translate-x-3 sm:h-[90px] sm:w-[60px]">
              <img
                src="https://image.tmdb.org/t/p/w342/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg"
                alt="The Sopranos"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 2: Breaking Bad (Orta Kart - Önde & Vurgulu) */}
            <div className="relative z-10 h-[84px] w-[58px] scale-105 rounded-lg border border-[#D4A017]/70 bg-[#141414] overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110 sm:h-[98px] sm:w-[66px]">
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
        className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_12px_35px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] active:scale-[0.99]"
      >
        {/* Subtle Light Ambient Glow */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#C91520]/15 blur-3xl opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <h3 className="font-['Poppins',sans-serif] text-base font-extrabold text-white sm:text-lg">
              Oyuncu Eşleştirici
            </h3>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-white/55">
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

        {/* Compact Fanned 3-Actor Cards (Yelpaze Oyuncu Kart Görünümü - Mobilde & PC'de Birebir) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-1 pl-2">
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            {/* Actor 1: Bryan Cranston (Sol Kart - Yelpaze Açılısı) */}
            <div className="absolute left-0 top-1/2 h-[76px] w-[52px] -translate-y-1/2 -rotate-[14deg] -translate-x-1.5 rounded-lg border border-white/20 bg-[#141414] overflow-hidden shadow-lg transition-transform duration-300 group-hover:-rotate-[18deg] group-hover:-translate-x-3 sm:h-[90px] sm:w-[60px]">
              <img
                src="https://image.tmdb.org/t/p/w342/npIIZJGSrcJIJ6yHdmbqO6Jzo5I.jpg"
                alt="Bryan Cranston"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 3: Cillian Murphy (Sağ Kart - Yelpaze Açılısı) */}
            <div className="absolute right-0 top-1/2 h-[76px] w-[52px] -translate-y-1/2 rotate-[14deg] translate-x-1.5 rounded-lg border border-white/20 bg-[#141414] overflow-hidden shadow-lg transition-transform duration-300 group-hover:rotate-[18deg] group-hover:translate-x-3 sm:h-[90px] sm:w-[60px]">
              <img
                src="https://image.tmdb.org/t/p/w342/2lKs67r7FI4bPu0AXxMUJZxmUXn.jpg"
                alt="Cillian Murphy"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 2: Pedro Pascal (Orta Kart - Önde & Vurgulu) */}
            <div className="relative z-10 h-[84px] w-[58px] scale-105 rounded-lg border border-[#C91520]/70 bg-[#141414] overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110 sm:h-[98px] sm:w-[66px]">
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
