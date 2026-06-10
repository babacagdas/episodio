import Link from 'next/link';

export default function Splash() {
  return (
    <div suppressHydrationWarning className="bg-[#0A0A0A] min-h-screen text-on-background font-body-md text-body-md overflow-hidden antialiased">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent z-20" />
        <img
          alt=""
          className="w-full h-full object-cover opacity-50 blur-[2px]"
          src="/splash_bg.jpg"
        />
      </div>

      {/* Main Content */}
      <main className="relative z-30 flex flex-col items-center justify-between min-h-screen w-full px-margin-mobile md:px-margin-desktop py-lg">
        {/* Top Spacer */}
        <div className="flex-1 w-full" />

        {/* Center Brand Area */}
        <div className="flex flex-col items-center text-center max-w-md w-full">
          <img alt="Episodio Logo" className="h-40 md:h-56 w-auto object-contain hover:scale-105 transition-transform duration-700" src="/logo.png" />
        </div>

        {/* Bottom Action Area */}
        <div className="flex-1 flex flex-col justify-end w-full max-w-xs gap-sm pb-md">
          <Link
            href="/signin"
            className="w-full bg-[#E50914]/20 hover:bg-[#E50914]/30 text-white font-label-bold text-label-bold py-3.5 px-md rounded-full border border-[#E50914]/40 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-base shadow-[0_0_30px_rgba(229,9,20,0.15)] hover:shadow-[0_0_40px_rgba(229,9,20,0.25)] hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Giriş Yap</span>
          </Link>
          <Link
            href="/signup"
            className="w-full bg-white/[0.02] text-white border border-white/10 hover:border-white/20 font-label-bold text-label-bold py-3.5 px-md rounded-full hover:bg-white/[0.06] transition-all duration-300 flex items-center justify-center gap-base backdrop-blur-md hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Hesap Oluştur</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
