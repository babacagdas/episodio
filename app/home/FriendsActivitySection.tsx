'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const STATUS_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  watching: { label: 'izlemeye başladı', icon: 'play_arrow', color: '#C91520' },
  completed: { label: 'bitirdi', icon: 'check_circle', color: '#22c55e' },
  dropped: { label: 'bıraktı', icon: 'cancel', color: 'rgba(255,255,255,0.4)' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

export default function FriendsActivitySection({ compact = false }: { compact?: boolean } = {}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasFollowing, setHasFollowing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

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

    // Sadece takip edilenleri getir
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    const followingIds = (follows ?? []).map((f: any) => f.following_id);
    setHasFollowing(followingIds.length > 0);

    if (followingIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    // activity_visible=true olanları filtrele
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
    (statusRes.data ?? []).forEach((s: any) => { showNameMap[s.show_id] = { name: s.show_name, poster: s.poster_path }; });

    // Review'lardaki show_id'ler için isim al
    const reviewShowIds = (reviewsRes.data ?? []).map((r: any) => r.show_id);
    const missingIds = reviewShowIds.filter((id: number) => !showNameMap[id]);
    if (missingIds.length > 0) {
      const [{ data: wsRows }, { data: wlRows }] = await Promise.all([
        supabase.from('watch_status').select('show_id, show_name, poster_path').in('show_id', missingIds).limit(50),
        supabase.from('watchlist').select('show_id, show_name, poster_path').in('show_id', missingIds).limit(50),
      ]);
      (wsRows ?? []).forEach((w: any) => {
        if (!showNameMap[w.show_id]) showNameMap[w.show_id] = { name: w.show_name, poster: w.poster_path };
      });
      (wlRows ?? []).forEach((w: any) => {
        if (!showNameMap[w.show_id]) showNameMap[w.show_id] = { name: w.show_name, poster: w.poster_path };
      });

      const stillMissingIds = missingIds.filter((id: number) => !showNameMap[id] || showNameMap[id].name.startsWith('Dizi #'));
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
      .slice(0, 12);

    setActivities(merged);
    setLoading(false);
  }, []);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const visibleActivities = showAll ? activities : activities.slice(0, 5);

  const handleShowMore = () => {
    setShowAll(true);
  };

  const displayItems = visibleActivities.map(activity => {
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
          profilePath
        };
      });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Aktiviteler</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : !isLoggedIn ? (
        <div className="rounded-xl border border-white/[0.05] bg-transparent p-4 text-[12.5px] text-white/40">
          Aktivite akışını görmek için <Link href="/signin" className="text-[#C91520] font-bold">giriş yap</Link>.
        </div>
      ) : !hasFollowing ? (
        <div className="rounded-xl border border-white/[0.05] bg-transparent p-4">
          <p className="text-[12.5px] font-semibold leading-relaxed text-white/45">
            Aktivitelerini görmek için arkadaşlarını takip et.
          </p>
          <Link
            href="/search"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#C91520] transition-colors hover:text-white"
          >
            Arkadaş bul
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </Link>
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-white/[0.05] bg-transparent p-4 text-[12.5px] font-semibold leading-relaxed text-white/45">
          Takip ettiğin kişilerde henüz aktivite yok.
        </div>
      ) : (
        <div ref={listRef} className="flex flex-col gap-3.5 select-none">
          {displayItems.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-[12.5px] leading-tight">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar */}
                <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                  {item.avatar ? (
                    <img src={item.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-white/45 text-[10px]">person</span>
                  )}
                </div>

                {/* Text */}
                <p className="truncate text-white/45 font-semibold text-[11.5px] pt-0.5">
                  <Link href={item.profilePath || '/home'} className="text-white font-bold hover:text-[#C91520] transition-colors">
                    {item.name}
                  </Link>
                  {item.textBefore}
                  {item.highlightText && (
                    <Link href={item.link} className="text-white font-bold hover:text-[#C91520] transition-colors">
                      {item.highlightText}
                    </Link>
                  )}
                </p>
              </div>

              {/* Time */}
              <span className="text-white/25 text-[10.5px] font-bold shrink-0">{item.time}</span>
            </div>
          ))}

          {activities.length > 5 && !showAll && (
            <button
              type="button"
              onClick={handleShowMore}
              className="self-start pt-1 text-[11px] font-bold text-[#C91520] transition-colors hover:text-white uppercase tracking-wider"
            >
              Tüm aktiviteleri gör &gt;
            </button>
          )}
        </div>
      )}
    </>
  );
}
