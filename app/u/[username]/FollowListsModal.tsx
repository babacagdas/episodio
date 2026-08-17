'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ProfileListItem {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface Props {
  profileId: string;
  currentUserId: string | null;
  followersCount: number;
  followingCount: number;
  order?: 'followers-first' | 'following-first';
}

export default function FollowListsModal({
  profileId,
  currentUserId,
  followersCount,
  followingCount,
  order = 'followers-first',
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'followers' | 'following'>('followers');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ProfileListItem[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  async function loadFollowingMap() {
    if (!currentUserId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);
    const map: Record<string, boolean> = {};
    (data ?? []).forEach((row: { following_id: string }) => {
      map[row.following_id] = true;
    });
    setFollowingMap(map);
  }

  async function loadList(nextTab: 'followers' | 'following') {
    setLoading(true);
    setTab(nextTab);
    try {
      const response = await fetch(`/api/follows/list?profileId=${encodeURIComponent(profileId)}&tab=${nextTab}`);
      const data: ProfileListItem[] = await response.json();
      setItems(data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function openWithTab(initialTab: 'followers' | 'following') {
    setOpen(true);
    await Promise.all([loadFollowingMap(), loadList(initialTab)]);
  }

  async function toggleFollow(targetUserId: string) {
    if (!currentUserId) {
      window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    const supabase = createClient();
    const isFollowing = !!followingMap[targetUserId];
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);
      if (!error) {
        setFollowingMap((prev) => ({ ...prev, [targetUserId]: false }));
      }
      return;
    }

    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: currentUserId, following_id: targetUserId });
    if (!error) {
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: true }));
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUserId)
        .single();
      const actorUsername = actorProfile?.username ?? null;
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: currentUserId,
        type: 'follow',
        message: actorUsername ? `@${actorUsername} seni takip etmeye başladı.` : 'Seni takip etmeye başladı.',
        link: actorUsername ? `/u/${actorUsername}` : `/u/${currentUserId}`,
      });
    }
  }

  return (
    <>
      {order === 'following-first' ? (
        <>
          <button onClick={() => openWithTab('following')} className="text-center group cursor-pointer" type="button">
            <span className="block text-xl sm:text-2xl font-bold text-white group-hover:text-[#C91520] transition-colors">{followingCount}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/80 transition-colors">Takip</span>
          </button>
          <button onClick={() => openWithTab('followers')} className="text-center group cursor-pointer" type="button">
            <span className="block text-xl sm:text-2xl font-bold text-white group-hover:text-[#C91520] transition-colors">{followersCount}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/80 transition-colors">Takipçi</span>
          </button>
        </>
      ) : (
        <>
          <button onClick={() => openWithTab('followers')} className="text-center group cursor-pointer" type="button">
            <span className="block text-xl sm:text-2xl font-bold text-white group-hover:text-[#C91520] transition-colors">{followersCount}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/80 transition-colors">Takipçi</span>
          </button>
          <button onClick={() => openWithTab('following')} className="text-center group cursor-pointer" type="button">
            <span className="block text-xl sm:text-2xl font-bold text-white group-hover:text-[#C91520] transition-colors">{followingCount}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-white/40 uppercase tracking-wider group-hover:text-white/80 transition-colors">Takip</span>
          </button>
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setOpen(false)} />

          {/* Modal Container: Glassmorphic premium dark modal */}
          <div className="relative z-10 w-full max-w-[420px] h-[480px] bg-[#0D0D0E]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
            
            {/* Header Tabs & Dedicated Close Button */}
            <div className="relative flex items-center justify-between border-b border-white/10 shrink-0 bg-transparent px-3.5 py-2">
              <div className="flex items-center gap-1 min-w-0 pr-8">
                <button
                  type="button"
                  onClick={() => loadList('followers')}
                  className={`px-3 py-2 text-center text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
                    tab === 'followers'
                      ? 'border-white text-white font-bold'
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  {followersCount} Takipçi
                </button>
                <button
                  type="button"
                  onClick={() => loadList('following')}
                  className={`px-3 py-2 text-center text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
                    tab === 'following'
                      ? 'border-white text-white font-bold'
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  {followingCount} Takip Edilen
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0"
                aria-label="Kapat"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* List Body: Tek sıra (Single Column) top to bottom */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-xs">Yükleniyor...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                  <span className="material-symbols-outlined text-4xl text-white/20">person_off</span>
                  <p className="text-xs font-medium">
                    {tab === 'followers' ? 'Henüz takipçi yok.' : 'Henüz takip edilen kimse yok.'}
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const displayName = item.full_name || item.username || 'Kullanıcı';
                  const profilePath = `/u/${item.username ?? item.id}`;
                  const isSelf = item.id === currentUserId;
                  const isFollowing = !!followingMap[item.id];

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors"
                    >
                      <Link href={profilePath} onClick={() => setOpen(false)} className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-full bg-[#262626] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-white/30 text-xl">person</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight hover:underline">
                            {item.username ?? item.id.slice(0, 8)}
                          </p>
                          <p className="text-[11px] text-white/50 truncate mt-0.5 font-normal">
                            {displayName}
                          </p>
                        </div>
                      </Link>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => toggleFollow(item.id)}
                          className={`ml-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                            isFollowing
                              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                              : 'bg-[#C91520] hover:bg-[#A8121B] text-white'
                          }`}
                        >
                          {isFollowing ? 'Takiptesin' : 'Takip Et'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
