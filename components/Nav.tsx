'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendLocalNotification } from '@/lib/pushNotifications';
import FriendsActivityHeaderModal from '@/app/home/FriendsActivityHeaderModal';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/swiper', icon: 'style', label: 'Seç' },
  { href: '/chat', icon: 'mark_unread_chat_alt', label: 'Mesajlar' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

export function MobileHeader({ rightElement }: { rightElement?: ReactNode }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 w-full items-center justify-between px-4 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)] md:hidden">
      {/* Sol Dengeleyici */}
      <div className="w-16 shrink-0" aria-hidden />

      {/* Tam Ortalı Logo (Hafif Büyütüldü) */}
      <Link href="/home" className="flex items-center justify-center">
        <img alt="Episodio Logo" className="h-7 w-auto object-contain" src="/logo.png" />
      </Link>

      {/* Sağ İkonlar (Kalp & Zil) */}
      <div className="flex items-center gap-1.5 justify-end w-16 shrink-0">
        <FriendsActivityHeaderModal />
        {rightElement ?? (
          <Link href="/notifications" aria-label="Bildirimler" className="flex h-9 w-9 items-center justify-center text-white/80 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Önbellekten anında avatar yükleme (3 saniye gecikmeyi sıfırlama)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('episodio_user_avatar');
      if (cached) {
        setUserAvatar(cached);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let channel: any = null;
    let userId: string | null = null;

    const fetchUserData = async (uid: string) => {
      // 1. Okunmamış mesaj sayısı
      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', uid)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);

      // 2. Kullanıcı Profil Resmi
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', uid)
        .maybeSingle();

      if (profile?.avatar_url) {
        setUserAvatar(profile.avatar_url);
        try {
          localStorage.setItem('episodio_user_avatar', profile.avatar_url);
        } catch {
          // ignore
        }
      }
    };

    const refreshUserData = () => {
      if (userId) void fetchUserData(userId);
    };

    async function setupChannel(uid: string) {
      if (channel) return;
      userId = uid;
      fetchUserData(uid);

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
              fetchUserData(uid);
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

    const handleAvatarUpdate = (e: any) => {
      if (e?.detail?.avatar_url) {
        setUserAvatar(e.detail.avatar_url);
        try {
          localStorage.setItem('episodio_user_avatar', e.detail.avatar_url);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('focus', refreshUserData);
    window.addEventListener('episodio:messages-read', refreshUserData);
    window.addEventListener('episodio:avatar-updated', handleAvatarUpdate);

    return () => {
      window.removeEventListener('focus', refreshUserData);
      window.removeEventListener('episodio:messages-read', refreshUserData);
      window.removeEventListener('episodio:avatar-updated', handleAvatarUpdate);
      if (authSub) authSub.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <nav className="fixed bottom-3.5 left-4 right-4 z-50 grid h-[52px] grid-cols-5 items-center justify-items-center bg-[#0A0A0E]/94 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.7)] md:hidden">
      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const isProfile = href === '/profile';
        const isChat = href === '/chat';

        return (
          <Link
            key={label}
            href={href}
            aria-label={label}
            title={label}
            className="flex h-full w-full items-center justify-center transition-transform active:scale-90"
          >
            {isProfile && userAvatar ? (
              <div className={`relative flex items-center justify-center transition-all duration-200 ${active ? 'scale-110' : 'opacity-65 hover:opacity-100'}`}>
                <img
                  src={userAvatar}
                  alt="Profil"
                  className={`h-6 w-6 rounded-full object-cover border transition-all ${
                    active ? 'border-white ring-2 ring-white/50' : 'border-white/20'
                  }`}
                />
              </div>
            ) : (
              <span className={`relative flex items-center justify-center transition-colors duration-200 ${active ? 'text-white font-bold' : 'text-white/40 hover:text-white/75'}`}>
                <span
                  className="material-symbols-outlined text-[23px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {icon}
                </span>
                {isChat && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#C91520] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
