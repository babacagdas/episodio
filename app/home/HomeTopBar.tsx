import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NotificationsBell from './NotificationsBell';

export default async function HomeTopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = 'Episodio';
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, full_name, username')
      .eq('id', user.id)
      .maybeSingle();

    avatarUrl = profile?.avatar_url || null;
    displayName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Episodio';
  }

  return (
    <>
      <div className="mb-6 flex w-full flex-col gap-3 lg:hidden">
        <div className="font-['Poppins',sans-serif] leading-tight tracking-normal text-white">
          <span className="text-[1.9rem] font-extrabold">Hoşgeldin,</span>{' '}
          <span className="align-baseline text-[1.28rem] font-bold text-[#C91520]">{displayName}</span>
        </div>

        <Link
          href="/search"
          className="group flex h-9 w-full items-center gap-3 border-b border-[#C91520]/75 bg-transparent px-1 text-[12.5px] text-white/45 transition-colors duration-300 hover:border-[#C91520] hover:text-white/60"
        >
          <span className="material-symbols-outlined text-[18px] text-white/40 transition-colors group-hover:text-white">search</span>
          <span className="min-w-0 flex-1 truncate">Dizi, liste veya kullanıcı ara...</span>
        </Link>
      </div>

      <div className="mb-7 hidden w-full items-start justify-between gap-6 py-2 lg:flex">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="font-['Poppins',sans-serif] leading-none tracking-normal text-white">
            <span className="text-[2.35rem] font-extrabold">Hoşgeldin,</span>{' '}
            <span className="align-baseline text-[1.55rem] font-bold text-[#C91520]">{displayName}</span>
          </div>

          <Link
            href="/search"
            className="group mt-1.5 flex h-9 w-full min-w-[360px] max-w-[460px] items-center gap-3 border-b border-[#C91520]/75 bg-transparent px-1 text-[12.5px] text-white/45 transition-colors duration-300 hover:border-[#C91520] hover:text-white/60"
          >
            <span className="material-symbols-outlined text-[18px] text-white/40 transition-colors group-hover:text-white">search</span>
            <span className="flex-1">Dizi, liste veya kullanıcı ara...</span>
            <span className="text-[10px] font-bold tracking-wider text-white/30 transition-colors group-hover:text-white/50">⌘ K</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Link
            href="/profile?tab=lists&createList=1"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#C91520] px-3.5 text-[12px] font-bold text-white shadow-[0_4px_12px_rgba(201,21,32,0.18)] transition-all duration-200 hover:bg-[#A8121B] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px] font-black">add</span>
            <span>Liste Oluştur</span>
          </Link>

          <NotificationsBell />

          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/[0.1] bg-transparent text-white/70 transition-all duration-200 hover:border-white/[0.2] hover:text-white"
            aria-label="Profil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[19px]">person</span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}
