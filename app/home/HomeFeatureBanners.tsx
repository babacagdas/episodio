'use client';

import Link from 'next/link';

export default function HomeFeatureBanners() {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* 1. Mutlaka İzlenmesi Gerekenler -> /swiper */}
      <Link
        href="/swiper"
        className="group relative flex min-h-[160px] items-center justify-between overflow-hidden rounded-2xl bg-[#121212] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:bg-[#161616] hover:shadow-[0_20px_50px_rgba(201,21,32,0.18)] active:scale-[0.99]"
      >
        {/* Subtle Glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#C91520]/15 blur-3xl transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,21,32,0.08),transparent_65%)]" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <h3 className="font-['Poppins',sans-serif] text-base font-extrabold text-white sm:text-[17px]">
              Mutlaka İzlenmesi Gerekenler
            </h3>
            <p className="mt-1.5 max-w-[210px] text-[12px] font-medium leading-relaxed text-white/50">
              Sevdiğini sağa, sevmediğini sola yolla, hemen listeni hazırla.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[#C91520] transition-colors group-hover:text-white">
            <span>Listeni Hazırla</span>
            <span className="material-symbols-outlined text-[15px] transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Fanned 3-Card Stack (Breaking Bad, Sopranos, Prison Break) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-2 pr-2">
          <div className="relative flex h-24 w-28 items-center justify-center sm:h-28 sm:w-32">
            {/* Card 1: Prison Break (Left) */}
            <div className="absolute left-0 top-1/2 h-20 w-14 -translate-y-1/2 -rotate-12 rounded-lg border border-white/10 bg-[#1e1e1e] shadow-lg transition-transform duration-500 group-hover:-rotate-[16deg] group-hover:-translate-x-1 sm:h-24 sm:w-16">
              <img
                src="https://image.tmdb.org/t/p/w342/wnmNPaLvhnMeOqnWlhNkYCZxtda.jpg"
                alt="Prison Break"
                className="h-full w-full rounded-lg object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 3: The Sopranos (Right) */}
            <div className="absolute right-0 top-1/2 h-20 w-14 -translate-y-1/2 rotate-12 rounded-lg border border-white/10 bg-[#1e1e1e] shadow-lg transition-transform duration-500 group-hover:rotate-[16deg] group-hover:translate-x-1 sm:h-24 sm:w-16">
              <img
                src="https://image.tmdb.org/t/p/w342/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg"
                alt="The Sopranos"
                className="h-full w-full rounded-lg object-cover"
                loading="lazy"
              />
            </div>

            {/* Card 2: Breaking Bad (Center - Top) */}
            <div className="relative z-10 h-22 w-15 scale-105 rounded-lg border border-white/20 bg-[#1e1e1e] shadow-2xl transition-transform duration-500 group-hover:scale-110 sm:h-26 sm:w-17">
              <img
                src="https://image.tmdb.org/t/p/w342/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg"
                alt="Breaking Bad"
                className="h-full w-full rounded-lg object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* 2. Oyuncu Eşleştirici -> /actor-match */}
      <Link
        href="/actor-match"
        className="group relative flex min-h-[160px] items-center justify-between overflow-hidden rounded-2xl bg-[#121212] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:bg-[#161616] hover:shadow-[0_20px_50px_rgba(201,21,32,0.18)] active:scale-[0.99]"
      >
        {/* Subtle Glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#C91520]/15 blur-3xl transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,21,32,0.08),transparent_65%)]" />

        {/* Text Content */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pr-3">
          <div>
            <h3 className="font-['Poppins',sans-serif] text-base font-extrabold text-white sm:text-[17px]">
              Oyuncu Eşleştirici
            </h3>
            <p className="mt-1.5 max-w-[210px] text-[12px] font-medium leading-relaxed text-white/50">
              Sevdiğin oyuncuları sağa kaydır, profilinde sırala.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[#C91520] transition-colors group-hover:text-white">
            <span>Oyuncu Eşleştir</span>
            <span className="material-symbols-outlined text-[15px] transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>

        {/* Fanned 3-Actor Card Stack (Bryan Cranston, Pedro Pascal, Cillian Murphy) */}
        <div className="relative z-10 flex shrink-0 items-center justify-center py-2 pr-2">
          <div className="relative flex h-24 w-28 items-center justify-center sm:h-28 sm:w-32">
            {/* Actor 1: Bryan Cranston (Left) */}
            <div className="absolute left-0 top-1/2 h-20 w-14 -translate-y-1/2 -rotate-12 rounded-lg border border-white/10 bg-[#1e1e1e] shadow-lg transition-transform duration-500 group-hover:-rotate-[16deg] group-hover:-translate-x-1 sm:h-24 sm:w-16">
              <img
                src="https://image.tmdb.org/t/p/w342/npIIZJGSrcJIJ6yHdmbqO6Jzo5I.jpg"
                alt="Bryan Cranston"
                className="h-full w-full rounded-lg object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 3: Cillian Murphy (Right) */}
            <div className="absolute right-0 top-1/2 h-20 w-14 -translate-y-1/2 rotate-12 rounded-lg border border-white/10 bg-[#1e1e1e] shadow-lg transition-transform duration-500 group-hover:rotate-[16deg] group-hover:translate-x-1 sm:h-24 sm:w-16">
              <img
                src="https://image.tmdb.org/t/p/w342/2lKs67r7FI4bPu0AXxMUJZxmUXn.jpg"
                alt="Cillian Murphy"
                className="h-full w-full rounded-lg object-cover"
                loading="lazy"
              />
            </div>

            {/* Actor 2: Pedro Pascal (Center - Top) */}
            <div className="relative z-10 h-22 w-15 scale-105 rounded-lg border border-white/20 bg-[#1e1e1e] shadow-2xl transition-transform duration-500 group-hover:scale-110 sm:h-26 sm:w-17">
              <img
                src="https://image.tmdb.org/t/p/w342/oKcMbVn0NJTNzQt0ClKKvVXkm60.jpg"
                alt="Pedro Pascal"
                className="h-full w-full rounded-lg object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
