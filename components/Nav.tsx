'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendLocalNotification } from '@/lib/pushNotifications';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/swiper', icon: 'style', label: 'Seç' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/chat', icon: 'chat', label: 'Mesajlar' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

import FriendsActivityHeaderModal from '@/app/home/FriendsActivityHeaderModal';

export function MobileHeader({ rightElement }: { rightElement?: ReactNode }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 w-full items-center justify-between px-4 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)] md:hidden">
      {/* Sol Dengeleyici */}
      <div className="w-16 shrink-0" aria-hidden />

      {/* Tam Ortalı Logo */}
      <Link href="/home" className="flex items-center justify-center">
        <img alt="Episodio Logo" className="h-6 w-auto object-contain" src="/logo.png" />
      </Link>

      {/* Sağ İkonlar (Kalp & Zil) */}
      <div className="flex items-center gap-1 justify-end w-16 shrink-0">
        <FriendsActivityHeaderModal />
        {rightElement ?? (
          <Link href="/notifications" aria-label="Bildirimler" className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.03] text-white/75 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">notifications</span>
          </Link>
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

    async function setupChannel(uid: string) {
      if (channel) return;
      userId = uid;
      fetchUnreadCount(uid);

      channel = supabase
        .channel(`bottom_nav_unread_messages_${uid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
          },
          async (payload: any) => {
            const msg = payload.new;
            if (msg && msg.receiver_id === uid && msg.sender_id !== uid) {
              fetchUnreadCount(uid);
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', msg.sender_id)
                .maybeSingle();

              const senderName = senderProfile?.full_name || (senderProfile?.username ? `@${senderProfile.username}` : 'Bir arkadaşın');
              const snippet = msg.content ? (msg.content.length > 50 ? `${msg.content.slice(0, 50)}...` : msg.content) : 'Sana bir mesaj gönderdi.';

              sendLocalNotification(
                `Episodio 💬 (${senderName})`,
                snippet,
                '/chat'
              );
            }
          }
        )
        .subscribe();
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setupChannel(user.id);
      }
    }

    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setupChannel(session.user.id);
      }
    });
    window.addEventListener('focus', refreshUnread);
    window.addEventListener('episodio:messages-read', refreshUnread);

    return () => {
      window.removeEventListener('focus', refreshUnread);
      window.removeEventListener('episodio:messages-read', refreshUnread);
      if (authSub) authSub.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <nav className="bg-[#141414]/94 backdrop-blur-2xl fixed bottom-4 left-4 right-4 z-50 grid h-[58px] grid-cols-5 items-center px-2 border border-white/15 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] md:hidden">
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
