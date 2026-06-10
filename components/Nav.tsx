'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/watchlist', icon: 'bookmark', label: 'Listem' },
  { href: '/chat', icon: 'chat', label: 'Mesajlar' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

export function MobileHeader({ rightElement }: { rightElement?: ReactNode }) {
  return (
    <header className="bg-[#0A0A0A]/70 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 top-0 z-50 border-b border-white/5 sticky md:hidden">
      <Link href="/home">
        <img alt="Episodio Logo" className="h-16 w-auto object-contain -my-4" src="/logo.png" />
      </Link>
      {rightElement ?? <span className="material-symbols-outlined text-white cursor-pointer">notifications</span>}
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let channel: any = null;

    const fetchUnreadCount = async (uid: string) => {
      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', uid)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    };

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <nav className="bg-[#1A1A1A]/70 backdrop-blur-2xl fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-3 pt-2 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-lg md:hidden">
      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center justify-center transition-all ${active ? 'text-[#D4A017]' : 'text-gray-500 hover:text-gray-200'}`}
          >
            <span className="relative">
              <span className="material-symbols-outlined mb-0.5 text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
              {href === '/chat' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#E50914] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </span>
            <span className="font-['Be_Vietnam_Pro'] text-[9px] font-medium uppercase tracking-widest">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
