'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/search', icon: 'explore', label: 'Keşfet' },
  { href: '/chat', icon: 'chat', label: 'Mesajlar' },
  { href: '/profile', icon: 'person', label: 'Profilim' },
];

const shortcutItems = [
  { href: '/watchlist', icon: 'bookmark', label: 'İzleme Listesi' },
  { href: '/swiper', icon: 'style', label: 'Mutlaka İzlenecekler' },
  { href: '/actor-match', icon: 'person_search', label: 'Oyuncu Eşleştirici' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let channel: any = null;
    let userId: string | null = null;

    const fetchUnreadCount = async (uid: string) => {
      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', uid)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };

    const refreshUnread = () => {
      if (userId) void fetchUnreadCount(userId);
    };

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        fetchUnreadCount(user.id);

        channel = supabase
          .channel('sidebar_unread_messages')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
            fetchUnreadCount(user.id);
          })
          .subscribe();
      }
    }

    init();
    window.addEventListener('focus', refreshUnread);
    window.addEventListener('episodio:messages-read', refreshUnread);

    return () => {
      window.removeEventListener('focus', refreshUnread);
      window.removeEventListener('episodio:messages-read', refreshUnread);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-50 h-full w-[240px] flex-col border-r border-white/[0.08] bg-transparent px-5 py-6">
      <Link href="/home" className="mx-auto mb-8 block w-[150px]">
        <Image
          alt="Episodio Logo"
          className="h-auto w-full object-contain"
          src="/logo.png"
          width={300}
          height={86}
          priority
          sizes="150px"
        />
      </Link>

      <nav className="space-y-1">
        {navItems.map(({ href, icon, label }) => {
          const baseHref = href.split('?')[0];
          const active = pathname === baseHref || pathname.startsWith(`${baseHref}/`);
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={`group relative flex h-11 items-center gap-3 rounded-xl px-4 text-[13.5px] font-semibold transition-all duration-300 ${
                active
                  ? 'bg-[#C91520]/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-white/60 hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-colors duration-300 ${
                  active ? 'text-[#C91520]' : 'text-white/50 group-hover:text-white'
                }`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {href === '/chat' && unreadCount > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#C91520] px-1.5 text-[10px] font-extrabold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7">
        <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Kısayollar</p>
        <nav className="space-y-1">
          {shortcutItems.map(({ href, icon, label }) => (
            <Link
              key={label}
              href={href}
              className="group flex h-10 items-center gap-3 rounded-xl px-4 text-[13px] font-semibold text-white/50 transition-all duration-300 hover:bg-white/[0.03] hover:text-white"
            >
              <span className="material-symbols-outlined text-[19px] text-white/40 group-hover:text-white">{icon}</span>
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-3 px-1">
        <a
          href="https://www.instagram.com/episodiotr/"
          target="_blank"
          rel="noreferrer"
          aria-label="Episodio Instagram"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/45 transition-all duration-200 hover:border-[#C91520]/40 hover:bg-[#C91520]/10 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <p className="max-w-[180px] text-[10px] leading-relaxed text-white/22">
          © 2026 episodio. Tüm hakları saklıdır.
        </p>
      </div>
    </aside>
  );
}
