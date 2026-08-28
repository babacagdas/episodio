'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useWatchlist } from '@/lib/useWatchlist';
import { useLists } from '@/lib/useLists';
import ListPreviewCard from '@/components/ListPreviewCard';
import ShowCard from '@/components/ShowCard';
import { CardSkeleton } from '@/components/Skeletons';
import FollowListsModal from '@/app/u/[username]/FollowListsModal';
import UserReviewsModal from '@/components/UserReviewsModal';
import type { User } from '@supabase/supabase-js';

const getTmdbPosterUrl = (path: string | null, size = 'w185') => {
  if (!path) return '/no-poster.png';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const ACTOR_PROFILE_BASE = 'https://image.tmdb.org/t/p/w342';
const WATCHED_PAGE_SIZE = 12;
const AVATAR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_OUTPUT_BYTES = 220 * 1024;
const AVATAR_SIZE = 320;
const AVATAR_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52];

interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  activity_visible: boolean;
  cover_show_id?: number | null;
}

interface TmdbTvSearchItem {
  id: number;
  name: string;
  poster_path: string | null;
}

async function compressAvatar(file: File): Promise<File> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
    const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas hazirlanamadi.');

    ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    let blob: Blob | null = null;
    for (const quality of AVATAR_QUALITY_STEPS) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', quality);
      });
      if (blob && blob.size <= AVATAR_MAX_OUTPUT_BYTES) break;
    }
    if (!blob) throw new Error('Fotoğraf sıkıştırılamadı.');

    return new File([blob], 'avatar.webp', { type: 'image/webp' });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

interface ProfileContentProps {
  initialUser?: User | null;
  initialProfile?: Profile & { favorite_actors_visible?: boolean };
  initialStats?: {
    followersCount: number;
    followingCount: number;
    watchedCount: number;
    reviewCount: number;
    watchlistCount: number;
  };
}

export default function ProfileContent({
  initialUser = null,
  initialProfile = undefined,
  initialStats = undefined,
}: ProfileContentProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'lists' || tabParam === 'watched' || tabParam === 'actors'
    ? tabParam
    : 'watchlist';
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile>({
    username: initialProfile?.username ?? '',
    full_name: initialProfile?.full_name ?? '',
    bio: initialProfile?.bio ?? '',
    avatar_url: initialProfile?.avatar_url ?? '',
    activity_visible: initialProfile?.activity_visible ?? true,
    cover_show_id: initialProfile?.cover_show_id ?? null,
  });
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched' | 'lists' | 'actors'>(initialTab);
  const [watchedSubStatus, setWatchedSubStatus] = useState<'completed' | 'watching' | 'dropped' | 'plan_to_watch'>('completed');
  const [listCount, setListCount] = useState(initialStats?.watchlistCount ?? 0);
  const { watchlist, loading } = useWatchlist(!!user && activeTab === 'watchlist');
  const { lists, sharedLists, likedLists, countsByListId, postersByListId, likesByListId, creatorsByListId, createList, loading: listsLoading, error: listsError } = useLists(!!user && activeTab === 'lists');
  const [listsSubTab, setListsSubTab] = useState<'mine' | 'shared'>('mine');
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState<Profile>({
    username: initialProfile?.username ?? '',
    full_name: initialProfile?.full_name ?? '',
    bio: initialProfile?.bio ?? '',
    avatar_url: initialProfile?.avatar_url ?? '',
    activity_visible: initialProfile?.activity_visible ?? true,
    cover_show_id: initialProfile?.cover_show_id ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [listModalOpen, setListModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listVisibility, setListVisibility] = useState<'public' | 'private'>('public');
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<{ id: string; username: string | null; full_name: string | null; avatar_url: string | null }[]>([]);
  const [invitedUser, setInvitedUser] = useState<{ id: string; username: string | null; full_name: string | null } | null>(null);
  const [listSaving, setListSaving] = useState(false);
  const [listMessage, setListMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [coverSearchQuery, setCoverSearchQuery] = useState('');
  const [coverSearchResults, setCoverSearchResults] = useState<TmdbTvSearchItem[]>([]);
  const [coverSearchLoading, setCoverSearchLoading] = useState(false);
  const [coverBackdropPath, setCoverBackdropPath] = useState<string | null>(null);
  const coverSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [followersCount, setFollowersCount] = useState(initialStats?.followersCount ?? 0);
  const [followingCount, setFollowingCount] = useState(initialStats?.followingCount ?? 0);
  const [watchedCount, setWatchedCount] = useState(initialStats?.watchedCount ?? 0);
  const [reviewCount, setReviewCount] = useState(initialStats?.reviewCount ?? 0);
  const [statsLoading, setStatsLoading] = useState(!initialProfile);
  const [favoriteActors, setFavoriteActors] = useState<{ actor_id: number; actor_name: string; actor_profile_path: string | null }[]>([]);
  const [favoriteActorsLoaded, setFavoriteActorsLoaded] = useState(false);
  const [watchedShows, setWatchedShows] = useState<{ show_id: number; show_name: string; poster_path: string | null }[]>([]);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [watchedLoadingMore, setWatchedLoadingMore] = useState(false);
  const [watchedLoaded, setWatchedLoaded] = useState(false);
  const [favoriteActorsVisible, setFavoriteActorsVisible] = useState(initialProfile?.favorite_actors_visible ?? true);
  const [favoriteActorsVisibilityColumnAvailable, setFavoriteActorsVisibilityColumnAvailable] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setStatsLoading(false);
        return;
      }
      if (cancelled) return;
      const userId = data.user.id;

      // ⚡ OPTIMIZED: Tüm profil verisi ve 5 istatistik sayaci TEK PARALEL PAKETTE (0ms gecikmeyle) cekilir
      setStatsLoading(true);
      const [
        profileRes,
        followersRes,
        followingRes,
        watchedRes,
        reviewRes,
        epDiscussionsRes,
        epRepliesRes,
        watchlistRes,
      ] = await Promise.all([
        supabase.from('profiles').select('username, full_name, bio, avatar_url, activity_visible, cover_show_id, favorite_actors_visible').eq('id', userId).maybeSingle(),
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('watch_status').select('show_id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('episode_discussions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('episode_comment_replies').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('watchlist').select('show_id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      if (cancelled) return;

      // ⚡ SYNC STATE: setUser ve setProfile ayni anda eszamanli guncellenir (ilk nick parlamasi engellendi)
      setUser(data.user);

      const p = profileRes.data as any;
      if (p) {
        setProfile({
          username: p.username ?? '',
          full_name: p.full_name ?? '',
          bio: p.bio ?? '',
          avatar_url: p.avatar_url ?? '',
          activity_visible: p.activity_visible ?? true,
          cover_show_id: p.cover_show_id ?? null,
        });
        const visible = p.favorite_actors_visible !== false;
        setFavoriteActorsVisible(visible);
        setFavoriteActorsVisibilityColumnAvailable(true);
      } else {
        const initial: Profile = {
          username: data.user.email?.split('@')[0] ?? '',
          full_name: data.user.user_metadata?.full_name ?? '',
          bio: '',
          avatar_url: data.user.user_metadata?.avatar_url ?? '',
          activity_visible: true,
          cover_show_id: null,
        };
        await supabase.from('profiles').insert({ id: userId, ...initial });
        if (cancelled) return;
        setProfile(initial);
      }

      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);
      setWatchedCount(watchedRes.count ?? 0);
      setReviewCount((reviewRes.count ?? 0) + (epDiscussionsRes.count ?? 0) + (epRepliesRes.count ?? 0));
      setListCount(watchlistRes.count ?? 0);
      setStatsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'lists' || tab === 'watchlist' || tab === 'watched' || tab === 'actors') {
      setActiveTab(tab);
    }
    const listsTab = searchParams.get('listsTab');
    if (listsTab === 'mine' || listsTab === 'shared') {
      setListsSubTab(listsTab);
    }
    if (searchParams.get('createList') === '1') {
      setActiveTab('lists');
      setListsSubTab('mine');
      setListModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'watchlist' && !loading) {
      setListCount(watchlist.length);
    }
  }, [activeTab, loading, watchlist.length]);

  useEffect(() => {
    if (!user || activeTab !== 'actors') return;
    const supabase = createClient();
    void (async () => {
      const { data: actorsData } = await supabase
        .from('actor_swipes')
        .select('actor_id, actor_name, actor_profile_path')
        .eq('user_id', user.id)
        .eq('action', 'like')
        .order('created_at', { ascending: false });
      setFavoriteActors(actorsData ?? []);
      setFavoriteActorsLoaded(true);
    })();
  }, [activeTab, user]);

  useEffect(() => {
    if (!user || activeTab !== 'watched') return;
    const supabase = createClient();
    setWatchedLoading(true);
    void (async () => {
      const { data: watchedData, count } = await supabase
        .from('watch_status')
        .select('show_id, show_name, poster_path', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', watchedSubStatus)
        .order('updated_at', { ascending: false })
        .range(0, WATCHED_PAGE_SIZE - 1);
      setWatchedShows(watchedData ?? []);
      if (count !== null) setWatchedCount(count);
      setWatchedLoaded(true);
      setWatchedLoading(false);
    })();
  }, [activeTab, user, watchedSubStatus]);

  const activeCoverShowId = editOpen ? (form.cover_show_id ?? null) : (profile.cover_show_id ?? null);

  useEffect(() => {
    let cancelled = false;
    if (activeCoverShowId == null) {
      setCoverBackdropPath(null);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/tmdb/show/${activeCoverShowId}`);
        const data = (await res.json()) as { backdrop_path?: string | null };
        if (cancelled) return;
        setCoverBackdropPath(data.backdrop_path ?? null);
      } catch {
        if (!cancelled) setCoverBackdropPath(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCoverShowId]);

  useEffect(() => {
    if (!coverModalOpen) return;
    const q = coverSearchQuery.trim();
    let cancelled = false;
    if (coverSearchTimer.current) clearTimeout(coverSearchTimer.current);
    if (!q) {
      setCoverSearchResults([]);
      setCoverSearchLoading(false);
      return;
    }
    setCoverSearchLoading(true);
    coverSearchTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          const data = (await res.json()) as unknown;
          if (cancelled) return;
          setCoverSearchResults(Array.isArray(data) ? (data as TmdbTvSearchItem[]) : []);
        } catch {
          if (!cancelled) setCoverSearchResults([]);
        } finally {
          if (!cancelled) setCoverSearchLoading(false);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      if (coverSearchTimer.current) clearTimeout(coverSearchTimer.current);
    };
  }, [coverSearchQuery, coverModalOpen]);

  const coverImageUrl = coverBackdropPath ? `${TMDB_BACKDROP}${coverBackdropPath}` : null;

  const displayName = profile.full_name || profile.username || 'Kullanıcı';
  const avatar = avatarPreview || profile.avatar_url || null;

  function openEdit() {
    setSettingsOpen(false);
    setForm(profile);
    setAvatarPreview(null);
    setAvatarFile(null);
    setSaveError('');
    setCoverModalOpen(false);
    setCoverSearchQuery('');
    setCoverSearchResults([]);
    setEditOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError('');

    if (!file.type.startsWith('image/')) {
      setSaveError('Lütfen geçerli bir görsel dosyası seç.');
      return;
    }

    if (file.size > AVATAR_MAX_SOURCE_BYTES) {
      setSaveError('Profil fotoğrafı en fazla 5 MB olabilir.');
      return;
    }

    try {
      const compressed = await compressAvatar(file);
      setAvatarFile(compressed);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch {
      setSaveError('Fotoğraf hazırlanamadı. Başka bir görsel dene.');
    } finally {
      e.target.value = '';
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    const supabase = createClient();

    const cleanUsername = form.username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setSaveError('Kullanıcı adı en az 3 karakter olmalı (sadece harf, rakam ve alt çizgi).');
      setSaving(false);
      return;
    }

    if (cleanUsername !== profile.username) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .neq('id', user.id)
        .maybeSingle();

      if (existingUser) {
        setSaveError(`❌ @${cleanUsername} kullanıcı adı başka biri tarafından kullanılıyor!`);
        setSaving(false);
        return;
      }
    }

    let avatar_url = form.avatar_url;

    if (avatarFile) {
      const path = `${user.id}/avatar.webp`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, {
        upsert: true,
        contentType: 'image/webp',
      });
      if (uploadError) {
        setSaveError('Fotoğraf yüklenemedi.');
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      avatar_url = urlData.publicUrl;
      await supabase.storage.from('avatars').remove([
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
        `${user.id}/avatar.png`,
      ]);
    }

    const updated: Profile = {
      username: cleanUsername,
      full_name: form.full_name,
      bio: form.bio,
      avatar_url,
      activity_visible: form.activity_visible,
      cover_show_id: form.cover_show_id ?? null,
    };
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...updated,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setSaveError(error.message);
    } else {
      setProfile((prev) => ({ ...prev, ...updated }));
      setEditOpen(false);
    }
    setSaving(false);
  }

  async function toggleWatchedVisibility() {
    if (!user) return;
    const nextVisible = !profile.activity_visible;
    const previousVisible = profile.activity_visible;
    setSaveError('');
    setProfile((prev) => ({ ...prev, activity_visible: nextVisible }));
    setForm((prev) => ({ ...prev, activity_visible: nextVisible }));

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        activity_visible: nextVisible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      setProfile((prev) => ({ ...prev, activity_visible: previousVisible }));
      setForm((prev) => ({ ...prev, activity_visible: previousVisible }));
      setSaveError(error.message);
    }
  }

  async function toggleFavoriteActorsVisibility() {
    if (!user) return;
    const nextVisible = !favoriteActorsVisible;
    const previousVisible = favoriteActorsVisible;
    setSaveError('');
    setFavoriteActorsVisible(nextVisible);
    window.localStorage.setItem(`episodio:favoriteActorsVisible:${user.id}`, String(nextVisible));

    if (!favoriteActorsVisibilityColumnAvailable) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        favorite_actors_visible: nextVisible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      setFavoriteActorsVisible(previousVisible);
      window.localStorage.setItem(`episodio:favoriteActorsVisible:${user.id}`, String(previousVisible));
      setSaveError(error.message);
    }
  }

  async function removeFavoriteActor(actorId: number) {
    if (!user) return;
    const previousActors = favoriteActors;
    setFavoriteActors((prev) => prev.filter((actor) => actor.actor_id !== actorId));

    const supabase = createClient();
    const { error } = await supabase
      .from('actor_swipes')
      .update({ action: 'pass' })
      .eq('user_id', user.id)
      .eq('actor_id', actorId);

    if (error) {
      setFavoriteActors(previousActors);
      setSaveError(error.message);
    }
  }

  async function loadMoreWatched() {
    if (!user || watchedLoadingMore) return;
    setWatchedLoadingMore(true);
    const from = watchedShows.length;
    const to = from + WATCHED_PAGE_SIZE - 1;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('watch_status')
      .select('show_id, show_name, poster_path')
      .eq('user_id', user.id)
      .eq('status', watchedSubStatus)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) {
      setSaveError(error.message);
    } else if (data?.length) {
      setWatchedShows((prev) => [...prev, ...data]);
    }
    setWatchedLoadingMore(false);
  }

  async function handleCreateList() {
    if (!listName.trim()) return;
    setListSaving(true);
    setListMessage('');
    const result = await createList({
      name: listName,
      description: listDescription,
      visibility: listVisibility,
      invitedUserId: invitedUser?.id ?? null,
    });

    if (!result.ok) {
      setListMessage(`Liste oluşturulamadı: ${result.message}`);
      setListSaving(false);
      return;
    }

    setListName('');
    setListDescription('');
    setListVisibility('public');
    setInviteQuery('');
    setInviteResults([]);
    setInvitedUser(null);
    setListSaving(false);
    setListModalOpen(false);
  }

  async function searchInvite(q: string) {
    setInviteQuery(q);
    if (!q.trim()) { setInviteResults([]); return; }
    try {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data)) setInviteResults(data);
    } catch {
      setInviteResults([]);
    }
  }

  return (
    <main className="md:ml-[200px] md:w-[calc(100%-200px)] w-full md:pt-4 overflow-x-hidden">
      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => {
              setCoverModalOpen(false);
              setEditOpen(false);
            }}
          />
          <div className="relative z-10 w-full max-w-[390px] md:max-w-[500px] bg-[#0D0D12] border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col gap-4 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(201,21,32,0.12)] overflow-hidden">
            {/* Red Ambient Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#C91520]/15 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">Profili Düzenle</h3>
              <button
                type="button"
                onClick={() => {
                  setCoverModalOpen(false);
                  setEditOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Avatar & Cover Actions */}
            <div className="relative z-10 flex flex-col items-center gap-3 pt-1">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/15 overflow-hidden bg-[#141418] flex items-center justify-center cursor-pointer relative group shadow-lg"
                onClick={() => fileRef.current?.click()}
              >
                {(avatarPreview || form.avatar_url)
                  ? <img src={avatarPreview || form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-white/20 text-3xl sm:text-4xl">person</span>
                }
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px] text-[#C91520]">photo_camera</span>
                  Fotoğraf
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCoverSearchQuery('');
                    setCoverSearchResults([]);
                    setCoverModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] sm:text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px] text-[#C91520]">image</span>
                  Kapak
                </button>
                {form.cover_show_id != null && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, cover_show_id: null }))}
                    className="px-2.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-red-500/20 border border-white/10 text-[11px] font-medium text-white/40 hover:text-red-400 transition-all flex items-center gap-1"
                    title="Kapağı kaldır"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="relative z-10 flex flex-col gap-3.5">
              <div>
                <label className="text-[10px] sm:text-[11px] text-white/40 uppercase tracking-widest mb-1 font-bold block">Ad Soyad</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base pointer-events-none">person</span>
                  <input
                    className="w-full bg-[#131318] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 sm:py-3 text-white text-xs sm:text-sm placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#181820] focus:outline-none transition-all"
                    placeholder="Ad Soyad"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] text-white/40 uppercase tracking-widest mb-1 font-bold block">Kullanıcı Adı</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold pointer-events-none">@</span>
                  <input
                    className="w-full bg-[#131318] border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 sm:py-3 text-white text-xs sm:text-sm placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#181820] focus:outline-none transition-all"
                    placeholder="kullaniciadi"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] text-white/40 uppercase tracking-widest mb-1 font-bold block">Biyografi</label>
                <textarea
                  className="w-full bg-[#131318] border border-white/10 rounded-2xl px-4 py-2.5 text-white text-xs sm:text-sm placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#181820] focus:outline-none transition-all resize-none"
                  placeholder="Kendinden bahset..."
                  rows={2}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3 bg-[#131318] border border-white/10 rounded-2xl px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-white font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-white/40 shrink-0">visibility</span>
                    <span className="truncate">İzlediklerim Görünürlüğü</span>
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-white/35 mt-0.5 leading-tight">Açıkken ziyaretçiler izlediklerini görebilir</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, activity_visible: !f.activity_visible }))}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                    form.activity_visible ? 'bg-[#C91520] justify-end' : 'bg-white/15 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow-md transition-all" />
                </button>
              </div>
            </div>

            {saveError && <p className="relative z-10 text-xs text-[#C91520] bg-[#C91520]/10 border border-[#C91520]/20 rounded-xl px-3 py-2">{saveError}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="relative z-10 w-full bg-gradient-to-r from-[#E50914] to-[#C91520] hover:from-[#f40d1a] hover:to-[#da1824] text-white font-bold text-xs sm:text-sm py-3 rounded-2xl transition-all shadow-[0_4px_20px_rgba(201,21,32,0.35)] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {editOpen && coverModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setCoverModalOpen(false)} />
          <div className="relative z-10 w-full max-w-[440px] md:max-w-[520px] bg-[#0D0D12] border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col gap-4 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(201,21,32,0.12)] max-h-[85vh] overflow-hidden">
            {/* Red Ambient Glow Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#C91520]/15 blur-3xl pointer-events-none rounded-full" />
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] shrink-0">
              <h3 className="text-sm font-bold text-white tracking-wide">Dizi ile kapak seç</h3>
              <button
                type="button"
                onClick={() => setCoverModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="relative shrink-0">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base pointer-events-none">search</span>
              <input
                className="w-full bg-[#121216] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#16161c] focus:outline-none transition-all"
                placeholder="Dizi adı ara (TMDB)…"
                value={coverSearchQuery}
                onChange={(e) => setCoverSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#070709]">
              {coverSearchLoading && (
                <p className="text-xs text-white/35 p-4 text-center">Aranıyor…</p>
              )}
              {!coverSearchLoading && coverSearchQuery.trim() && coverSearchResults.length === 0 && (
                <p className="text-xs text-white/35 p-4 text-center">Sonuç yok</p>
              )}
              {!coverSearchLoading && coverSearchResults.length > 0 && (
                <ul className="divide-y divide-white/5">
                  {coverSearchResults.map((show) => (
                    <li key={show.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, cover_show_id: show.id }));
                          setCoverModalOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="w-12 h-[72px] shrink-0 rounded-md overflow-hidden bg-white/10 border border-white/10">
                          {show.poster_path ? (
                            <img
                              src={`${POSTER_BASE}${show.poster_path}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <span className="material-symbols-outlined text-2xl">movie</span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-white font-medium leading-snug line-clamp-2">{show.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!coverSearchQuery.trim() && !coverSearchLoading && (
                <p className="text-xs text-white/30 p-4 text-center">Aramak için dizi adı yazın</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {listModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setListModalOpen(false)} />
          <div className="relative z-10 w-full max-w-[380px] bg-[#0A0A0D] border border-white/[0.08] rounded-3xl p-5 flex flex-col gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(201,21,32,0.08)]">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white tracking-wide">Liste Oluştur</h3>
              <button
                onClick={() => setListModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base pointer-events-none">format_list_bulleted</span>
              <input
                className="w-full bg-[#121216] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#16161c] focus:outline-none transition-all"
                placeholder="Liste adı (örn: En İyi Bilim Kurgu)"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>

            <textarea
              className="w-full bg-[#121216] border border-white/10 rounded-2xl px-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#16161c] focus:outline-none transition-all resize-none"
              placeholder="Kısa açıklama (opsiyonel)"
              rows={2}
              value={listDescription}
              onChange={(e) => setListDescription(e.target.value)}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setListVisibility('public')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  listVisibility === 'public'
                    ? 'bg-[#C91520] text-white shadow-[0_2px_10px_rgba(201,21,32,0.4)]'
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">public</span>
                Herkese Açık
              </button>
              <button
                type="button"
                onClick={() => setListVisibility('private')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  listVisibility === 'private'
                    ? 'bg-[#C91520] text-white shadow-[0_2px_10px_rgba(201,21,32,0.4)]'
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Gizli
              </button>
            </div>

            {/* Arkadaş davet et (opsiyonel) */}
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1 font-bold block flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-white/40">person_add</span>
                Arkadaş Davet Et (opsiyonel)
              </label>
              {invitedUser ? (
                <div className="flex items-center justify-between bg-[#121216] border border-white/10 rounded-2xl px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs text-white font-semibold truncate">
                      {invitedUser.full_name || invitedUser.username || 'Kullanıcı'}
                    </p>
                    <p className="text-[10px] text-white/35 truncate">@{invitedUser.username ?? invitedUser.id.slice(0, 8)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInvitedUser(null)}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base pointer-events-none">search</span>
                    <input
                      className="w-full bg-[#121216] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#16161c] focus:outline-none transition-all"
                      placeholder="Kullanıcı ara…"
                      value={inviteQuery}
                      onChange={(e) => searchInvite(e.target.value)}
                    />
                  </div>
                  {inviteResults.length > 0 && (
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-2xl border border-white/10 bg-[#070709]">
                      {inviteResults
                        .filter((p) => p.id !== user?.id)
                        .slice(0, 8)
                        .map((p) => {
                          const label = p.full_name || p.username || 'Kullanıcı';
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setInvitedUser({ id: p.id, username: p.username, full_name: p.full_name }); setInviteResults([]); setInviteQuery(''); }}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.05] border-b border-white/5 last:border-b-0 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-full bg-[#141418] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {p.avatar_url ? <img src={p.avatar_url} alt={label} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-xs">person</span>}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-white font-semibold truncate">{label}</p>
                                <p className="text-[10px] text-white/35 truncate">@{p.username ?? p.id.slice(0, 8)}</p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
              <p className="text-[10px] text-white/30 mt-1.5 leading-tight">Davet gönderilir; kabul edince liste ortak olur.</p>
            </div>

            {listMessage && <p className="text-xs text-[#C91520] bg-[#C91520]/10 border border-[#C91520]/20 rounded-xl px-3 py-2">{listMessage}</p>}

            <button
              onClick={handleCreateList}
              disabled={listSaving || !listName.trim()}
              className="w-full bg-gradient-to-r from-[#E50914] to-[#C91520] hover:from-[#f40d1a] hover:to-[#da1824] text-white font-bold text-xs py-3 rounded-2xl transition-all shadow-[0_4px_20px_rgba(201,21,32,0.35)] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {listSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Listeyi Oluştur'}
            </button>
          </div>
        </div>
      )}
      {/* Cover & Avatar */}
      <section className="relative">
        <div className="h-[180px] sm:h-[220px] md:h-[280px] lg:h-[340px] w-full relative overflow-hidden bg-[#0A0A0A]">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="Profil Kapağı" className="absolute inset-0 w-full h-full object-cover object-center sm:object-[center_35%]" />
          ) : null}
          <div
            className={`absolute inset-0 pointer-events-none ${
              coverImageUrl
                ? 'bg-gradient-to-t from-[#0A0A0A] via-black/20 to-transparent opacity-80'
                : 'bg-gradient-to-br from-[#C91520]/30 via-[#141414] to-[#0A0A0A]'
            }`}
            aria-hidden
          />
          {user && (
            <div className="absolute bottom-3 right-4 z-20 md:bottom-5 md:right-8">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Ayarlar"
                title="Ayarlar"
              >
                <span className="material-symbols-outlined text-[17px]">settings</span>
              </button>
            </div>
          )}
        </div>
        {settingsOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-5 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Profil ayarları"
            onClick={() => setSettingsOpen(false)}
          >
            <div
              className="relative w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-[#0D0D12] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(201,21,32,0.12)]"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Red Ambient Glow Background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#C91520]/15 blur-2xl pointer-events-none rounded-full" />
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-sm font-bold text-white">Ayarlar</h3>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label="Kapat"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  type="button"
                  onClick={openEdit}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="material-symbols-outlined text-[19px]">edit</span>
                  Profili Düzenle
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setSettingsOpen(false);
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/60 transition-colors hover:bg-[#C91520]/10 hover:text-[#F06A73]"
                >
                  <span className="material-symbols-outlined text-[19px]">logout</span>
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 relative -mt-14 sm:-mt-16 md:-mt-20 lg:-mt-24 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-2 sm:gap-3 md:gap-md">
            <div className="w-[5.5rem] h-[5.5rem] sm:w-24 sm:h-24 md:w-[8.5rem] md:h-[8.5rem] lg:w-36 lg:h-36 rounded-full border-[3px] sm:border-4 border-[#0A0A0A] overflow-hidden bg-[#141414] shrink-0 flex items-center justify-center">
              {avatar
                ? <img alt={displayName} className="w-full h-full object-cover" src={profile.avatar_url || avatar} />
                : <span className="material-symbols-outlined text-white/20 text-[2.5rem] sm:text-5xl md:text-[3.25rem]">person</span>
              }
            </div>
            <div className="text-center md:text-left flex-1 mb-2 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">{displayName}</h2>
              {profile.username && <p className="text-sm sm:text-base font-medium text-white/75 mt-1 drop-shadow-sm">@{profile.username}</p>}
              {profile.bio && <p className="text-sm text-white/50 mt-2 max-w-md">{profile.bio}</p>}
            </div>
            <div className="hidden">
              <button
                onClick={openEdit}
                className="px-4 py-2 sm:px-5 sm:py-2 bg-transparent border border-white/20 rounded-full text-xs sm:text-sm font-semibold text-white hover:bg-white/5 transition-colors"
              >
                Profili Düzenle
              </button>
              {user && (
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="w-10 h-10 rounded-full bg-transparent border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center"
                  aria-label="Çıkış yap"
                  title="Çıkış yap"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              )}
            </div>
            {user && (
              <div className="md:hidden w-full flex justify-center mt-0">
                <div className="flex items-center gap-8">
                  <FollowListsModal
                    profileId={user.id}
                    currentUserId={user.id}
                    followersCount={followersCount}
                    followingCount={followingCount}
                    order="following-first"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-2 md:mt-6">
        {(() => {
          const formattedWatchTime = (() => {
            if (statsLoading) return '...';
            if (!watchedCount) return '0 Sa';
            const totalMins = watchedCount * 12 * 45;
            const days = Math.floor(totalMins / (24 * 60));
            const hours = Math.floor((totalMins % (24 * 60)) / 60);
            if (days > 0) return `${days}G ${hours}S`;
            return `${hours || 1} Saat`;
          })();

          return (
            <>
              <div className="grid grid-cols-3 gap-2.5 md:hidden">
                {[
                  { val: statsLoading ? '...' : watchedCount, label: 'İzlendi', onClick: undefined },
                  { val: formattedWatchTime, label: 'İzleme Süresi', onClick: undefined },
                  { val: statsLoading ? '...' : reviewCount, label: 'Yorum', onClick: () => setReviewsModalOpen(true) },
                ].map(({ val, label, onClick }) => (
                  <div
                    key={label}
                    onClick={onClick}
                    className={`text-center ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
                  >
                    <span className={`block text-base font-extrabold ${label === 'İzleme Süresi' ? 'text-[#D4A017]' : 'text-white'}`}>{val}</span>
                    <span className="text-[9px] text-white/30 uppercase tracking-wide">{label}</span>
                  </div>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-8">
                {user && (
                  <FollowListsModal
                    profileId={user.id}
                    currentUserId={user.id}
                    followersCount={followersCount}
                    followingCount={followingCount}
                    order="following-first"
                  />
                )}
                <div className="w-px h-8 bg-white/10" />
                {[
                  { val: statsLoading ? '...' : watchedCount, label: 'İzlendi', onClick: undefined },
                  { val: statsLoading ? '...' : reviewCount, label: 'Yorum', onClick: () => setReviewsModalOpen(true) },
                  { val: formattedWatchTime, label: 'İzleme Süresi', onClick: undefined },
                ].map(({ val, label, onClick }) => (
                  <div
                    key={label}
                    onClick={onClick}
                    className={`text-center ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
                  >
                    <span className={`block text-2xl font-extrabold ${label === 'İzleme Süresi' ? 'text-[#D4A017]' : 'text-white'}`}>{val}</span>
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">{label}</span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </section>

      {/* Tabs */}
      <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-8 border-b border-white/10 overflow-x-hidden">
        <nav className="grid grid-cols-4 gap-0 md:flex md:gap-8">
          {(['watchlist', 'watched', 'lists', 'actors'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`min-w-0 px-0.5 pb-3 text-center text-[10.5px] font-semibold leading-tight whitespace-nowrap transition-colors min-[390px]:text-[11.5px] sm:text-sm md:px-0 ${
                activeTab === tab ? 'text-white border-b-2 border-[#C91520]' : 'text-white/30 hover:text-white'
              }`}
            >
              {tab === 'watchlist'
                ? 'İzleme Listesi'
                : tab === 'watched'
                  ? 'İzlediklerim'
                  : tab === 'lists'
                    ? 'Listelerim'
                    : (
                      <>
                        <span className="md:hidden">Oyuncularım</span>
                        <span className="hidden md:inline">Favori Oyuncularım</span>
                      </>
                    )}
            </button>
          ))}
        </nav>
      </section>

      {/* Content */}
      <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-6 mb-16">
        {activeTab === 'lists' ? (
          <>
            <div className="flex items-center gap-6 mb-5">
              <button
                type="button"
                onClick={() => setListsSubTab('mine')}
                className={`pb-2 text-sm font-semibold transition-colors ${listsSubTab === 'mine' ? 'text-white border-b-2 border-[#C91520]' : 'text-white/30 hover:text-white'}`}
              >
                Listelerim
              </button>
              <button
                type="button"
                onClick={() => setListsSubTab('shared')}
                className={`pb-2 text-sm font-semibold transition-colors ${listsSubTab === 'shared' ? 'text-white border-b-2 border-[#C91520]' : 'text-white/30 hover:text-white'}`}
              >
                Ortak Listeler
              </button>
            </div>
            <div className="flex justify-between items-center mb-5">
              <button
                type="button"
                onClick={() => setListModalOpen(true)}
                className="px-4 py-2 bg-[#C91520] text-white text-xs font-semibold rounded-full hover:bg-[#A8121B] transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Liste Oluştur
              </button>
            </div>

            {listsError && (
              <p className="text-xs text-[#C91520] mb-4">Listeler yüklenemedi: {listsError}</p>
            )}

            {listsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-white/[0.04] border border-white/10 animate-pulse" />)}
              </div>
            ) : listsSubTab === 'shared' ? (
              sharedLists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <span className="material-symbols-outlined text-5xl mb-3">group</span>
                  <p className="text-sm">Henüz ortak listen yok</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {sharedLists.map((list) => (
                    <ListPreviewCard
                      key={list.id}
                      id={list.id}
                      name={list.name}
                      description={list.description}
                      visibility={list.visibility}
                      posters={postersByListId[list.id] ?? []}
                      itemCount={countsByListId[list.id] ?? 0}
                      likeCount={likesByListId[list.id] ?? 0}
                      creatorName={creatorsByListId[list.id]?.name}
                      creatorAvatar={creatorsByListId[list.id]?.avatar}
                    />
                  ))}
                </div>
              )
            ) : lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <span className="material-symbols-outlined text-5xl mb-3">playlist_play</span>
                <p className="text-sm">Henüz bir listen yok</p>
                <button
                  type="button"
                  onClick={() => setListModalOpen(true)}
                  className="mt-4 text-xs text-[#C91520] hover:text-white transition-colors"
                >
                  İlk listeni oluştur →
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <section>
                  <div className="inline-flex flex-col gap-2 mb-4">
                    <p className="text-sm font-semibold text-white">Kendi Listelerin</p>
                    <div className="h-[2px] w-14 bg-[#C91520]" />
                  </div>
                  {lists.length === 0 ? (
                    <p className="text-sm text-white/30">Henüz kendi listen yok.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {lists.map((list) => (
                        <ListPreviewCard
                          key={list.id}
                          id={list.id}
                          name={list.name}
                          description={list.description}
                          visibility={list.visibility}
                          posters={postersByListId[list.id] ?? []}
                          itemCount={countsByListId[list.id] ?? 0}
                          likeCount={likesByListId[list.id] ?? 0}
                          creatorName={profile.full_name || (profile.username ? `@${profile.username}` : 'Kullanıcı')}
                          creatorAvatar={profile.avatar_url || null}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="inline-flex flex-col gap-2 mb-4">
                    <p className="text-sm font-semibold text-white">Beğendiğin Listeler</p>
                    <div className="h-[2px] w-14 bg-[#C91520]" />
                  </div>
                  {likedLists.length === 0 ? (
                    <p className="text-sm text-white/30">Beğendiğin bir liste yok.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {likedLists.map((list) => (
                        <ListPreviewCard
                          key={list.id}
                          id={list.id}
                          name={list.name}
                          description={list.description}
                          visibility={list.visibility}
                          posters={postersByListId[list.id] ?? []}
                          itemCount={countsByListId[list.id] ?? 0}
                          likeCount={likesByListId[list.id] ?? 0}
                          creatorName={creatorsByListId[list.id]?.name}
                          creatorAvatar={creatorsByListId[list.id]?.avatar}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        ) : activeTab === 'watched' ? (
          <>
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">İzlediklerim Görünürlüğü</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {profile.activity_visible
                    ? 'Profilini ziyaret edenler izlediğin dizileri görebilir.'
                    : 'İzlediğin dizileri şu an sadece sen görebilirsin.'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleWatchedVisibility}
                className={`inline-flex w-fit items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  profile.activity_visible
                    ? 'border-[#C91520]/50 bg-[#C91520]/10 text-white hover:bg-[#C91520]/20'
                    : 'border-white/10 bg-transparent text-white/55 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {profile.activity_visible ? 'visibility' : 'visibility_off'}
                </span>
                {profile.activity_visible ? 'Herkese Açık' : 'Gizli'}
              </button>
            </div>

            {/* Alt Durum Filtreleri (Bitirdiklerim, İzliyorum, Yarıda Bıraktıklarım, İzleyeceklerim) - Mobilde Yan Yana 4'lü Grid */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-5 w-full">
              {[
                { key: 'completed', label: 'Bitirdim', fullLabel: 'Bitirdiklerim', icon: 'check_circle', color: 'text-emerald-400' },
                { key: 'watching', label: 'İzliyorum', fullLabel: 'İzliyorum', icon: 'play_arrow', color: 'text-[#C91520]' },
                { key: 'dropped', label: 'Yarıda', fullLabel: 'Yarıda Bıraktıklarım', icon: 'pause_circle', color: 'text-amber-400' },
                { key: 'plan_to_watch', label: 'Planlanan', fullLabel: 'İzleyeceklerim', icon: 'bookmark', color: 'text-sky-400' },
              ].map((sub) => (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setWatchedSubStatus(sub.key as any)}
                  className={`w-full py-2 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 border text-center ${
                    watchedSubStatus === sub.key
                      ? 'bg-white/10 text-white border-white/20 shadow-md'
                      : 'bg-white/[0.03] text-white/40 border-white/5 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xs sm:text-sm ${sub.color}`}>{sub.icon}</span>
                  <span className="sm:hidden truncate">{sub.label}</span>
                  <span className="hidden sm:inline">{sub.fullLabel}</span>
                </button>
              ))}
            </div>

            {(watchedSubStatus === 'dropped' || watchedSubStatus === 'plan_to_watch') && (
              <div className="mb-4 flex items-center gap-2 text-xs text-white/50 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
                <span className="material-symbols-outlined text-sm text-amber-400">lock</span>
                <span>Gizli &bull; Bu sekmeyi ({watchedSubStatus === 'dropped' ? 'Yarıda Bıraktıklarım' : 'İzleyeceklerim'}) profilinizde sadece siz görebilirsiniz.</span>
              </div>
            )}

            {watchedLoading ? (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : watchedShows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <span className="material-symbols-outlined text-5xl mb-3">check_circle</span>
                <p className="text-sm">Henüz bitirdiğin dizi yok</p>
                <Link href="/search" className="mt-4 text-xs text-[#C91520] hover:text-white transition-colors">Dizi keşfet →</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                  {watchedShows.map((show) => {
                    const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : null;
                    return (
                      <Link key={show.show_id} href={`/show/${show.show_id}`} className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 hover:scale-[1.02] transition-all duration-300 block">
                        {poster
                          ? <img alt={show.show_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={poster} />
                          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full p-3">
                          <h4 className="text-xs font-semibold text-white truncate">{show.show_name}</h4>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {watchedShows.length < watchedCount && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMoreWatched}
                      disabled={watchedLoadingMore}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
                    >
                      {watchedLoadingMore ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : null}
                      Devamını Gör
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : activeTab === 'actors' ? (
          <>
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Favori Oyuncular Görünürlüğü</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {favoriteActorsVisible
                    ? 'Profilini ziyaret edenler favori oyuncularını görebilir.'
                    : 'Favori oyuncularını şu an sadece sen görebilirsin.'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleFavoriteActorsVisibility}
                className={`inline-flex w-fit items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  favoriteActorsVisible
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-white hover:bg-emerald-500/20'
                    : 'border-white/10 bg-transparent text-white/55 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {favoriteActorsVisible ? 'visibility' : 'visibility_off'}
                </span>
                {favoriteActorsVisible ? 'Herkese Açık' : 'Gizli'}
              </button>
            </div>

            {!favoriteActorsLoaded ? (
              <div className="flex justify-center py-12"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
            ) : favoriteActors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <span className="material-symbols-outlined text-5xl mb-3">favorite</span>
                <p className="text-sm">Henüz favori oyuncun yok</p>
                <Link href="/actor-match" className="mt-4 text-xs text-[#C91520] hover:text-white transition-colors">Oyuncu keşfet →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                {favoriteActors.map((actor) => {
                  const profileImage = actor.actor_profile_path ? `${ACTOR_PROFILE_BASE}${actor.actor_profile_path}` : null;
                  return (
                    <div key={actor.actor_id} className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/5 bg-[#141414] shadow-md transition-colors duration-200 hover:border-white/20">
                      <Link href={`/person/${actor.actor_id}`} className="block w-full h-full">
                        {profileImage
                          ? <img src={profileImage} alt={actor.actor_name} className="h-full w-full object-cover" loading="lazy" />
                          : <div className="flex h-full w-full items-center justify-center"><span className="material-symbols-outlined text-4xl text-white/20">person</span></div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />
                        <div className="absolute bottom-0 left-0 w-full p-2.5 sm:p-3">
                          <h4 className="truncate text-xs font-bold text-white sm:text-sm">{actor.actor_name}</h4>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFavoriteActor(actor.actor_id);
                        }}
                        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-emerald-300/90 transition-colors hover:bg-black/80 hover:text-[#F06A73]"
                        aria-label={`${actor.actor_name} favorilerden çıkar`}
                        title="Favorilerden çıkar"
                      >
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (!user || loading) ? (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <span className="material-symbols-outlined text-5xl mb-3">bookmark</span>
            <p className="text-sm">Henüz liste boş</p>
            <Link href="/search" className="mt-4 text-xs text-[#C91520] hover:text-white transition-colors">Dizi keşfet →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
            {watchlist.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </section>

      {user && (
        <UserReviewsModal
          userId={user.id}
          username={profile.username || displayName}
          avatarUrl={avatar || undefined}
          isOpen={reviewsModalOpen}
          onClose={() => setReviewsModalOpen(false)}
        />
      )}
    </main>
  );
}
