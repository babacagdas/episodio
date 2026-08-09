'use client';

import Link from 'next/link';

export default function HomeFeatureBanners() {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Mutlaka İzlenecekler Banner */}
      <Link
        href="/search?sort=rating"
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#181214] via-[#121212] to-[#0A0A0A] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#D4A017]/40 hover:shadow-[0_16px_45px_rgba(212,160,23,0.12)] active:scale-[0.99]"
      >
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D4A017]/10 blur-2xl transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,23,0.08),transparent_60%)]" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#E8B838]">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span>Kült Eserler</span>
            </span>
            <span className="material-symbols-outlined text-white/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
              arrow_forward
            </span>
          </div>

          <h3 className="font-['Poppins',sans-serif] text-base font-extrabold tracking-normal text-white sm:text-lg">
            Mutlaka İzlenmesi Gerekenler
          </h3>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-white/50">
            Tüm zamanların en yüksek puanlı başyapıt dizilerini incele.
          </p>
        </div>

        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-bold text-[#E8B838] transition-colors group-hover:text-white">
          <span>Hemen Keşfet</span>
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </div>
      </Link>

      {/* Oyuncu Eşleştirici Banner */}
      <Link
        href="/actor-match"
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1c1214] via-[#121212] to-[#0A0A0A] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-[#C91520]/40 hover:shadow-[0_16px_45px_rgba(201,21,32,0.15)] active:scale-[0.99]"
      >
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#C91520]/15 blur-2xl transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,21,32,0.1),transparent_60%)]" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#C91520]/30 bg-[#C91520]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#FF525D]">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>extension</span>
              <span>İnteraktif Araç</span>
            </span>
            <span className="material-symbols-outlined text-white/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white">
              arrow_forward
            </span>
          </div>

          <h3 className="font-['Poppins',sans-serif] text-base font-extrabold tracking-normal text-white sm:text-lg">
            Oyuncu Eşleştirici
          </h3>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-white/50">
            Sevdiğin oyuncuları seç, birlikte oynadıkları dizileri anında bul.
          </p>
        </div>

        <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-bold text-[#FF525D] transition-colors group-hover:text-white">
          <span>Oyuncu Eşleştir</span>
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </div>
      </Link>
    </section>
  );
}
