import Link from 'next/link';

export default function Splash() {
  return (
    <div suppressHydrationWarning className="bg-background min-h-screen text-on-background font-body-md text-body-md overflow-hidden antialiased">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black bg-opacity-70 z-10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-20" />
        <img
          alt=""
          className="w-full h-full object-cover opacity-40"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8xVess-7fTupf9bSDMqw778-MYIBuWbnzYAvyc_E-6YSNFaZ7lDMe5hwSSJe7Nkw3w1BC_X0uXgNHS8B7RJ81wNP3pPL8hT9P4VaYHA3Zz5jevZXJUSfmu6fO4N8063QxMIkg92LVHGkK1S4EeoFSAiLXP4sfan7C2_A-f5vrdQalb1BonHGK3m9a_BsiUtR7z5nzLU7hpNRJ604_z6gs4ucE0UFaGnJ2jH0IO8Yi2vMIS3Om7XJ5fj7g-93SuvG2ukn0pAn7kKMG"
        />
      </div>

      {/* Main Content */}
      <main className="relative z-30 flex flex-col items-center justify-between min-h-screen w-full px-margin-mobile md:px-margin-desktop py-lg">
        {/* Top Spacer */}
        <div className="flex-1 w-full" />

        {/* Center Brand Area */}
        <div className="flex flex-col items-center text-center max-w-md w-full">
          <img alt="Episodio Logo" className="h-24 w-auto mb-md object-contain" src="/logo.png" />
          <h1 className="font-display-xl text-display-xl text-white tracking-tighter uppercase relative flex items-center gap-xs justify-center mb-base">
            EPISODIO<span className="text-primary-container leading-none">.</span>
          </h1>
        </div>

        {/* Bottom Action Area */}
        <div className="flex-1 flex flex-col justify-end w-full max-w-md gap-base pb-md">
          <Link
            href="/signin"
            className="w-full bg-primary-container text-white font-label-bold text-label-bold py-sm px-md rounded-full shadow-[0_4px_20px_rgba(229,9,20,0.3)] hover:bg-opacity-90 transition-all flex items-center justify-center gap-base"
          >
            <span>Sign In</span>
          </Link>
          <Link
            href="/signup"
            className="w-full bg-transparent text-white border border-white/20 font-label-bold text-label-bold py-sm px-md rounded-full hover:bg-white/5 transition-all flex items-center justify-center gap-base backdrop-blur-sm"
          >
            <span>Create Account</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
