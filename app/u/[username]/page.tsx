import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import FollowButton from './FollowButton';
import FollowListsModal from './FollowListsModal';
import WatchedShowsSection from './WatchedShowsSection';
import ListPreviewCard from '@/components/ListPreviewCard';
import { getTvBackdropPath } from '@/lib/tmdb';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const ACTOR_PROFILE_BASE = 'https://image.tmdb.org/t/p/w342';

interface PageParams {
  username: string;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  activity_visible: boolean | null;
  cover_show_id?: number | null;
  favorite_actors_visible?: boolean | null;
}

interface WatchlistRow {
  show_id: number;
  show_name: string;
  poster_path: string | null;
}

interface PublicListRow {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
}

interface FavoriteActorRow {
  actor_id: number;
  actor_name: string;
  actor_profile_path: string | null;
}

export default async function UserProfilePage({ params }: { params: Promise<PageParams> }) {
  const { username } = await params;
  const normalizedUsername = decodeURIComponent(username).trim().replace(/^@+/, '');
  const loweredUsername = normalizedUsername.toLowerCase();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileData: Profile | null = null;

  // Use safe step-by-step lookup instead of OR filter parsing.
  const { data: byUsername } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url, activity_visible, cover_show_id, favorite_actors_visible')
    .eq('username', loweredUsername)
    .maybeSingle();
  profileData = (byUsername as Profile | null) ?? null;

  if (!profileData) {
    const { data: byId } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, activity_visible, cover_show_id, favorite_actors_visible')
      .eq('id', normalizedUsername)
      .maybeSingle();
    profileData = (byId as Profile | null) ?? null;
  }

  // Fallback for strict RLS setups: resolve public profile via service role.
  if (!profileData && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    const { data: adminByUsername } = await admin
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, activity_visible, cover_show_id, favorite_actors_visible')
      .eq('username', loweredUsername)
      .maybeSingle();
    profileData = (adminByUsername as Profile | null) ?? null;

    if (!profileData) {
      const { data: adminById } = await admin
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, activity_visible, cover_show_id, favorite_actors_visible')
        .eq('id', normalizedUsername)
        .maybeSingle();
      profileData = (adminById as Profile | null) ?? null;
    }
  }

  const profile = profileData;
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-lg font-semibold mb-2">Profil bulunamadı</p>
          <Link href="/search" className="text-[#D4A017] hover:text-white transition-colors text-sm">
            Aramaya geri dön
          </Link>
        </div>
      </div>
    );
  }

  let coverImageUrl: string | null = null;
  const coverShowId = profile.cover_show_id ?? null;
  if (coverShowId != null) {
    const path = await getTvBackdropPath(String(coverShowId));
    if (path) coverImageUrl = `${TMDB_BACKDROP}${path}`;
  }

  const isOwnProfile = user?.id === profile.id;
  const canViewWatched = isOwnProfile || profile.activity_visible !== false;
  const favoriteActorsVisible = profile.favorite_actors_visible !== false;
  const canViewFavoriteActors = isOwnProfile || favoriteActorsVisible;

  const [{ data: watchlistData }, followersRes, followingRes, relationRes, listsRes, itemsRes, likesRes, watchedRes, watchedShowsRes, reviewRes, notesRes, userShowsRes, userWatchlistRes, targetShowsRes, targetWatchlistRes] = await Promise.all([
    supabase.from('watchlist').select('show_id, show_name, poster_path').eq('user_id', profile.id).order('added_at', { ascending: false }).limit(24),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    user ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabase.from('lists').select('id, name, description, visibility').eq('user_id', profile.id).eq('visibility', 'public').order('created_at', { ascending: false }).limit(12),
    supabase.from('list_items').select('list_id, poster_path'),
    supabase.from('list_likes').select('list_id'),
    canViewWatched
      ? supabase.from('watch_status').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('status', 'completed')
      : Promise.resolve({ count: 0 }),
    canViewWatched
      ? supabase.from('watch_status').select('show_id, show_name, poster_path').eq('user_id', profile.id).eq('status', 'completed').order('updated_at', { ascending: false }).limit(12)
      : Promise.resolve({ data: [] }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
    supabase.from('show_notes').select('show_id, show_name, poster_path, content').eq('user_id', profile.id).eq('is_public', true).order('updated_at', { ascending: false }).limit(20),
    (user && !isOwnProfile)
      ? supabase.from('watch_status').select('show_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    (user && !isOwnProfile)
      ? supabase.from('watchlist').select('show_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    (user && !isOwnProfile)
      ? supabase.from('watch_status').select('show_id').eq('user_id', profile.id)
      : Promise.resolve({ data: [] }),
    (user && !isOwnProfile)
      ? supabase.from('watchlist').select('show_id').eq('user_id', profile.id)
      : Promise.resolve({ data: [] }),
  ]);

  const watchlist = (watchlistData ?? []) as WatchlistRow[];
  const followers = followersRes.count ?? 0;
  const following = followingRes.count ?? 0;
  const watchedCount = canViewWatched ? watchedRes.count ?? 0 : 0;
  const watchedStatValue: number | string = canViewWatched ? watchedCount : 'Gizli';
  const watchedShows = (watchedShowsRes.data ?? []) as WatchlistRow[];
  const reviewCount = reviewRes.count ?? 0;
  const isFollowing = !!relationRes.data;
  const displayName = profile.full_name || profile.username || 'Kullanıcı';
  const publicLists = (listsRes.data ?? []) as PublicListRow[];
  const listIdSet = new Set(publicLists.map((list) => list.id));
  const itemCounts: Record<string, number> = {};
  const postersByListId: Record<string, string[]> = {};

  (itemsRes.data ?? []).forEach((row: { list_id: string; poster_path: string | null }) => {
    if (!listIdSet.has(row.list_id)) return;
    itemCounts[row.list_id] = (itemCounts[row.list_id] ?? 0) + 1;
    if (!postersByListId[row.list_id]) postersByListId[row.list_id] = [];
    if (row.poster_path && postersByListId[row.list_id].length < 4) postersByListId[row.list_id].push(row.poster_path);
  });

  // ⚡ Dizi Zevk Uyumu (% Match Rate) - Sınırsız Tam Kapsamlı Hesaplama
  let matchPercentage: number | null = null;
  let sharedShowsCount = 0;
  if (user && !isOwnProfile) {
    const userShowIds = new Set([
      ...((userShowsRes?.data ?? []) as { show_id: number }[]).map(s => s.show_id),
      ...((userWatchlistRes?.data ?? []) as { show_id: number }[]).map(s => s.show_id),
    ]);
    const targetShowIds = new Set([
      ...((targetShowsRes?.data ?? []) as { show_id: number }[]).map(s => s.show_id),
      ...((targetWatchlistRes?.data ?? []) as { show_id: number }[]).map(s => s.show_id),
    ]);

    targetShowIds.forEach(id => {
      if (userShowIds.has(id)) sharedShowsCount++;
    });

    if (targetShowIds.size > 0 && sharedShowsCount > 0) {
      matchPercentage = Math.min(98, Math.max(68, Math.round(55 + (sharedShowsCount / Math.max(1, targetShowIds.size)) * 45)));
    } else if (targetShowIds.size > 0 && userShowIds.size > 0) {
      matchPercentage = 62;
    }
  }
  const publicNotes = (notesRes.data ?? []) as { show_id: number; show_name: string; poster_path: string | null; content: string }[];
  const adminClient = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      )
    : null;
  const actorClient = adminClient ?? supabase;

  const favoriteActorsRes = canViewFavoriteActors
    ? await actorClient
      .from('actor_swipes')
      .select('actor_id, actor_name, actor_profile_path')
      .eq('user_id', profile.id)
      .eq('action', 'like')
      .order('created_at', { ascending: false })
      .limit(18)
    : { data: [] };
  const favoriteActors = (favoriteActorsRes.data ?? []) as FavoriteActorRow[];
  const likesByListId: Record<string, number> = {};
  (likesRes.data ?? []).forEach((row: { list_id: string }) => {
    if (!listIdSet.has(row.list_id)) return;
    likesByListId[row.list_id] = (likesByListId[row.list_id] ?? 0) + 1;
  });

  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0 pt-[60px] md:pt-0">
      <MobileHeader />
      <Sidebar />

      <main className="md:ml-[200px]">
        <section className="relative">
          <div className="relative h-[180px] sm:h-[220px] md:h-[280px] lg:h-[340px] w-full overflow-hidden bg-[#0A0A0A]">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Profil Kapağı"
                className="absolute inset-0 h-full w-full object-cover object-center sm:object-[center_35%]"
              />
            ) : null}
            <div
              className={`absolute inset-0 pointer-events-none ${
                coverImageUrl ? 'bg-gradient-to-t from-[#0A0A0A] via-black/20 to-transparent opacity-80' : 'bg-gradient-to-br from-[#C91520]/30 via-[#141414] to-[#0A0A0A]'
              }`}
              aria-hidden
            />
          </div>
          <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 relative -mt-14 sm:-mt-16 md:-mt-20 lg:-mt-24 z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-md">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#0A0A0A] overflow-hidden bg-[#141414] shrink-0 flex items-center justify-center">
                {profile.avatar_url
                  ? <img alt={displayName} className="w-full h-full object-cover" src={profile.avatar_url} />
                  : <span className="material-symbols-outlined text-white/20 text-5xl">person</span>
                }
              </div>
              <div className="text-center md:text-left flex-1 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{displayName}</h1>
                <p className="text-sm text-white/35 mt-0.5">@{profile.username}</p>
                {profile.bio && <p className="text-sm text-white/55 mt-2 max-w-xl">{profile.bio}</p>}
              </div>
              {!isOwnProfile && (
                <div className="pb-2 flex items-center justify-center gap-2">
                  <FollowButton targetUserId={profile.id} initialFollowing={isFollowing} />
                  <Link
                    href={`/chat?user=${profile.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 transition-all hover:bg-white/20 hover:text-white md:px-4 md:py-1.5 md:text-xs"
                    title="Mesaj Gönder"
                  >
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                    <span>Mesaj</span>
                  </Link>
                </div>
              )}
            </div>
            {/* Mobilde takip/takipçi, follow butonunun hemen altında */}
            <div className="md:hidden w-full flex justify-center mt-2">
              <div className="flex items-center gap-8">
                <FollowListsModal
                  profileId={profile.id}
                  currentUserId={user?.id ?? null}
                  followersCount={followers}
                  followingCount={following}
                  order="following-first"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-6">
          {/* Mobil: Listede/İzlendi/Yorum */}
          <div className="grid grid-cols-3 gap-4 md:hidden">
            {[
              { val: watchlist.length, label: 'Listede' },
              { val: watchedStatValue, label: 'İzlendi' },
              { val: reviewCount, label: 'Yorum' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <span className="block text-lg sm:text-2xl font-bold text-white">{val}</span>
                <span className="text-[10px] sm:text-[11px] text-white/30 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>

          {/* Mobil: Dizi Zevk Uyumu Çerçevesi */}
          {matchPercentage !== null && (
            <div className="mt-3 flex justify-center md:hidden">
              <div className="inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 py-1.5 backdrop-blur-md shadow-md">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C91520]/15 text-[#C91520] border border-[#C91520]/25">
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="text-white/50 text-[11px]">Zevk Uyumu:</span>
                  <span className="text-emerald-400 font-black">%{matchPercentage}</span>
                  {sharedShowsCount > 0 && (
                    <span className="text-[10px] font-semibold text-white/40 ml-1">({sharedShowsCount} Ortak Dizi)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Masaüstü: İstatistik Banner'ı ve Yorumun Sağında Şık Uyum Göstergesi */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-8">
              <FollowListsModal
                profileId={profile.id}
                currentUserId={user?.id ?? null}
                followersCount={followers}
                followingCount={following}
                order="following-first"
              />
              <div className="w-px h-8 bg-white/10" />
              {[
                { val: watchedStatValue, label: 'İzlendi' },
                { val: watchlist.length, label: 'Listede' },
                { val: reviewCount, label: 'Yorum' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <span className="block text-2xl font-bold text-white">{val}</span>
                  <span className="text-[11px] text-white/30 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>

            {/* Dizi Zevk Uyumu Göstergesi (Yorumun sağında boşluklu, şık zarif çerçeveli) */}
            {matchPercentage !== null && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] shrink-0 ml-12">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#C91520]/15 text-[#C91520] border border-[#C91520]/25">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                    <span className="text-white/50 text-[11px] font-semibold">Dizi Zevk Uyumu:</span>
                    <span className="text-emerald-400 font-black text-sm">%{matchPercentage}</span>
                  </div>
                  {sharedShowsCount > 0 && (
                    <span className="text-[10px] font-semibold text-white/40">{sharedShowsCount} Ortak Dizi</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <WatchedShowsSection
          profileId={profile.id}
          canViewWatched={canViewWatched}
          initialShows={watchedShows}
          totalCount={watchedCount}
        />

        <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-8 mb-16">
          <h2 className="text-white font-semibold mb-4">İzleme Listesi</h2>
          {watchlist.length === 0 ? (
            <div className="glass-card p-5 text-sm text-white/40">
              Bu kullanıcının izleme listesi şu an boş.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {watchlist.map((item) => {
                const poster = item.poster_path ? `${POSTER_BASE}${item.poster_path}` : null;
                return (
                  <Link
                    key={item.show_id}
                    href={`/show/${item.show_id}`}
                    className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 transition-all duration-300 block"
                  >
                    {poster
                      ? <img alt={item.show_name} className="w-full h-full object-cover" src={poster} />
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-full p-2.5 sm:p-3">
                      <h4 className="text-xs font-semibold text-white truncate">{item.show_name}</h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-2 mb-16">
          <h2 className="text-white font-semibold mb-4">Listeler</h2>
          {publicLists.length === 0 ? (
            <div className="glass-card p-5 text-sm text-white/40">
              Bu kullanıcının herkese açık listesi yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicLists.map((list) => (
                <ListPreviewCard
                  key={list.id}
                  id={list.id}
                  name={list.name}
                  description={list.description}
                  visibility={list.visibility}
                  posters={postersByListId[list.id] ?? []}
                  itemCount={itemCounts[list.id] ?? 0}
                  likeCount={likesByListId[list.id] ?? 0}
                  creatorName={displayName}
                  creatorAvatar={profile.avatar_url}
                />
              ))}
            </div>
          )}
        </section>

        {canViewFavoriteActors && favoriteActors.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-2 mb-16">
            <h2 className="text-white font-semibold mb-4">Favori Oyuncular</h2>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {favoriteActors.map((actor) => {
                const profileImage = actor.actor_profile_path ? `${ACTOR_PROFILE_BASE}${actor.actor_profile_path}` : null;
                return (
                  <Link key={actor.actor_id} href={`/person/${actor.actor_id}`} className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/5 bg-[#141414] shadow-md transition-all duration-300 hover:border-white/20 block">
                    {profileImage
                      ? <img src={profileImage} alt={actor.actor_name} className="h-full w-full object-cover" loading="lazy" />
                      : <div className="flex h-full w-full items-center justify-center"><span className="material-symbols-outlined text-4xl text-white/20">person</span></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-emerald-300/90">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-3">
                      <h4 className="truncate text-xs font-bold text-white sm:text-sm">{actor.actor_name}</h4>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {publicNotes.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-2 mb-16">
            <h2 className="text-white font-semibold mb-4">Notlar</h2>
            <div className="space-y-3 max-w-2xl">
              {publicNotes.map(note => (
                <Link key={note.show_id} href={`/show/${note.show_id}`} className="flex gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-4 transition-colors block">
                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-[#1A1A1A] shrink-0">
                    {note.poster_path
                      ? <img src={`https://image.tmdb.org/t/p/w92${note.poster_path}`} alt={note.show_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-sm">movie</span></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate mb-1">{note.show_name}</p>
                    <p className="text-sm text-white/55 line-clamp-2 leading-relaxed">{note.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
