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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // ⚡ Letterboxd Tarzı Hızlı İzledim İşaretleme
  const [watchedShowIds, setWatchedShowIds] = useState<Set<number>>(new Set());

  // ⚡ Letterboxd Tarzı Hızlı Yıl ve Sıralama Filtreleri
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'rating' | 'newest'>('popular');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('episodio_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 6));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetch(`/api/trending`)
      .then(r => r.json())
      .then((data: Show[]) => {
        if (Array.isArray(data)) {
          // Trend dizileri tam 18 adet ile sınırla
          setTrending(data.slice(0, 18));
        }
      })
      .catch(() => {});

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setCurrentUserId(user?.id ?? null);

      const [suggestedRes, followsRes, watchStatusRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, bio, avatar_url')
          .order('updated_at', { ascending: false })
          .limit(8),
        user
          ? supabase.from('follows').select('following_id').eq('follower_id', user.id)
          : Promise.resolve({ data: [] as { following_id: string }[] }),
        user
          ? supabase.from('watch_status').select('show_id').eq('user_id', user.id).eq('status', 'completed')
          : Promise.resolve({ data: [] as { show_id: number }[] }),
      ]);

      const suggested = ((suggestedRes.data ?? []) as UserSearchProfile[]).filter((profile) => profile.id !== user?.id);
      setSuggestedProfiles(suggested);

      const map: Record<string, boolean> = {};
      (followsRes.data ?? []).forEach((row: { following_id: string }) => { map[row.following_id] = true; });
      setFollowingMap(map);

      if (watchStatusRes.data) {
        setWatchedShowIds(new Set(watchStatusRes.data.map((w) => Number(w.show_id))));
      }

      const [listsRes, itemsRes, likesRes] = await Promise.all([
        supabase
          .from('lists')
          .select('id, user_id, name, description, visibility')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('list_items').select('list_id, poster_path'),
        supabase.from('list_likes').select('list_id'),
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

  const addRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const lower = trimmed.toLowerCase();
      const filtered = prev.filter((item) => {
        const itemLower = item.toLowerCase();
        return itemLower !== lower && !lower.startsWith(itemLower) && !itemLower.startsWith(lower);
      });
      const updated = [trimmed, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('episodio_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('episodio_recent_searches');
    } catch {
      // ignore
    }
  }, []);

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
        if (q.trim().length >= 2) {
          addRecentSearch(q.trim());
        }
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [addRecentSearch]);

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

  const clearDiscoverFilter = useCallback(() => {
    setActiveFilters(null);
    setFilteredShows([]);
    setTopPresetCount(null);
    setFilterError(null);
  }, []);

  const toggleFollow = useCallback(
    async (targetProfile: UserSearchProfile) => {
      if (!currentUserId) return;
      const targetId = targetProfile.id;
      const currentlyFollowing = !!followingMap[targetId];
      setFollowingMap((prev) => ({ ...prev, [targetId]: !currentlyFollowing }));

      const supabase = createClient();
      if (currentlyFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetId);
      } else {
        await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId });
      }
    },
    [currentUserId, followingMap]
  );

  // ⚡ Letterboxd Tarzı Tek Tıkla Göz İkonuyla "İzledim" İşaretleme
  const handleToggleWatch = useCallback(
    async (show: Show, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentUserId) return;

      const showIdNum = Number(show.id);
      const isCurrentlyWatched = watchedShowIds.has(showIdNum);

      setWatchedShowIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyWatched) {
          next.delete(showIdNum);
        } else {
          next.add(showIdNum);
        }
        return next;
      });

      const supabase = createClient();
      if (isCurrentlyWatched) {
        await supabase.from('watch_status').delete().eq('user_id', currentUserId).eq('show_id', showIdNum);
      } else {
        await supabase.from('watch_status').upsert({
          user_id: currentUserId,
          show_id: showIdNum,
          show_name: show.name,
          poster_path: show.poster_path,
          status: 'completed',
          updated_at: new Date().toISOString(),
        });
      }
    },
    [currentUserId, watchedShowIds]
  );

  // Liste için ana gösterilecek diziler
  let rawDisplayed = query.trim()
    ? results
    : activeFilters
    ? filteredShows
    : topPresetCount
    ? filteredShows
    : trending.slice(0, 18);

  // ⚡ Letterboxd Tarzı Yıl ve Sıralama Filtrelerini Uygulama
  let displayed = [...rawDisplayed];

  if (selectedDecade !== 'all') {
    displayed = displayed.filter((show) => {
      const year = Number(show.first_air_date?.slice(0, 4) || '0');
      if (selectedDecade === '2020s') return year >= 2020;
      if (selectedDecade === '2010s') return year >= 2010 && year <= 2019;
      if (selectedDecade === '2000s') return year >= 2000 && year <= 2009;
      if (selectedDecade === '90s') return year >= 1990 && year <= 1999;
      if (selectedDecade === 'top') return Number(show.vote_average) >= 8.0;
      return true;
    });
  }

  if (selectedSort === 'rating') {
    displayed.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  } else if (selectedSort === 'newest') {
    displayed.sort(
      (a, b) => new Date(b.first_air_date || 0).getTime() - new Date(a.first_air_date || 0).getTime()
    );
  }

  const discoverShowsLabel = query.trim()
    ? `Dizi Sonuçları (${displayed.length})`
    : activeFilters
    ? 'Filtrelenmiş Diziler'
    : 'Keşfet & Trend Diziler';

  return (
    <div className="font-body-md text-body-md antialiased min-h-screen pb-24 md:pb-12 bg-[#07070A] text-white">
      <Sidebar />
      <MobileHeader />

      <main className="md:ml-[200px] md:w-[calc(100%-200px)] w-full px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Keşfet & Arama</h1>
          <p className="text-xs sm:text-sm text-white/40">Dizileri, profilleri ve topluluk listelerini tek yerden bul.</p>
        </div>

        {/* Search + Filtre Barı */}
        <div className="mx-auto w-full max-w-4xl flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
          <div className="w-full min-w-0 max-w-2xl sm:flex-1">
            <div className="flex h-10 items-center gap-3 border-b border-[#C91520]/75 bg-transparent px-1 transition-colors focus-within:border-[#C91520]">
              <span className="material-symbols-outlined text-white/40 text-[18px] shrink-0">search</span>
              <input
                className="flex-1 min-w-0 bg-transparent text-[16px] text-white placeholder:text-white/30 focus:outline-none md:text-sm"
                placeholder="Dizi, film veya tür ara..."
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
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
              className="h-9 inline-flex items-center justify-center gap-1.5 border-b border-[#C91520]/75 bg-transparent px-1 text-xs font-bold text-white transition-colors hover:border-[#C91520] hover:text-white/80 cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-[17px] text-[#D4A017]">tune</span>
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

        {/* ⚡ Letterboxd Tarzı Hızlı Dönem ve Sıralama Filtre Çubuğu */}
        {!query.trim() && (
          <div className="mx-auto w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-y border-white/[0.06]">
            {/* Dönem / Yıl Çipleri */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'Tümü' },
                { id: '2020s', label: '2020\'ler' },
                { id: '2010s', label: '2010\'lar' },
                { id: '2000s', label: '2000\'ler' },
                { id: '90s', label: '90\'lar' },
                { id: 'top', label: 'Efsaneler (8.0+)' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedDecade(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDecade === chip.id
                      ? 'bg-[#C91520] text-white shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Sıralama Açılır Menüsü */}
            <div className="flex items-center gap-2 text-xs text-white/60 shrink-0 ml-auto">
              <span className="text-white/40 text-[11px] font-medium hidden sm:inline">Sıralama:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as 'popular' | 'rating' | 'newest')}
                className="bg-[#121217] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white/90 focus:outline-none focus:border-[#C91520] cursor-pointer"
              >
                <option value="popular">Trend / Popüler</option>
                <option value="rating">En Yüksek Puan</option>
                <option value="newest">En Yeni Çıkanlar</option>
              </select>
            </div>
          </div>
        )}

        {/* Son Aramalarım (Recent Searches Chips) */}
        {!query.trim() && recentSearches.length > 0 && (
          <div className="hidden md:flex mx-auto w-full max-w-7xl items-center gap-2 flex-wrap -mt-2">
            <span className="text-[11px] font-bold text-white/35 uppercase tracking-wider shrink-0">Son Aramalar:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSearch(term)}
                className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[13px] text-white/40">history</span>
                <span>{term}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-[11px] font-medium text-white/30 hover:text-red-400 transition-colors ml-1"
            >
              Temizle
            </button>
          </div>
        )}

        {filterError && (
          <p className="text-xs text-[#C91520] max-w-7xl -mt-2">{filterError}</p>
        )}

        {/* Results / Trending Grid */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
              {query.trim() ? `"${query}" sonuçları` : activeFilters ? 'Filtreye göre' : 'Trend Diziler (İlk 18)'}
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
              )}

              {/* ⚡ Ana Dizi Izgarası: Mobilde 3 Kart, Bilgisayar/Tablette 6 Kart */}
              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">
                  {discoverShowsLabel}
                </p>
                {activeFilters && !query.trim() && !filterApplying && displayed.length === 0 ? (
                  <p className="text-sm text-white/35 py-12 text-center border border-white/10 rounded-xl">
                    Bu filtreyle eşleşen dizi bulunamadı. Filtreyi veya yılı değiştirmeyi dene.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                    {displayed.map((show) => (
                      <ShowCard
                        key={show.id}
                        show={show}
                        isWatched={watchedShowIds.has(Number(show.id))}
                        onToggleWatch={currentUserId ? handleToggleWatch : undefined}
                      />
                    ))}
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
