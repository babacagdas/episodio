'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  user_id: string;
  show_id: number;
  rating: number;
  content: string;
  created_at: string;
  profile: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

function formatTimeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export default function FriendsActivitySection() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);

  const loadActivities = useCallback(async (followingOnly: boolean) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let followingIds: string[] = [];
    if (followingOnly && user) {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      followingIds = (follows ?? []).map((f: { following_id: string }) => f.following_id);
    }

    if (followingOnly && (!user || followingIds.length === 0)) {
      setActivities([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('reviews')
      .select('id, user_id, show_id, rating, content, created_at, profiles(username, full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(8);

    if (followingOnly) {
      query = query.in('user_id', followingIds);
    }

    const { data } = await query;
    const mapped: ActivityItem[] = (data ?? []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      show_id: item.show_id,
      rating: item.rating,
      content: item.content,
      created_at: item.created_at,
      profile: Array.isArray(item.profiles) ? (item.profiles[0] ?? null) : item.profiles ?? null,
    }));

    setActivities(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadActivities(showFollowingOnly);
  }, [showFollowingOnly, loadActivities]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline-md text-headline-md text-white">Arkadaş Aktivitesi</h2>
        <button
          type="button"
          onClick={() => setShowFollowingOnly((prev) => !prev)}
          className="px-1 pb-1.5 text-xs font-semibold transition-colors flex flex-col items-end gap-1 text-white/70 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: showFollowingOnly ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            {showFollowingOnly ? 'Takip akışı açık' : 'Takip akışı'}
          </span>
          <span className={`h-[2px] w-full transition-opacity ${showFollowingOnly ? 'bg-[#E50914] opacity-100' : 'bg-transparent opacity-0'}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-card p-5 text-sm text-white/40">
          {showFollowingOnly
            ? 'Takip ettiğin kişilerde henüz aktivite yok.'
            : 'Henüz aktivite yok. İlk yorumu sen bırak ve akışı başlat.'}
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          {activities.map((activity) => {
            const displayName =
              activity.profile?.full_name || activity.profile?.username || 'Kullanıcı';
            const avatar = activity.profile?.avatar_url;

            return (
              <div key={activity.id} className="glass-card p-4 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full border border-white/10 shrink-0 overflow-hidden bg-[#141414] flex items-center justify-center">
                  {avatar ? (
                    <img alt={displayName} className="w-full h-full object-cover" src={avatar} />
                  ) : (
                    <span className="material-symbols-outlined text-white/30">person</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-sm text-white truncate">{displayName}</span>
                    <span className="text-xs text-white/30">{formatTimeAgo(activity.created_at)}</span>
                  </div>
                  <p className="text-xs text-white/40">
                    yorum yaptı •{' '}
                    <Link href={`/show/${activity.show_id}`} className="text-white hover:text-[#D4A017] transition-colors">
                      diziye git
                    </Link>{' '}
                    • {activity.rating}/5
                  </p>
                  {activity.content && (
                    <p className="text-sm text-white/65 mt-2 line-clamp-2">{activity.content}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
