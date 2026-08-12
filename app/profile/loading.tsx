export default function ProfileLoading() {
  return (
    <main className="w-full overflow-x-hidden md:ml-[200px] md:w-[calc(100%-200px)] min-h-screen bg-[#070709]">
      {/* Kapak Görseli İskeleti */}
      <div className="h-[220px] md:h-[300px] w-full bg-gradient-to-b from-white/[0.04] via-white/[0.02] to-transparent animate-pulse" />

      {/* Profil Başlık ve Avatar İskeleti */}
      <div className="mx-auto -mt-16 sm:-mt-20 md:-mt-24 max-w-[1200px] px-margin-mobile md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-6">
          {/* Avatar Yuvarlağı */}
          <div className="h-24 w-24 sm:h-28 sm:w-28 md:h-36 md:w-36 rounded-full bg-white/[0.07] border-4 border-[#0A0A0A] shrink-0 animate-pulse" />
          
          {/* İsim ve Nick İskelet Çizgileri (Dolgun & Yumuşak Parlamalı) */}
          <div className="flex-1 text-center md:text-left mb-2 flex flex-col items-center md:items-start space-y-2">
            <div className="h-7 w-48 sm:w-60 rounded-xl bg-white/[0.08] animate-pulse" />
            <div className="h-4 w-28 sm:w-36 rounded-lg bg-white/[0.04] animate-pulse" />
          </div>
        </div>

        {/* İstatistikler İskelet Alanı */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-4 max-w-sm mx-auto md:mx-0">
          <div className="h-10 rounded-xl bg-white/[0.03] animate-pulse" />
          <div className="h-10 rounded-xl bg-white/[0.03] animate-pulse" />
          <div className="h-10 rounded-xl bg-white/[0.03] animate-pulse" />
        </div>
      </div>
    </main>
  );
}
