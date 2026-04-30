'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ProfileListItem {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface Props {
  profileId: string;
  currentUserId: string | null;
  followersCount: number;
  followingCount: number;
}

export default function FollowListsModal({
  profileId,
  currentUserId,
  followersCount,
  followingCount,
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
    const supabase = createClient();

    const relationField = nextTab === 'followers' ? 'follower_id' : 'following_id';
    const filterField = nextTab === 'followers' ? 'following_id' : 'follower_id';

    const { data: relations } = await supabase
      .from('follows')
      .select(`${relationField}`)
      .eq(filterField, profileId)
      .limit(100);

    const ids = (relations ?? [])
      .map((row: Record<string, string>) => row[relationField])
      .filter(Boolean);

    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', ids);

    const ordered: ProfileListItem[] = ids
      .map((id) => (profiles ?? []).find((profile) => profile.id === id))
      .filter(Boolean) as ProfileListItem[];

    setItems(ordered);
    setLoading(false);
  }

  async function openWithTab(initialTab: 'followers' | 'following') {
    setOpen(true);
    await Promise.all([loadFollowingMap(), loadList(initialTab)]);
  }

  async function toggleFollow(targetUserId: string) {
    if (!currentUserId) {
      window.location.href = '/signin';
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
        link: actorUsername ? `/u/${actorUsername}` : '/profile',
      });
    }
  }

  return (
    <>
      <button onClick={() => openWithTab('followers')} className="text-center" type="button">
        <span className="block text-2xl font-bold text-white">{followersCount}</span>
        <span className="text-[11px] text-white/30 uppercase tracking-wider hover:text-white transition-colors">Takipçi</span>
      </button>
      <button onClick={() => openWithTab('following')} className="text-center" type="button">
        <span className="block text-2xl font-bold text-white">{followingCount}</span>
        <span className="text-[11px] text-white/30 uppercase tracking-wider hover:text-white transition-colors">Takip</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl p-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadList('followers')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${tab === 'followers' ? 'bg-[#E50914] text-white' : 'bg-white/5 text-white/70'}`}
                >
                  Takipçi
                </button>
                <button
                  type="button"
                  onClick={() => loadList('following')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${tab === 'following' ? 'bg-[#E50914] text-white' : 'bg-white/5 text-white/70'}`}
                >
                  Takip
                </button>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-2">
              {loading ? (
                <div className="flex justify-center py-10">
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-sm text-white/35 py-6 text-center">Liste boş.</div>
              ) : (
                items.map((item) => {
                  const displayName = item.full_name || item.username || 'Kullanıcı';
                  const isSelf = item.id === currentUserId;
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03]">
                      <Link href={`/u/${item.username}`} className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-white/20">person</span>
                        )}
                      </Link>
                      <Link href={`/u/${item.username}`} className="min-w-0 flex-1">
                        <p className="text-sm text-white font-semibold truncate">{displayName}</p>
                        <p className="text-xs text-white/35 truncate">@{item.username}</p>
                      </Link>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => toggleFollow(item.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            followingMap[item.id] ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#E50914] text-white hover:bg-red-700'
                          }`}
                        >
                          {followingMap[item.id] ? 'Takiptesin' : 'Takip Et'}
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
