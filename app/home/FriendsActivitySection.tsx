'use client';

import { useCallback, useEffect, useState } from 'react';
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
  watching: { label: 'izlemeye başladı', icon: 'play_arrow', color: '#E50914' },
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

export default function FriendsActivitySection() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAll, setShowAll] = useState(false);

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

    // Review'lardaki show_id'ler için watchlist'ten isim al
    const reviewShowIds = (reviewsRes.data ?? []).map((r: any) => r.show_id);
    const missingIds = reviewShowIds.filter((id: number) => !showNameMap[id]);
    if (missingIds.length > 0) {
      const { data: wlRows } = await supabase
        .from('watchlist')
        .select('show_id, show_name, poster_path')
        .in('show_id', missingIds)
        .limit(50);
      (wlRows ?? []).forEach((w: any) => {
        if (!showNameMap[w.show_id]) showNameMap[w.show_id] = { name: w.show_name, poster: w.poster_path };
      });
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

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline-md text-headline-md text-white">Arkadaş Aktivitesi</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : !isLoggedIn ? (
        <div className="glass-card p-5 text-sm text-white/40">
          Aktivite akışını görmek için <Link href="/signin" className="text-[#E50914]">giriş yap</Link>.
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-card p-5 text-sm text-white/40">
          Takip ettiğin kişilerde henüz aktivite yok. Birilerini takip etmeye başla!
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl">
          {(showAll ? activities : activities.slice(0, 5)).map(activity => {
            const name = activity.profile?.full_name || activity.profile?.username || 'Kullanıcı';
            const username = activity.profile?.username;
            const poster = activity.poster_path ? `${POSTER_BASE}${activity.poster_path}` : null;

            return (
              <div key={activity.id} className="flex gap-3 items-start">
                <Link href={username ? `/u/${username}` : '#'} className="w-9 h-9 rounded-full border border-white/10 shrink-0 overflow-hidden bg-[#141414] flex items-center justify-center">
                  {activity.profile?.avatar_url
                    ? <img alt={name} className="w-full h-full object-cover" src={activity.profile.avatar_url} />
                    : <span className="material-symbols-outlined text-white/30 text-lg">person</span>
                  }
                </Link>

                <div className="flex-1 min-w-0 bg-white/[0.03] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={username ? `/u/${username}` : '#'} className="text-sm font-semibold text-white hover:text-white/80 transition-colors">{name}</Link>
                      {activity.type === 'watch_status' && activity.status && (
                        <>
                          <span className="material-symbols-outlined text-sm" style={{ color: STATUS_LABEL[activity.status].color, fontVariationSettings: "'FILL' 1" }}>
                            {STATUS_LABEL[activity.status].icon}
                          </span>
                          <span className="text-xs text-white/50">{STATUS_LABEL[activity.status].label}</span>
                        </>
                      )}
                      {activity.type === 'review' && <span className="text-xs text-white/50">yorum yaptı</span>}
                    </div>
                    <span className="text-[11px] text-white/25 shrink-0">{timeAgo(activity.created_at)}</span>
                  </div>

                  <Link href={`/show/${activity.show_id}`} className="flex items-center gap-2 mt-1 group">
                    {poster && <img src={poster} alt={activity.show_name} className="w-8 h-12 rounded object-cover shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-[#D4A017] transition-colors truncate">{activity.show_name}</p>
                      {activity.type === 'review' && activity.rating && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className="material-symbols-outlined text-[11px]" style={{ color: s <= activity.rating! ? '#D4A017' : 'rgba(255,255,255,0.15)', fontVariationSettings: s <= activity.rating! ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>

                  {activity.type === 'review' && activity.content && (
                    <p className="text-sm text-white/55 mt-2 line-clamp-2 leading-relaxed">{activity.content}</p>
                  )}
                </div>
              </div>
            );
          })}

          {!showAll && activities.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="self-start text-sm text-white/70 hover:text-white transition-colors"
            >
              Daha fazlasını gör
              <div className="h-px w-full bg-[#E50914] mt-1" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
