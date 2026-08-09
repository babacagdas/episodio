import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Splash({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const nextPath = params.next ? `&next=${encodeURIComponent(params.next)}` : '';
    redirect(`/auth/callback?code=${params.code}${nextPath}`);
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user) {
    redirect('/home');
  }

  return (
    <div suppressHydrationWarning className="bg-[#000000] h-[100dvh] min-h-[100svh] text-on-background font-body-md text-body-md overflow-hidden antialiased relative">


      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/10 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/30 to-transparent z-20" />
        <img
          alt=""
          className="w-full h-full object-cover opacity-90"
          src="/splash_bg.jpg"
        />
      </div>

      {/* Main Content */}
      <main className="relative z-30 flex h-full w-full flex-col items-center justify-between px-margin-mobile py-5 md:px-margin-desktop md:py-lg">
        {/* Top Spacer */}
        <div className="flex-1 w-full" />

        {/* Center Brand Area */}
        <div className="flex flex-col items-center text-center max-w-md w-full">
          <img alt="Episodio Logo" className="w-[230px] h-auto object-contain transition-transform duration-700 hover:scale-105 md:w-[420px]" src="/logo.png" />
        </div>

        {/* Bottom Action Area */}
        <div className="flex-1 flex flex-col items-center justify-end w-full gap-3 pb-2 md:gap-sm md:pb-md">
          <Link
            href="/signin"
            className="w-full max-w-[230px] bg-[#C91520] hover:bg-[#A8121B] text-white font-label-bold text-sm py-2.5 px-6 rounded-full border border-[#C91520]/40 backdrop-blur-md transition-colors flex items-center justify-center gap-base active:scale-[0.99]"
          >
            <span>Giriş Yap</span>
          </Link>
          <Link
            href="/signup"
            className="w-full max-w-[230px] bg-white/[0.03] text-white border border-white/10 hover:border-white/20 font-label-bold text-sm py-2.5 px-6 rounded-full hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-base backdrop-blur-md active:scale-[0.99]"
          >
            <span>Hesap Oluştur</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
