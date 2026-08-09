'use client';

import Link from 'next/link';

export default function HomeFeatureBanners() {
  return (
    <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Dizi Swiper / Mutlaka İzlenmesi Gerekenler -> /swiper */}
      <Link
        href="/swiper"
        className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl bg-[#0F0F10] p-6 shadow-[0_16px_45px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-[#141415] hover:shadow-[0_22px_60px_rgba(212,160,23,0.15)] active:scale-[0.99] sm:flex-row"
      >
        {/* Subtle Ambient Gold Glow (Top Left) */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[#D4A017]/15 blur-3xl transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,160,23,0.1),transparent_65%)]" />

        {/* Fanned 3-Poster Cards (Left Side) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-3 sm:py-0">
          <div className="relative flex items-center justify-center">
            {/* Card 1: Peaky Blinders (Left) */}
            <div className="relative z-0 h-36 w-24 -rotate-[10deg] -mr-7 rounded-xl border border-[#D4A017]/35 bg-[#181818] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:-rotate-[14deg] group-hover:-translate-x-1 sm:h-44 sm:w-28">
              <img
                src="https://image.tmdb.org/t/p/w342/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg"
                alt="Peaky Blinders"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 2: Breaking Bad (Center - Front) */}
            <div className="relative z-20 h-40 w-26 scale-105 rounded-xl border-2 border-[#D4A017]/80 bg-[#181818] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover:scale-110 sm:h-48 sm:w-30">
              <img
                src="https://image.tmdb.org/t/p/w342/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg"
                alt="Breaking Bad"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 3: The Sopranos (Right) */}
            <div className="relative z-0 h-36 w-24 rotate-[10deg] -ml-7 rounded-xl border border-[#D4A017]/35 bg-[#181818] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:rotate-[14deg] group-hover:translate-x-1 sm:h-44 sm:w-28">
              <img
                src="https://image.tmdb.org/t/p/w342/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg"
                alt="The Sopranos"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Text & Action (Right Side) */}
        <div className="relative z-10 mt-5 flex flex-col justify-between text-center sm:mt-0 sm:pl-5 sm:text-left">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/10 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#E8B838]">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span>PREMIUM DİZİ DENEYİMİ</span>
            </div>

            <h3 className="font-['Poppins',sans-serif] text-lg font-black leading-tight tracking-normal text-white sm:text-xl">
              EFSANE DİZİLER, <br className="hidden sm:inline" />
              <span className="text-[#E8B838]">TEK YERDE.</span>
            </h3>

            <p className="mt-2 text-[12px] font-medium leading-relaxed text-white/55">
              Sevdiğini sağa, sevmediğini sola yolla, hemen listeni hazırla.
            </p>
          </div>

          <div className="mt-4 flex justify-center sm:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4A017]/40 bg-[#D4A017]/10 px-4 py-2 text-xs font-bold text-[#E8B838] transition-all duration-300 group-hover:border-[#D4A017] group-hover:bg-[#D4A017] group-hover:text-black">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
              <span>Hemen Keşfet</span>
              <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </span>
          </div>
        </div>
      </Link>

      {/* 2. Oyuncu Eşleştirici -> /actor-match */}
      <Link
        href="/actor-match"
        className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl bg-[#0F0F10] p-6 shadow-[0_16px_45px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-[#141415] hover:shadow-[0_22px_60px_rgba(201,21,32,0.18)] active:scale-[0.99] sm:flex-row"
      >
        {/* Subtle Ambient Crimson Glow (Top Left) */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[#C91520]/15 blur-3xl transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,21,32,0.1),transparent_65%)]" />

        {/* Fanned 3-Actor Cards (Left Side) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-3 sm:py-0">
          <div className="relative flex items-center justify-center">
            {/* Actor 1: Bryan Cranston (Left) */}
            <div className="relative z-0 h-36 w-24 -rotate-[10deg] -mr-7 rounded-xl border border-[#C91520]/40 bg-[#181818] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:-rotate-[14deg] group-hover:-translate-x-1 sm:h-44 sm:w-28">
              <img
                src="https://image.tmdb.org/t/p/w342/npIIZJGSrcJIJ6yHdmbqO6Jzo5I.jpg"
                alt="Bryan Cranston"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 2: Pedro Pascal (Center - Front) */}
            <div className="relative z-20 h-40 w-26 scale-105 rounded-xl border-2 border-[#C91520]/80 bg-[#181818] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover:scale-110 sm:h-48 sm:w-30">
              <img
                src="https://image.tmdb.org/t/p/w342/oKcMbVn0NJTNzQt0ClKKvVXkm60.jpg"
                alt="Pedro Pascal"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 3: Cillian Murphy (Right) */}
            <div className="relative z-0 h-36 w-24 rotate-[10deg] -ml-7 rounded-xl border border-[#C91520]/40 bg-[#181818] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:rotate-[14deg] group-hover:translate-x-1 sm:h-44 sm:w-28">
              <img
                src="https://image.tmdb.org/t/p/w342/2lKs67r7FI4bPu0AXxMUJZxmUXn.jpg"
                alt="Cillian Murphy"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Text & Action (Right Side) */}
        <div className="relative z-10 mt-5 flex flex-col justify-between text-center sm:mt-0 sm:pl-5 sm:text-left">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#C91520]/30 bg-[#C91520]/10 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-[#FF525D]">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>extension</span>
              <span>OYUNCU KEŞİF MODU</span>
            </div>

            <h3 className="font-['Poppins',sans-serif] text-lg font-black leading-tight tracking-normal text-white sm:text-xl">
              OYUNCU <br className="hidden sm:inline" />
              <span className="text-[#FF525D]">EŞLEŞTİRİCİ.</span>
            </h3>

            <p className="mt-2 text-[12px] font-medium leading-relaxed text-white/55">
              Sevdiğin oyuncuları sağa kaydır, profilinde sırala.
            </p>
          </div>

          <div className="mt-4 flex justify-center sm:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C91520]/40 bg-[#C91520]/10 px-4 py-2 text-xs font-bold text-[#FF525D] transition-all duration-300 group-hover:border-[#C91520] group-hover:bg-[#C91520] group-hover:text-white">
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
              <span>Oyuncu Eşleştir</span>
              <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
