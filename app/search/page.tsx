'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import type { Show } from '@/lib/tmdb';
import { createClient } from '@/lib/supabase/client';
import ListPreviewCard from '@/components/ListPreviewCard';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const GENRES = ['Drama', 'Komedi', 'Gerilim', 'Bilim Kurgu', 'Türk Dizisi', 'Kore Dizisi', 'Belgesel', 'Suç'];

function ShowCard({ show }: { show: Show }) {
  const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : null;
  const year = show.first_air_date?.slice(0, 4) ?? '';

  return (
    <Link href={`/show/${show.id}`} className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group cursor-pointer hover:border-white/20 hover:scale-[1.02] transition-all duration-300 block">
      {poster
        ? <img alt={show.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={poster} />
        : <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-full p-3">
        <div className="flex items-center gap-1 mb-1">
          <span className="material-symbols-outlined text-[12px] text-[#D4A017]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-[11px] font-semibold text-white">{show.vote_average.toFixed(1)}</span>
        </div>
        <h3 className="text-sm font-semibold text-white truncate">{show.name}</h3>
        {year && <p className="text-[11px] text-white/40">{year}</p>}
      </div>
    </Link>
  );
}

interface UserSearchProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface PopularList {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  posters: string[];
  itemCount: number;
  likeCount: number;
}

function ProfileCard({
  profile,
  isFollowing = false,
  canFollow = false,
  onToggleFollow,
}: {
  profile: UserSearchProfile;
  isFollowing?: boolean;
  canFollow?: boolean;
  onToggleFollow?: (profile: UserSearchProfile) => void;
}) {
  const displayName = profile.full_name || profile.username || 'Kullanıcı';
  const profilePath = `/u/${profile.username ?? profile.id}`;
  return (
    <div className="glass-card p-4 flex items-center gap-3 hover:border-white/20 transition-colors">
      <Link href={profilePath} className="w-11 h-11 rounded-full bg-[#1A1A1A] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
        {profile.avatar_url ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20">person</span>}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={profilePath}>
          <p className="text-sm text-white font-semibold truncate">{displayName}</p>
          <p className="text-xs text-white/35 truncate">@{profile.username ?? profile.id.slice(0, 8)}</p>
        </Link>
        {profile.bio && <p className="text-xs text-white/40 truncate mt-1">{profile.bio}</p>}
      </div>
      {canFollow && onToggleFollow && (
        <button
          type="button"
          onClick={() => onToggleFollow(profile)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            isFollowing ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#E50914] text-white hover:bg-red-700'
          }`}
        >
          {isFollowing ? 'Takiptesin' : 'Takip Et'}
        </button>
      )}
    </div>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Show[]>([]);
  const [profiles, setProfiles] = useState<UserSearchProfile[]>([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState<UserSearchProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [popularLists, setPopularLists] = useState<PopularList[]>([]);
  const [trending, setTrending] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/trending`)
      .then(r => r.json())
      .then(setTrending)
      .catch(() => {});

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setCurrentUserId(user?.id ?? null);

      const [suggestedRes, followsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, bio, avatar_url')
          .order('updated_at', { ascending: false })
          .limit(8),
        user
          ? supabase.from('follows').select('following_id').eq('follower_id', user.id)
          : Promise.resolve({ data: [] as { following_id: string }[] }),
      ]);

      const suggested = ((suggestedRes.data ?? []) as UserSearchProfile[]).filter((profile) => profile.id !== user?.id);
      setSuggestedProfiles(suggested);

      const map: Record<string, boolean> = {};
      (followsRes.data ?? []).forEach((row: { following_id: string }) => { map[row.following_id] = true; });
      setFollowingMap(map);

      const [listsRes, itemsRes, likesRes] = await Promise.all([
        supabase
          .from('lists')
          .select('id, name, description, visibility')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('list_items').select('list_id, poster_path'),
        supabase
          .from('list_likes')
          .select('list_id, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const listRows = (listsRes.data ?? []) as { id: string; name: string; description: string | null; visibility: 'public' | 'private' }[];
      const listIdSet = new Set(listRows.map((list) => list.id));

      const postersByListId: Record<string, string[]> = {};
      const itemCounts: Record<string, number> = {};
      (itemsRes.data ?? []).forEach((row: { list_id: string; poster_path: string | null }) => {
        if (!listIdSet.has(row.list_id)) return;
        itemCounts[row.list_id] = (itemCounts[row.list_id] ?? 0) + 1;
        if (!postersByListId[row.list_id]) postersByListId[row.list_id] = [];
        if (row.poster_path && postersByListId[row.list_id].length < 4) postersByListId[row.list_id].push(row.poster_path);
      });

      const likesByListId: Record<string, number> = {};
      (likesRes.data ?? []).forEach((row: { list_id: string }) => {
        if (!listIdSet.has(row.list_id)) return;
        likesByListId[row.list_id] = (likesByListId[row.list_id] ?? 0) + 1;
      });

      const popular = listRows
        .map((list) => ({
          id: list.id,
          name: list.name,
          description: list.description,
          visibility: list.visibility,
          posters: postersByListId[list.id] ?? [],
          itemCount: itemCounts[list.id] ?? 0,
          likeCount: likesByListId[list.id] ?? 0,
        }))
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 8);

      setPopularLists(popular);
    });
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setProfiles([]);
      return;
    }

    setLoading(true);
    try {
      const [showRes, profileRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(q)}`),
        fetch(`/api/profiles/search?q=${encodeURIComponent(q)}`),
      ]);

      const shows: Show[] = await showRes.json();
      const profileResults: UserSearchProfile[] = await profileRes.json();
      setResults(shows);
      setProfiles(profileResults);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFollow = useCallback(async (profile: UserSearchProfile) => {
    if (!currentUserId) {
      window.location.href = '/signin';
      return;
    }

    const supabase = createClient();
    const isFollowing = !!followingMap[profile.id];
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id);
      if (!error) {
        setFollowingMap((prev) => ({ ...prev, [profile.id]: false }));
      }
      return;
    }

    const { error } = await supabase.from('follows').insert({
      follower_id: currentUserId,
      following_id: profile.id,
    });
    if (!error) {
      setFollowingMap((prev) => ({ ...prev, [profile.id]: true }));
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUserId)
        .single();
      const actorUsername = actorProfile?.username ?? null;
      await supabase.from('notifications').insert({
        user_id: profile.id,
        actor_id: currentUserId,
        type: 'follow',
        message: actorUsername ? `@${actorUsername} seni takip etmeye başladı.` : 'Seni takip etmeye başladı.',
        link: actorUsername ? `/u/${actorUsername}` : `/u/${currentUserId}`,
      });
    }
  }, [currentUserId, followingMap]);

  const displayed = query.trim() ? results : trending;

  return (
    <div className="font-body-md min-h-screen antialiased flex flex-col pb-24 md:pb-0">
      <MobileHeader />
      <Sidebar />

      <main className="md:ml-[240px] w-full px-6 md:px-12 pt-8 pb-24 flex flex-col gap-10">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Keşfet</h1>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-3 px-1 pb-2 border-b-2 border-[#E50914]">
            <span className="material-symbols-outlined text-white/40 text-xl">search</span>
            <input
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
              placeholder="Dizi, film veya tür ara..."
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
            />
            {query && (
              <button onClick={() => handleSearch('')} className="text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Results / Trending */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
              {query.trim() ? `"${query}" sonuçları` : 'Trend'}
            </p>
            {loading && <span className="text-xs text-white/30 animate-pulse">Aranıyor...</span>}
          </div>

          {!loading && query.trim() && results.length === 0 && profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
              <p className="text-sm">Sonuç bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-8">
              {query.trim() && (
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">
                    Profiller
                  </p>
                  {profiles.length === 0 ? (
                    <p className="text-sm text-white/30">Eşleşen profil bulunamadı.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                      {profiles.map((profile) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          isFollowing={!!followingMap[profile.id]}
                          canFollow={profile.id !== currentUserId}
                          onToggleFollow={toggleFollow}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!query.trim() && (
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">
                    Sosyal Keşif
                  </p>
                  {suggestedProfiles.length === 0 ? (
                    <p className="text-sm text-white/30">Henüz keşfedilecek başka profil yok.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                      {suggestedProfiles.map((profile) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          isFollowing={!!followingMap[profile.id]}
                          canFollow={profile.id !== currentUserId}
                          onToggleFollow={toggleFollow}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!query.trim() && (
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">
                    Bu Hafta Popüler Listeler
                  </p>
                  {popularLists.length === 0 ? (
                    <p className="text-sm text-white/30">Bu hafta henüz popüler liste yok.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {popularLists.map((list) => (
                        <ListPreviewCard
                          key={list.id}
                          id={list.id}
                          name={list.name}
                          description={list.description}
                          visibility={list.visibility}
                          posters={list.posters}
                          itemCount={list.itemCount}
                          likeCount={list.likeCount}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">
                  {query.trim() ? 'Diziler' : 'Trend Diziler'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {displayed.map((show) => <ShowCard key={show.id} show={show} />)}
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
