'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/swiper', icon: 'style', label: 'Seç' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/chat', icon: 'chat', label: 'Mesajlar' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

export function MobileHeader({ rightElement }: { rightElement?: ReactNode }) {
  return (
    <header className="bg-[#0A0A0A]/85 backdrop-blur-lg grid grid-cols-[2.25rem_1fr_2.25rem] items-center w-full px-6 py-4 top-0 z-50 border-b border-white/10 sticky md:hidden">
      <span aria-hidden />
      <Link href="/home" className="mx-auto block w-[118px]">
        <img alt="Episodio Logo" className="h-auto w-full object-contain" src="/logo.png" />
      </Link>
      <div className="flex justify-end">
        {rightElement ?? (
        <span className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] text-white/75 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </span>
        )}
      </div>
    </header>
  );
}

export function BottomNav() {
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
          .channel('bottom_nav_unread_messages')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'direct_messages',
            },
            () => {
              fetchUnreadCount(user.id);
            }
          )
          .subscribe();
      }
    }

    init();
    window.addEventListener('focus', refreshUnread);
    window.addEventListener('episodio:messages-read', refreshUnread);

    return () => {
      window.removeEventListener('focus', refreshUnread);
      window.removeEventListener('episodio:messages-read', refreshUnread);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <nav className="bg-[#111111]/92 backdrop-blur-xl fixed bottom-0 left-0 w-full z-50 grid h-[64px] grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)] border-t border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] md:hidden">
      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={label}
            href={href}
            aria-label={label}
            title={label}
            className={`min-w-0 flex h-full items-center justify-center rounded-lg px-1 transition-colors ${active ? 'text-[#D4A017]' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <span className="relative">
              <span className="material-symbols-outlined text-[23px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
              {href === '/chat' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#C91520] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
