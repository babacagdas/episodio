'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import type { Show } from '@/lib/tmdb';
import { createClient } from '@/lib/supabase/client';
import ShowCard from '@/components/ShowCard';
import ListPreviewCard from '@/components/ListPreviewCard';
import DiscoverFilterPanel, { type AppliedFilters } from './DiscoverFilterPanel';
import RandomShowModal from './RandomShowModal';

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
  creatorName: string;
  creatorAvatar: string | null;
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
    <div className="group relative bg-[#0D0D11]/60 hover:bg-[#121217] border border-white/[0.06] hover:border-white/15 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all duration-300 backdrop-blur-md shadow-sm">
      <Link href={profilePath} className="w-10 h-10 rounded-full border border-white/10 group-hover:border-white/25 overflow-hidden bg-[#141418] flex items-center justify-center shrink-0 transition-colors shadow-sm">
        {profile.avatar_url ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <span className="material-symbols-outlined text-white/20 text-lg">person</span>}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={profilePath} className="block group-hover:opacity-90 transition-opacity">
          <p className="text-xs font-bold text-white truncate leading-snug">{displayName}</p>
          <p className="text-[11px] text-white/35 truncate font-medium">@{profile.username ?? profile.id.slice(0, 8)}</p>
        </Link>
        {profile.bio && <p className="text-[11px] text-white/45 truncate mt-0.5 font-normal leading-tight">{profile.bio}</p>}
      </div>
      {canFollow && onToggleFollow && (
        <button
          type="button"
          onClick={() => onToggleFollow(profile)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-[0.98] ${
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

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [randomModalOpen, setRandomModalOpen] = useState(false);
  const [filterApplying, setFilterApplying] = useState(false);
  const [activeFilters, setActiveFilters] = useState<AppliedFilters | null>(null);
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [topPresetCount, setTopPresetCount] = useState<number | null>(null);

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
          .select('id, user_id, name, description, visibility')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('list_items').select('list_id, poster_path'),
        supabase
          .from('list_likes')
          .select('list_id, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const listRows = (listsRes.data ?? []) as { id: string; user_id: string; name: string; description: string | null; visibility: 'public' | 'private' }[];
      const listIdSet = new Set(listRows.map((list) => list.id));
      const userIds = Array.from(new Set(listRows.map((list) => list.user_id)));

      const { data: creatorProfiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', userIds)
        : { data: [] };

      const creatorMap = new Map((creatorProfiles ?? []).map((p: any) => [p.id, p]));

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
        .map((list) => {
          const creator = creatorMap.get(list.user_id);
          const creatorName = creator?.full_name || (creator?.username ? `@${creator.username}` : 'Kullanıcı');
          return {
            id: list.id,
            name: list.name,
            description: list.description,
            visibility: list.visibility,
            posters: postersByListId[list.id] ?? [],
            itemCount: itemCounts[list.id] ?? 0,
            likeCount: likesByListId[list.id] ?? 0,
            creatorName,
            creatorAvatar: creator?.avatar_url ?? null,
          };
        })
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 8);

      setPopularLists(popular);
    });
  }, []);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setProfiles([]);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setLoading(true);
    searchTimerRef.current = setTimeout(async () => {
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
    }, 350);
  }, []);

  const applyDiscoverFilters = useCallback(async (f: AppliedFilters) => {
    setFilterApplying(true);
    setFilterError(null);
    try {
      const qs = new URLSearchParams();
      if (f.category) {
        if (f.category.kind === 'genre') qs.set('genreId', String(f.category.genreId));
        else qs.set('originCountry', f.category.originCountry);
      }
      if (f.year) qs.set('year', String(f.year));
      if (f.provider) qs.set('providerId', String(f.provider.provider_id));

      const res = await fetch(`/api/shows/filter?${qs.toString()}`);
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data && typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string'
          ? (data as { error: string }).error
          : 'Filtre uygulanamadı';
        setFilterError(msg);
        return;
      }
      if (!Array.isArray(data)) {
        setFilterError('Beklenmeyen yanıt');
        return;
      }
      setFilteredShows(data as Show[]);
      setActiveFilters(f);
      setFilterPanelOpen(false);
    } catch {
      setFilterError('Bağlantı hatası');
    } finally {
      setFilterApplying(false);
    }
  }, []);

  const handleApplyTopPreset = useCallback(async (count: 10 | 50) => {
    setFilterApplying(true);
    setFilterError(null);
    setTopPresetCount(count);
    try {
      const res = await fetch(`/api/shows/filter?minRating=8.0`);
      const data: unknown = await res.json().catch(() => null);
      if (Array.isArray(data) && data.length > 0) {
        const sorted = [...(data as Show[])].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, count);
        setFilteredShows(sorted);
        setActiveFilters({ category: null, year: null, provider: null });
      } else {
        setFilteredShows(trending.slice(0, count));
        setActiveFilters({ category: null, year: null, provider: null });
      }
    } catch {
      setFilteredShows(trending.slice(0, count));
      setActiveFilters({ category: null, year: null, provider: null });
    } finally {
      setFilterApplying(false);
    }
  }, [trending]);

  const clearDiscoverFilter = useCallback(() => {
    setActiveFilters(null);
    setTopPresetCount(null);
    setFilteredShows([]);
    setFilterError(null);
  }, []);

  const toggleFollow = useCallback(async (profile: UserSearchProfile) => {
    if (!currentUserId) {
      window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    const supabase = createClient();
    const isFollowing = !!followingMap[profile.id];
    const nextFollowing = !isFollowing;

    setFollowingMap((prev) => ({ ...prev, [profile.id]: nextFollowing }));

    if (nextFollowing) {
      const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id });
      if (error) setFollowingMap((prev) => ({ ...prev, [profile.id]: isFollowing }));
    } else {
      const { error } = await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', profile.id);
      if (error) setFollowingMap((prev) => ({ ...prev, [profile.id]: isFollowing }));
    }

    if (nextFollowing && profile.id !== currentUserId) {
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUserId)
        .maybeSingle();

      const actorUsername = actorProfile?.username ?? null;
      await supabase.from('user_notifications').insert({
        user_id: profile.id,
        actor_id: currentUserId,
        type: 'follow',
        message: actorUsername ? `@${actorUsername} seni takip etmeye başladı.` : 'Seni takip etmeye başladı.',
        link: actorUsername ? `/u/${actorUsername}` : `/u/${currentUserId}`,
      });
    }
  }, [currentUserId, followingMap]);

  const displayed = query.trim() ? results : ((activeFilters || topPresetCount) ? filteredShows : trending);
  const discoverShowsLabel = query.trim()
    ? 'Diziler'
    : topPresetCount
    ? `Tarihin En İyi ${topPresetCount} Dizisi`
    : activeFilters
    ? 'Filtreye uygun diziler'
    : 'Trend Diziler';

  return (
    <div className="font-body-md min-h-screen antialiased flex flex-col pb-24 md:pb-0 pt-[60px] md:pt-0 overflow-x-hidden">
      <MobileHeader />
      <Sidebar />

      <main className="md:ml-[200px] md:w-[calc(100%-200px)] px-6 md:px-12 pt-8 pb-24 flex flex-col gap-10 overflow-x-hidden">

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Keşfet</h1>
          <p className="text-sm text-white/40">Dizileri, profilleri ve topluluk listelerini tek yerden bul.</p>
        </div>

        {/* Search + Filtre */}
        <div className="mx-auto w-full max-w-4xl flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
          <div className="w-full min-w-0 max-w-2xl sm:flex-1">
            <div className="flex h-10 items-center gap-3 border-b border-[#C91520]/75 bg-transparent px-1 transition-colors focus-within:border-[#C91520]">
              <span className="material-symbols-outlined text-white/40 text-[18px] shrink-0">search</span>
              <input
                className="flex-1 min-w-0 bg-transparent text-[16px] text-white placeholder:text-white/30 focus:outline-none md:text-sm"
                placeholder="Dizi, film veya tür ara..."
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
              />
              {query && (
                <button type="button" onClick={() => handleSearch('')} className="text-white/30 hover:text-white transition-colors shrink-0">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 self-center shrink-0">
            <button
              type="button"
              onClick={() => setFilterPanelOpen(true)}
              className="h-9 inline-flex items-center justify-center gap-2 border-b border-[#C91520]/75 bg-transparent px-1 text-sm font-semibold text-white transition-colors hover:border-[#C91520] hover:text-white/80"
            >
              <span className="material-symbols-outlined text-[18px] text-[#D4A017]">tune</span>
              <span>Filtre</span>
            </button>

            <button
              type="button"
              onClick={() => setRandomModalOpen(true)}
              className="h-9 inline-flex items-center justify-center px-1 text-2xl transition-transform hover:scale-125 active:scale-95 cursor-pointer -rotate-12 select-none"
              title="Ne İzlesem? (Zar At)"
            >
              🎲
            </button>
          </div>
        </div>
        {filterError && (
          <p className="text-xs text-[#C91520] max-w-4xl -mt-4">{filterError}</p>
        )}

        {/* Results / Trending */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
              {query.trim() ? `"${query}" sonuçları` : activeFilters ? 'Filtreye göre' : 'Trend'}
            </p>
            <div className="flex items-center gap-3">
              {activeFilters && !query.trim() && (
                <button
                  type="button"
                  onClick={clearDiscoverFilter}
                  className="text-xs font-semibold text-white/45 hover:text-white transition-colors uppercase tracking-wide"
                >
                  Filtreyi sıfırla
                </button>
              )}
              {loading && <span className="text-xs text-white/30 animate-pulse">Aranıyor...</span>}
              {filterApplying && !query.trim() && (
                <span className="text-xs text-white/30 animate-pulse">Filtreleniyor…</span>
              )}
            </div>
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
                <>
                  {/* 🏆 Top 10 & 🍿 Top 50 Tarihin En İyi Dizileri Banners (Mobilde Kare & Yan Yana) */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-6">
                    {/* Card 1: Tarihin Top 10 Dizisi */}
                    <button
                      type="button"
                      onClick={() => handleApplyTopPreset(10)}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4A017]/30 bg-gradient-to-br from-[#1c170b] via-[#121214] to-[#0A0A0C] p-3.5 sm:p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[#D4A017]/60 hover:bg-[#1a1710] hover:shadow-[0_15px_40px_rgba(212,160,23,0.15)] active:scale-[0.98] aspect-[1/1] sm:aspect-auto"
                    >
                      {/* Golden Ambient Glow */}
                      <div className="pointer-events-none absolute -right-6 -top-6 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-[#D4A017]/15 blur-2xl transition-opacity group-hover:opacity-100" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                          <span className="rounded-full bg-[#D4A017]/15 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D4A017] border border-[#D4A017]/30">
                            🏆 TOP 10
                          </span>
                          <span className="material-symbols-outlined text-xs sm:text-base text-[#D4A017] transition-transform group-hover:translate-x-0.5">
                            arrow_forward
                          </span>
                        </div>
                        <h3 className="font-extrabold text-white text-xs sm:text-lg leading-tight">
                          Tarihin Top 10 Dizisi
                        </h3>
                        <p className="mt-0.5 sm:mt-1 text-[9.5px] sm:text-xs font-medium text-white/50 line-clamp-1 sm:line-clamp-2">
                          En yüksek puanlı efsane başyapıtlar
                        </p>
                      </div>

                      {/* Compact Fanned 3-Poster Mini Deck (Yelpaze Görünümü) */}
                      <div className="relative z-10 mt-2 sm:mt-4 flex h-14 sm:h-20 items-center justify-center">
                        <div className="absolute left-1/2 -translate-x-1/2 -rotate-[14deg] -translate-x-4 h-11 w-7 sm:h-16 sm:w-11 rounded-md border border-white/20 bg-[#141414] overflow-hidden shadow-md group-hover:-rotate-[18deg] group-hover:-translate-x-5 transition-transform">
                          <img src="https://image.tmdb.org/t/p/w185/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg" alt="Peaky Blinders" className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 rotate-[14deg] translate-x-4 h-11 w-7 sm:h-16 sm:w-11 rounded-md border border-white/20 bg-[#141414] overflow-hidden shadow-md group-hover:rotate-[18deg] group-hover:translate-x-5 transition-transform">
                          <img src="https://image.tmdb.org/t/p/w185/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg" alt="The Sopranos" className="h-full w-full object-cover" />
                        </div>
                        <div className="relative z-10 h-13 w-8 sm:h-18 sm:w-12 scale-105 rounded-md border border-[#D4A017]/80 bg-[#141414] overflow-hidden shadow-xl group-hover:scale-110 transition-transform">
                          <img src="https://image.tmdb.org/t/p/w185/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg" alt="Breaking Bad" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    </button>

                    {/* Card 2: Tarihin Top 50 Dizisi */}
                    <button
                      type="button"
                      onClick={() => handleApplyTopPreset(50)}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#C91520]/30 bg-gradient-to-br from-[#210a0e] via-[#121214] to-[#0A0A0C] p-3.5 sm:p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[#C91520]/60 hover:bg-[#220d11] hover:shadow-[0_15px_40px_rgba(201,21,32,0.15)] active:scale-[0.98] aspect-[1/1] sm:aspect-auto"
                    >
                      {/* Crimson Ambient Glow */}
                      <div className="pointer-events-none absolute -right-6 -top-6 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-[#C91520]/15 blur-2xl transition-opacity group-hover:opacity-100" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                          <span className="rounded-full bg-[#C91520]/15 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#C91520] border border-[#C91520]/30">
                            🍿 TOP 50
                          </span>
                          <span className="material-symbols-outlined text-xs sm:text-base text-[#C91520] transition-transform group-hover:translate-x-0.5">
                            arrow_forward
                          </span>
                        </div>
                        <h3 className="font-extrabold text-white text-xs sm:text-lg leading-tight">
                          Tarihin Top 50 Dizisi
                        </h3>
                        <p className="mt-0.5 sm:mt-1 text-[9.5px] sm:text-xs font-medium text-white/50 line-clamp-1 sm:line-clamp-2">
                          Tüm zamanların en iyi 50 başyapıtı
                        </p>
                      </div>

                      {/* Compact Fanned 3-Poster Mini Deck (Yelpaze Görünümü) */}
                      <div className="relative z-10 mt-2 sm:mt-4 flex h-14 sm:h-20 items-center justify-center">
                        <div className="absolute left-1/2 -translate-x-1/2 -rotate-[14deg] -translate-x-4 h-11 w-7 sm:h-16 sm:w-11 rounded-md border border-white/20 bg-[#141414] overflow-hidden shadow-md group-hover:-rotate-[18deg] group-hover:-translate-x-5 transition-transform">
                          <img src="https://image.tmdb.org/t/p/w185/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg" alt="Game of Thrones" className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 rotate-[14deg] translate-x-4 h-11 w-7 sm:h-16 sm:w-11 rounded-md border border-white/20 bg-[#141414] overflow-hidden shadow-md group-hover:rotate-[18deg] group-hover:translate-x-5 transition-transform">
                          <img src="https://image.tmdb.org/t/p/w185/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" alt="The Wire" className="h-full w-full object-cover" />
                        </div>
                        <div className="relative z-10 h-13 w-8 sm:h-18 sm:w-12 scale-105 rounded-md border border-[#C91520]/80 bg-[#141414] overflow-hidden shadow-xl group-hover:scale-110 transition-transform">
                          <img src="https://image.tmdb.org/t/p/w185/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg" alt="The Sopranos" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">
                      Bu Hafta Popüler Listeler
                    </p>
                    {popularLists.length === 0 ? (
                      <p className="text-sm text-white/30">Bu hafta henüz popüler liste yok.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {popularLists.slice(0, 8).map((list) => (
                          <ListPreviewCard
                            key={list.id}
                            id={list.id}
                            name={list.name}
                            description={list.description}
                            visibility={list.visibility}
                            posters={list.posters}
                            itemCount={list.itemCount}
                            likeCount={list.likeCount}
                            creatorName={list.creatorName}
                            creatorAvatar={list.creatorAvatar}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">
                  {discoverShowsLabel}
                </p>
                {activeFilters && !query.trim() && !filterApplying && displayed.length === 0 ? (
                  <p className="text-sm text-white/35 py-12 text-center border border-white/10 rounded-xl">
                    Bu filtreyle eşleşen dizi bulunamadı. Filtreyi veya yılı değiştirmeyi dene.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {displayed.map((show) => <ShowCard key={show.id} show={show} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </main>

      <DiscoverFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        onApply={applyDiscoverFilters}
        initial={activeFilters}
        busy={filterApplying}
      />

      <RandomShowModal
        open={randomModalOpen}
        onClose={() => setRandomModalOpen(false)}
        shows={displayed.length > 0 ? displayed : trending}
      />

      <BottomNav />
    </div>
  );
}
