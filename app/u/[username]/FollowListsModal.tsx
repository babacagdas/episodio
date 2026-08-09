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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setOpen(false)} />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-[440px] max-h-[85dvh] bg-[#0A0A0D] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(201,21,32,0.08)] flex flex-col overflow-hidden">
            
            {/* Header & Tabs */}
            <div className="flex items-center justify-between gap-3 pb-3.5 mb-2 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/[0.06] rounded-full">
                <button
                  type="button"
                  onClick={() => loadList('followers')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    tab === 'followers'
                      ? 'bg-gradient-to-r from-[#E50914] to-[#C91520] text-white shadow-[0_2px_12px_rgba(201,21,32,0.35)]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  Takipçiler ({followersCount})
                </button>
                <button
                  type="button"
                  onClick={() => loadList('following')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    tab === 'following'
                      ? 'bg-gradient-to-r from-[#E50914] to-[#C91520] text-white shadow-[0_2px_12px_rgba(201,21,32,0.35)]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  Takip Edilen ({followingCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* List Body */}
            <div className="overflow-y-auto max-h-[55vh] pr-1 space-y-1.5 flex-1 select-none">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30 gap-2">
                  <span className="w-6 h-6 border-2 border-white/20 border-t-[#C91520] rounded-full animate-spin" />
                  <span className="text-xs">Yükleniyor...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30 gap-2">
                  <span className="material-symbols-outlined text-4xl text-white/20">group_off</span>
                  <p className="text-xs font-medium">
                    {tab === 'followers' ? 'Henüz takipçi bulunmuyor.' : 'Henüz kimse takip edilmiyor.'}
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
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl border border-transparent hover:border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200 group"
                    >
                      <Link href={profilePath} onClick={() => setOpen(false)} className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#141418] border border-white/10 group-hover:border-white/25 overflow-hidden flex items-center justify-center shrink-0 transition-colors shadow-sm">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-white/20 text-lg">person</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-white truncate leading-snug group-hover:text-white/90">
                            {displayName}
                          </p>
                          <p className="text-[11px] sm:text-xs text-white/40 truncate font-medium mt-0.5">
                            @{item.username ?? item.id.slice(0, 8)}
                          </p>
                        </div>
                      </Link>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => toggleFollow(item.id)}
                          className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all shrink-0 active:scale-95 ${
                            isFollowing
                              ? 'bg-white/[0.06] hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10'
                              : 'bg-gradient-to-r from-[#E50914] to-[#C91520] hover:from-[#f40d1a] hover:to-[#da1824] text-white shadow-[0_2px_10px_rgba(201,21,32,0.3)]'
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
