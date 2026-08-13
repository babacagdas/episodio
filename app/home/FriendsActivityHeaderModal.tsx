'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  type: 'review' | 'watch_status';
  user_id: string;
  show_id: number;
  show_name: string;
  poster_path: string | null;
  created_at: string;
  rating?: number;
  content?: string;
  status?: 'watching' | 'completed' | 'dropped';
  profile: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} g`;
}

export default function FriendsActivityHeaderModal() {
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasFollowing, setHasFollowing] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Arka plan scroll engelleme
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Sayfa açıldığında arka planda aktiviteleri kontrol et (Yeni bildirim noktası için)
  useEffect(() => {
    const checkUnread = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
        const followingIds = (follows ?? []).map((f: any) => f.following_id);
        if (followingIds.length === 0) return;

        const { data: statusRes } = await supabase
          .from('watch_status')
          .select('updated_at')
          .in('user_id', followingIds)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (statusRes && statusRes.length > 0) {
          const lastActivityTime = new Date(statusRes[0].updated_at).getTime();
          const lastSeen = Number(localStorage.getItem('episodio_last_seen_activity') || '0');
          if (lastActivityTime > lastSeen) {
            setHasUnread(true);
          }
        }
      } catch {
        // ignore
      }
    };
    checkUnread();
  }, []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoggedIn(false);
      setActivities([]);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    const followingIds = (follows ?? []).map((f: any) => f.following_id);
    setHasFollowing(followingIds.length > 0);

    if (followingIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const { data: visibleProfiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, activity_visible')
      .in('id', followingIds);

    const visibleIds = (visibleProfiles ?? [])
      .filter((p: any) => p.activity_visible !== false)
      .map((p: any) => p.id);

    const profileMap: Record<string, any> = {};
    (visibleProfiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

    if (visibleIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const [reviewsRes, statusRes] = await Promise.all([
      supabase.from('reviews').select('id, user_id, show_id, rating, content, created_at').in('user_id', visibleIds).order('created_at', { ascending: false }).limit(10),
      supabase.from('watch_status').select('user_id, show_id, show_name, poster_path, status, updated_at').in('user_id', visibleIds).order('updated_at', { ascending: false }).limit(10),
    ]);

    const showNameMap: Record<number, { name: string; poster: string | null }> = {};
    (statusRes.data ?? []).forEach((s: any) => {
      if (s.show_name && !s.show_name.startsWith('Show #') && !s.show_name.startsWith('Dizi #')) {
        showNameMap[s.show_id] = { name: s.show_name, poster: s.poster_path };
      }
    });

    const allShowIds = Array.from(new Set([
      ...(reviewsRes.data ?? []).map((r: any) => r.show_id),
      ...(statusRes.data ?? []).map((s: any) => s.show_id),
    ]));

    const missingIds = allShowIds.filter((id: number) => !showNameMap[id]);
    
    if (missingIds.length > 0) {
      const [{ data: wsRows }, { data: wlRows }] = await Promise.all([
        supabase.from('watch_status').select('show_id, show_name, poster_path').in('show_id', missingIds).limit(50),
        supabase.from('watchlist').select('show_id, show_name, poster_path').in('show_id', missingIds).limit(50),
      ]);
      (wsRows ?? []).forEach((w: any) => {
        if (w.show_name && !w.show_name.startsWith('Show #') && !w.show_name.startsWith('Dizi #') && !showNameMap[w.show_id]) {
          showNameMap[w.show_id] = { name: w.show_name, poster: w.poster_path };
        }
      });
      (wlRows ?? []).forEach((w: any) => {
        if (w.show_name && !w.show_name.startsWith('Show #') && !w.show_name.startsWith('Dizi #') && !showNameMap[w.show_id]) {
          showNameMap[w.show_id] = { name: w.show_name, poster: w.poster_path };
        }
      });
    }

    // TMDB Fallback if still missing name or has Show # / Dizi #
    const stillMissingIds = allShowIds.filter((id: number) => !showNameMap[id] || showNameMap[id].name.startsWith('Dizi #') || showNameMap[id].name.startsWith('Show #'));
    if (stillMissingIds.length > 0) {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
      if (apiKey) {
        await Promise.all(
          stillMissingIds.map(async (sid) => {
            try {
              const res = await fetch(`https://api.themoviedb.org/3/tv/${sid}?api_key=${apiKey}&language=tr-TR`);
              if (res.ok) {
                const data = await res.json();
                if (data.name) {
                  showNameMap[sid] = { name: data.name, poster: data.poster_path };
                }
              }
            } catch {
              // ignore
            }
          })
        );
      }
    }

    const reviewItems: ActivityItem[] = (reviewsRes.data ?? []).map((r: any) => ({
      id: `review-${r.id}`,
      type: 'review',
      user_id: r.user_id,
      show_id: r.show_id,
      show_name: showNameMap[r.show_id]?.name ?? `Dizi #${r.show_id}`,
      poster_path: showNameMap[r.show_id]?.poster ?? null,
      created_at: r.created_at,
      rating: r.rating,
      content: r.content,
      profile: profileMap[r.user_id] ?? null,
    }));

    const statusItems: ActivityItem[] = (statusRes.data ?? []).map((s: any) => ({
      id: `status-${s.user_id}-${s.show_id}`,
      type: 'watch_status',
      user_id: s.user_id,
      show_id: s.show_id,
      show_name: s.show_name,
      poster_path: s.poster_path,
      created_at: s.updated_at,
      status: s.status,
      profile: profileMap[s.user_id] ?? null,
    }));

    const merged = [...reviewItems, ...statusItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);

    setActivities(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      loadActivities();
    }
  }, [open, loadActivities]);

  const handleOpenToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasUnread(false);
        try {
          localStorage.setItem('episodio_last_seen_activity', String(Date.now()));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const displayItems = activities.map((activity) => {
    const name = activity.profile?.full_name || activity.profile?.username || 'Kullanıcı';
    const username = activity.profile?.username;
    const profilePath = `/u/${username ?? activity.user_id}`;
    let textBefore = '';
    let highlightText = '';
    let link = '/home';

    if (activity.type === 'watch_status' && activity.status) {
      if (activity.status === 'watching') {
        textBefore = ' izlemeye başladı: ';
      } else if (activity.status === 'completed') {
        textBefore = ' bitirdi: ';
      } else {
        textBefore = ' bıraktı: ';
      }
      highlightText = activity.show_name;
      link = `/show/${activity.show_id}`;
    } else if (activity.type === 'review') {
      textBefore = ' yorum yaptı: ';
      highlightText = activity.show_name;
      link = `/show/${activity.show_id}`;
    }

    return {
      id: activity.id,
      name,
      avatar: activity.profile?.avatar_url || null,
      textBefore,
      highlightText,
      time: timeAgo(activity.created_at),
      link,
      profilePath,
    };
  });

  return (
    <div className="relative">
      {/* İçi Boş Kalp İkonu Butonu (Daha Kalın Çizgili ve Tombul Kalp) */}
      <button
        type="button"
        onClick={handleOpenToggle}
        className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-transparent text-white transition-colors hover:bg-white/5 active:scale-95"
        title="Arkadaş Aktiviteleri"
        aria-label="Arkadaş Aktiviteleri"
      >
        <span
          className="material-symbols-outlined text-[25px] text-white/90 group-hover:text-white transition-colors"
          style={{ fontVariationSettings: "'wght' 550, 'opsz' 24" }}
        >
          favorite_border
        </span>
        {hasUnread && !open && (
          <span className="absolute bottom-1 right-1.5 h-2 w-2 rounded-full bg-[#C91520] ring-2 ring-black" />
        )}
      </button>

      {/* Modal / Popover */}
      {open && (
        <>
          <div className="fixed inset-0 z-[119] bg-black/40 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="fixed top-[calc(3.75rem+env(safe-area-inset-top))] left-3 right-3 max-h-[calc(100dvh-7rem)] overflow-y-auto bg-[#0a0a0d] border border-white/10 rounded-2xl shadow-2xl p-3.5 z-[120] md:absolute md:top-auto md:left-auto md:right-0 md:mt-2 md:w-[350px] md:max-h-[440px] animate-[chatScaleIn_0.2s_ease-out]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-white/10">
              <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-white/80">favorite_border</span>
                Arkadaş Aktiviteleri
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="w-5 h-5 border-2 border-white/20 border-t-[#C91520] rounded-full animate-spin" />
              </div>
            ) : !isLoggedIn ? (
              <div className="px-2 py-6 text-xs text-white/40 text-center">
                Aktiviteleri görmek için <Link href="/signin" className="text-[#C91520] font-bold">giriş yap</Link>.
              </div>
            ) : !hasFollowing ? (
              <div className="px-2 py-6 text-xs text-white/45 text-center leading-relaxed">
                Aktivitelerini görmek için arkadaş takip et.
                <br />
                <Link href="/search" onClick={() => setOpen(false)} className="mt-2 inline-block text-xs font-bold text-[#C91520]">
                  Arkadaş Bul &rarr;
                </Link>
              </div>
            ) : displayItems.length === 0 ? (
              <div className="px-2 py-6 text-xs text-white/35 text-center">Takip ettiğin kişilerde henüz aktivite yok.</div>
            ) : (
              <div className="space-y-1">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-2 py-2.5 border-b border-white/[0.06] last:border-b-0 flex items-center justify-between gap-3 text-[12px] leading-tight hover:bg-white/[0.02] rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar */}
                      <Link
                        href={item.profilePath || '/home'}
                        onClick={() => setOpen(false)}
                        className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 flex items-center justify-center"
                      >
                        {item.avatar ? (
                          <img src={item.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-white/45 text-[11px]">person</span>
                        )}
                      </Link>

                      {/* Text */}
                      <p className="truncate text-white/55 font-medium text-[11.5px]">
                        <Link
                          href={item.profilePath || '/home'}
                          onClick={() => setOpen(false)}
                          className="text-white font-bold hover:text-[#C91520] transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.textBefore}
                        {item.highlightText && (
                          <Link
                            href={item.link}
                            onClick={() => setOpen(false)}
                            className="text-white font-bold hover:text-[#C91520] transition-colors"
                          >
                            {item.highlightText}
                          </Link>
                        )}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="text-white/30 text-[10px] font-bold shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
