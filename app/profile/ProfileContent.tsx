'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useWatchlist } from '@/lib/useWatchlist';
import { useLists } from '@/lib/useLists';
import ListPreviewCard from '@/components/ListPreviewCard';
import { CardSkeleton } from '@/components/Skeletons';
import FollowListsModal from '@/app/u/[username]/FollowListsModal';
import type { User } from '@supabase/supabase-js';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
interface Profile {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  activity_visible: boolean;
}

export default function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({ username: '', full_name: '', bio: '', avatar_url: '', activity_visible: true });
  const { watchlist, loading } = useWatchlist();
  const { lists, likedLists, countsByListId, postersByListId, likesByListId, createList, loading: listsLoading, error: listsError } = useLists();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched' | 'lists' | 'notes'>('watchlist');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Profile>({ username: '', full_name: '', bio: '', avatar_url: '', activity_visible: true });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listVisibility, setListVisibility] = useState<'public' | 'private'>('public');
  const [listSaving, setListSaving] = useState(false);
  const [listMessage, setListMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [watchedCount, setWatchedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [notes, setNotes] = useState<{ show_id: number; show_name: string; poster_path: string | null; content: string; is_public: boolean }[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [watchedShows, setWatchedShows] = useState<{ show_id: number; show_name: string; poster_path: string | null }[]>([]);
  const [watchedLoading, setWatchedLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (p) {
        setProfile({ ...p, activity_visible: p.activity_visible ?? true });
      } else {
        const initial: Profile = {
          username: data.user.email?.split('@')[0] ?? '',
          full_name: data.user.user_metadata?.full_name ?? '',
          bio: '',
          avatar_url: data.user.user_metadata?.avatar_url ?? '',
          activity_visible: true,
        };
        await supabase.from('profiles').insert({ id: data.user.id, ...initial });
        setProfile(initial);
      }

      const [followersRes, followingRes, watchedRes, reviewRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', data.user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', data.user.id),
        supabase.from('watch_status').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id).eq('status', 'completed'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id),
      ]);
      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);
      setWatchedCount(watchedRes.count ?? 0);
      setReviewCount(reviewRes.count ?? 0);

      // Notları yükle
      const { data: notesData } = await supabase
        .from('show_notes')
        .select('show_id, show_name, poster_path, content, is_public')
        .eq('user_id', data.user.id)
        .order('updated_at', { ascending: false });
      setNotes(notesData ?? []);
      setNotesLoaded(true);

      // İzlediklerim
      const { data: watchedData } = await supabase
        .from('watch_status')
        .select('show_id, show_name, poster_path')
        .eq('user_id', data.user.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });
      setWatchedShows(watchedData ?? []);
    });
  }, []);

  const displayName = profile.full_name || profile.username || user?.email?.split('@')[0] || 'Kullanıcı';
  const avatar = avatarPreview || profile.avatar_url || null;

  function openEdit() {
    setForm(profile);
    setAvatarPreview(null);
    setAvatarFile(null);
    setSaveError('');
    setEditOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    const supabase = createClient();
    let avatar_url = form.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
      if (uploadError) {
        setSaveError('Fotoğraf yüklenemedi.');
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      avatar_url = urlData.publicUrl;
    }

    const updated = { ...form, avatar_url };
    const { error } = await supabase.from('profiles').upsert({ id: user.id, ...updated, updated_at: new Date().toISOString() });
    if (error) {
      setSaveError(error.message);
    } else {
      setProfile(updated);
      setEditOpen(false);
    }
    setSaving(false);
  }

  async function handleCreateList() {
    if (!listName.trim()) return;
    setListSaving(true);
    setListMessage('');
    const result = await createList({
      name: listName,
      description: listDescription,
      visibility: listVisibility,
    });

    if (!result.ok) {
      setListMessage(`Liste oluşturulamadı: ${result.message}`);
      setListSaving(false);
      return;
    }

    setListName('');
    setListDescription('');
    setListVisibility('public');
    setListSaving(false);
    setListModalOpen(false);
  }

  return (
    <main className="md:ml-[240px] md:w-[calc(100%-240px)] w-full md:pt-4 overflow-x-hidden">
      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Profili Düzenle</h3>
              <button onClick={() => setEditOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-[#1A1A1A] flex items-center justify-center cursor-pointer relative group"
                onClick={() => fileRef.current?.click()}
              >
                {(avatarPreview || form.avatar_url)
                  ? <img src={avatarPreview || form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-white/20 text-4xl">person</span>
                }
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                </div>
              </div>
              <button onClick={() => fileRef.current?.click()} className="text-xs text-[#E50914] hover:text-white transition-colors">Fotoğraf Değiştir</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Ad Soyad</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors"
                  placeholder="Ad Soyad"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Kullanıcı Adı</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pl-8 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors"
                    placeholder="kullaniciadi"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Biyografi</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors resize-none"
                  placeholder="Kendinden bahset..."
                  rows={3}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm text-white font-medium">Aktivite Akışı</p>
                  <p className="text-xs text-white/35 mt-0.5">Takipçilerin ne yaptığını görebilsin</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, activity_visible: !f.activity_visible }))}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    form.activity_visible ? 'bg-[#E50914]' : 'bg-white/20'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.activity_visible ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {saveError && <p className="text-xs text-[#E50914] bg-[#E50914]/10 border border-[#E50914]/20 rounded-lg px-3 py-2">{saveError}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#E50914] text-white font-semibold text-sm py-3 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {listModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setListModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Liste Oluştur</h3>
              <button onClick={() => setListModalOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors"
              placeholder="Liste adı (örn: En İyi Bilim Kurgu)"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
            />

            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors resize-none"
              placeholder="Kısa açıklama (opsiyonel)"
              rows={3}
              value={listDescription}
              onChange={(e) => setListDescription(e.target.value)}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setListVisibility('public')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${listVisibility === 'public' ? 'bg-[#E50914] text-white' : 'bg-white/5 text-white/60'}`}
              >
                Herkese Açık
              </button>
              <button
                type="button"
                onClick={() => setListVisibility('private')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${listVisibility === 'private' ? 'bg-[#E50914] text-white' : 'bg-white/5 text-white/60'}`}
              >
                Gizli
              </button>
            </div>

            {listMessage && <p className="text-xs text-[#E50914]">{listMessage}</p>}

            <button
              onClick={handleCreateList}
              disabled={listSaving || !listName.trim()}
              className="w-full bg-[#E50914] text-white font-semibold text-sm py-3 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {listSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Listeyi Oluştur'}
            </button>
          </div>
        </div>
      )}
      {/* Cover & Avatar */}
      <section className="relative">
        <div className="h-[150px] md:h-[280px] w-full bg-gradient-to-br from-[#E50914]/30 via-[#141414] to-[#0A0A0A]" />
        <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 relative -mt-12 md:-mt-20 z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-md">
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-[#0A0A0A] overflow-hidden bg-[#141414] shrink-0 flex items-center justify-center">
              {avatar
                ? <img alt={displayName} className="w-full h-full object-cover" src={profile.avatar_url || avatar} />
                : <span className="material-symbols-outlined text-white/20 text-5xl">person</span>
              }
            </div>
            <div className="text-center md:text-left flex-1 mb-2">
              <h2 className="text-2xl md:text-3xl font-bold text-white">{displayName}</h2>
              {profile.username && <p className="text-sm text-white/30 mt-0.5">@{profile.username}</p>}
              {profile.bio && <p className="text-sm text-white/50 mt-2 max-w-md">{profile.bio}</p>}
              {!profile.bio && user?.email && <p className="text-sm text-white/20 mt-1">{user.email}</p>}
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-3 mt-4 md:mt-0 pb-2">
              <button onClick={openEdit} className="px-5 py-2 bg-transparent border border-white/20 rounded-full text-sm font-semibold text-white hover:bg-white/5 transition-colors">Profili Düzenle</button>
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
              <div className="md:hidden w-full flex justify-center mt-2">
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
      <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-4 md:mt-6">
        <div className="grid grid-cols-3 gap-2.5 md:hidden">
          {[
            { val: watchlist.length, label: 'Listede' },
            { val: watchedCount, label: 'İzlendi' },
            { val: reviewCount, label: 'Yorum' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <span className="block text-base font-bold text-white">{val}</span>
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
            { val: watchedCount, label: 'İzlendi' },
            { val: watchlist.length, label: 'Listede' },
            { val: reviewCount, label: 'Yorum' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <span className="block text-2xl font-bold text-white">{val}</span>
              <span className="text-[11px] text-white/30 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-8 border-b border-white/10 overflow-x-hidden">
        <nav className="flex flex-wrap gap-x-6 gap-y-3 md:gap-8">
          {(['watchlist', 'watched', 'lists', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab ? 'text-white border-b-2 border-[#E50914]' : 'text-white/30 hover:text-white'
              }`}
            >
              {tab === 'watchlist' ? 'İzleme Listesi' : tab === 'watched' ? 'İzlediklerim' : tab === 'lists' ? 'Listelerim' : 'Notlarım'}
            </button>
          ))}
        </nav>
      </section>

      {/* Content */}
      <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-6 mb-16">
        {activeTab === 'lists' ? (
          <>
            <div className="flex justify-between items-center mb-5">
              <button
                type="button"
                onClick={() => setListModalOpen(true)}
                className="px-4 py-2 bg-[#E50914] text-white text-xs font-semibold rounded-full hover:bg-red-700 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Liste Oluştur
              </button>
            </div>

            {listsError && (
              <p className="text-xs text-[#E50914] mb-4">Listeler yüklenemedi: {listsError}</p>
            )}

            {listsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-white/[0.04] border border-white/10 animate-pulse" />)}
              </div>
            ) : lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <span className="material-symbols-outlined text-5xl mb-3">playlist_play</span>
                <p className="text-sm">Henüz bir listen yok</p>
                <button
                  type="button"
                  onClick={() => setListModalOpen(true)}
                  className="mt-4 text-xs text-[#E50914] hover:text-white transition-colors"
                >
                  İlk listeni oluştur →
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <section>
                  <div className="inline-flex flex-col gap-2 mb-4">
                    <p className="text-sm font-semibold text-white">Kendi Listelerin</p>
                    <div className="h-[2px] w-14 bg-[#E50914]" />
                  </div>
                  {lists.length === 0 ? (
                    <p className="text-sm text-white/30">Henüz kendi listen yok.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="inline-flex flex-col gap-2 mb-4">
                    <p className="text-sm font-semibold text-white">Beğendiğin Listeler</p>
                    <div className="h-[2px] w-14 bg-[#E50914]" />
                  </div>
                  {likedLists.length === 0 ? (
                    <p className="text-sm text-white/30">Beğendiğin bir liste yok.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        ) : activeTab === 'watched' ? (
          watchedLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : watchedShows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <span className="material-symbols-outlined text-5xl mb-3">check_circle</span>
              <p className="text-sm">Henüz bitirdiğin dizi yok</p>
              <Link href="/search" className="mt-4 text-xs text-[#E50914] hover:text-white transition-colors">Dizi keşfet →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
          )
        ) : activeTab === 'notes' ? (
          !notesLoaded ? (
            <div className="flex justify-center py-12"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <span className="material-symbols-outlined text-5xl mb-3">note</span>
              <p className="text-sm">Henüz not eklemedin</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {notes.map((note) => (
                <Link key={note.show_id} href={`/show/${note.show_id}`} className="flex gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-4 transition-colors block">
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#1A1A1A] shrink-0">
                    {note.poster_path
                      ? <img src={`https://image.tmdb.org/t/p/w92${note.poster_path}`} alt={note.show_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-sm">movie</span></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white truncate">{note.show_name}</p>
                      <span className="text-[10px] text-white/25 shrink-0">{note.is_public ? '🌐 Herkese açık' : '🔒 Gizli'}</span>
                    </div>
                    <p className="text-sm text-white/55 line-clamp-3 leading-relaxed">{note.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <span className="material-symbols-outlined text-5xl mb-3">bookmark</span>
            <p className="text-sm">Henüz liste boş</p>
            <Link href="/search" className="mt-4 text-xs text-[#E50914] hover:text-white transition-colors">Dizi keşfet →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {watchlist.map((show) => {
              const poster = show.poster_path ? `${POSTER_BASE}${show.poster_path}` : null;
              return (
                <Link key={show.id} href={`/show/${show.id}`} className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 hover:scale-[1.02] transition-all duration-300 block">
                  {poster
                    ? <img alt={show.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={poster} />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-full p-3">
                    <h4 className="text-xs font-semibold text-white truncate">{show.name}</h4>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
