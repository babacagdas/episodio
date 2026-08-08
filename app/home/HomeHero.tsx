import Link from 'next/link';
import Image from 'next/image';

export default function HomeHero() {
  return (
    <section className="mb-8 grid w-full grid-cols-1 items-stretch gap-5 md:grid-cols-12">
      <div className="relative flex min-h-[300px] overflow-hidden rounded-2xl border border-white/[0.06] bg-transparent p-6 shadow-[0_22px_60px_rgba(0,0,0,0.32)] sm:p-8 md:col-span-12">
        <div className="absolute inset-0">
          <Image
            src="/splash_bg.jpg"
            alt=""
            fill
            priority
            quality={52}
            sizes="(max-width: 768px) 100vw, (max-width: 1536px) calc(100vw - 280px), 1180px"
            className="object-cover opacity-32"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#070707_0%,rgba(7,7,7,0.9)_42%,rgba(7,7,7,0.35)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,#070707_0%,rgba(7,7,7,0.34)_48%,rgba(7,7,7,0.06)_100%)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-normal text-white sm:text-4xl">
              İzle,
              <br />
              <span className="text-[#C91520]">Tartış</span>, Paylaş.
            </h1>
            <p className="mt-3 max-w-sm text-[13.5px] font-semibold leading-relaxed text-white/50">
              Sevdiğin dizileri keşfet, listeler oluştur ve arkadaşlarınla konuş.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#C91520] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_4px_12px_rgba(201,21,32,0.18)] transition-all hover:bg-[#A8121B] active:scale-[0.98]"
            >
              <span>Keşfet</span>
              <span className="material-symbols-outlined text-[15px] font-bold">chevron_right</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
