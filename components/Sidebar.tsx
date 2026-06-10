'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/watchlist', icon: 'bookmark', label: 'Listem' },
  { href: '/chat', icon: 'chat', label: 'Mesajlar' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
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
        setLoggedIn(true);
        fetchUnreadCount(user.id);

        channel = supabase
          .channel('sidebar_unread_messages')
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
    <div className="hidden md:flex fixed left-0 top-0 h-full w-[240px] bg-[#0A0A0A] border-r border-white/5 flex-col py-8 px-6 z-50">
      <div className="mb-12">
        <img alt="Episodio Logo" className="h-6 w-auto object-contain" src="/logo.png" />
      </div>
      <nav className="flex flex-col gap-6">
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 font-label-bold text-label-bold transition-colors ${active ? 'text-[#D4A017]' : 'text-gray-400 hover:text-white'}`}
            >
              <span className="relative">
                <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
                {href === '/chat' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E50914] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        {loggedIn && (
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="flex items-center gap-3 text-white/40 hover:text-white transition-colors w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-bold text-label-bold">Çıkış Yap</span>
          </button>
        )}
      </div>
    </div>
  );
}