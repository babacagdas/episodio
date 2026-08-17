'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendLocalNotification } from '@/lib/pushNotifications';
import FriendsActivityHeaderModal from '@/app/home/FriendsActivityHeaderModal';
import CreateListModal from '@/components/CreateListModal';

const navItems = [
  { href: '/home', icon: 'home', label: 'Ana Sayfa' },
  { href: '/swiper', icon: 'style', label: 'Seç' },
  { href: '/chat', icon: 'chat_bubble', label: 'Mesajlar' },
  { href: '/search', icon: 'search', label: 'Keşfet' },
  { href: '/profile', icon: 'person', label: 'Profil' },
];

export function MobileHeader({ rightElement }: { rightElement?: ReactNode }) {
  const [createListOpen, setCreateListOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 md:hidden">
        {/* Güvenli Çentik Alanı Altında Sabit 56px (h-14) Header Satırı */}
        <div className="flex h-14 w-full items-center justify-between px-4 mt-[env(safe-area-inset-top,0px)]">
          {/* Sol Tarafta Artı Butonu (Liste Oluştur) */}
          <div className="flex items-center justify-start w-16 shrink-0">
            <button
              type="button"
              onClick={() => setCreateListOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-transparent text-white/90 transition-colors hover:text-white hover:bg-white/5 active:scale-95"
              title="Yeni Liste Oluştur"
              aria-label="Yeni Liste Oluştur"
            >
              <span
                className="material-symbols-outlined text-[25px] text-white/90 hover:text-white transition-colors"
                style={{ fontVariationSettings: "'wght' 600, 'opsz' 24" }}
              >
                add
              </span>
            </button>
          </div>

          {/* Tam Ortalı Logo */}
          <Link href="/home" className="flex items-center justify-center">
            <img alt="Episodio Logo" className="h-7 w-auto object-contain" src="/logo.png" />
          </Link>

          {/* Sağ İkonlar (Kalp & Zil) */}
          <div className="flex items-center gap-1.5 justify-end w-16 shrink-0">
            <FriendsActivityHeaderModal />
            {rightElement ?? (
              <Link href="/notifications" aria-label="Bildirimler" className="flex h-9 w-9 items-center justify-center text-white/90 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                <span
                  className="material-symbols-outlined text-[25px]"
                  style={{ fontVariationSettings: "'wght' 600, 'opsz' 24" }}
                >
                  notifications
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Global Liste Oluştur Modalı */}
      <CreateListModal open={createListOpen} onClose={() => setCreateListOpen(false)} />
    </>
  );
}

export function MobileSocialFooter() {
  return (
    <div className="flex md:hidden items-center justify-center gap-4 py-6 pb-24 border-t border-white/5 my-6 select-none">
      <a
        href="https://www.instagram.com/episodiotr/"
        target="_blank"
        rel="noreferrer"
        aria-label="Episodio Instagram"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:text-white hover:bg-white/10"
        title="Instagram"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
        </svg>
      </a>

      <a
        href="https://www.tiktok.com/@episodiotr?_r=1&_t=ZS-98na1193h7U"
        target="_blank"
        rel="noreferrer"
        aria-label="Episodio TikTok"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:text-white hover:bg-white/10"
        title="TikTok"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.22V8.2a6.34 6.34 0 0 0-6.13 6.34 6.34 6.34 0 0 0 10.74 4.5 6.34 6.34 0 0 0 1.73-4.5V9.4a8.16 8.16 0 0 0 4.77 1.52V7.47a4.85 4.85 0 0 1-1.00-.78z"/>
        </svg>
      </a>

      <a
        href="https://x.com/episodiotr?s=11"
        target="_blank"
        rel="noreferrer"
        aria-label="Episodio X (Twitter)"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:text-white hover:bg-white/10"
        title="X (Twitter)"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
    </div>
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
    <>
      <MobileSocialFooter />
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
                <div className={`relative flex items-center justify-center transition-all duration-200 ${active ? 'scale-105 opacity-100' : 'opacity-40 hover:opacity-100'}`}>
                  <img
                    src={userAvatar}
                    alt="Profil"
                    className={`h-6 w-6 rounded-full object-cover border transition-all ${
                      active ? 'border-white' : 'border-white/20'
                    }`}
                  />
                </div>
              ) : (
                <span className={`relative flex items-center justify-center transition-all duration-200 ${active ? 'text-white scale-105' : 'text-white/35 hover:text-white/75'}`}>
                  <span
                    className="material-symbols-outlined text-[23px]"
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {icon}
                  </span>
                  {isChat && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#C91520] ring-2 ring-[#0A0A0E]" />
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
