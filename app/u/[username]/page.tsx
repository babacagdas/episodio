import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import FollowButton from './FollowButton';
import FollowListsModal from './FollowListsModal';
import ListPreviewCard from '@/components/ListPreviewCard';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

interface PageParams {
  username: string;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
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
    .select('id, username, full_name, bio, avatar_url')
    .eq('username', loweredUsername)
    .maybeSingle();
  profileData = (byUsername as Profile | null) ?? null;

  if (!profileData) {
    const { data: byId } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url')
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
      .select('id, username, full_name, bio, avatar_url')
      .eq('username', loweredUsername)
      .maybeSingle();
    profileData = (adminByUsername as Profile | null) ?? null;

    if (!profileData) {
      const { data: adminById } = await admin
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url')
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

  const [{ data: watchlistData }, followersRes, followingRes, relationRes, listsRes, itemsRes, likesRes] = await Promise.all([
    supabase
      .from('watchlist')
      .select('show_id, show_name, poster_path')
      .eq('user_id', profile.id)
      .order('added_at', { ascending: false })
      .limit(24),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    user
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('lists')
      .select('id, name, description, visibility')
      .eq('user_id', profile.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('list_items')
      .select('list_id, poster_path'),
    supabase
      .from('list_likes')
      .select('list_id'),
  ]);

  const watchlist = (watchlistData ?? []) as WatchlistRow[];
  const followers = followersRes.count ?? 0;
  const following = followingRes.count ?? 0;
  const isOwnProfile = user?.id === profile.id;
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
  const likesByListId: Record<string, number> = {};
  (likesRes.data ?? []).forEach((row: { list_id: string }) => {
    if (!listIdSet.has(row.list_id)) return;
    likesByListId[row.list_id] = (likesByListId[row.list_id] ?? 0) + 1;
  });

  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0">
      <MobileHeader />
      <Sidebar />

      <main className="md:ml-[240px]">
        <section className="relative">
          <div className="h-[200px] md:h-[260px] w-full bg-gradient-to-br from-[#E50914]/30 via-[#141414] to-[#0A0A0A]" />
          <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 relative -mt-16 md:-mt-20 z-10">
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
                <div className="pb-2">
                  <FollowButton targetUserId={profile.id} initialFollowing={isFollowing} />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-6">
          <div className="flex flex-wrap items-center gap-5 sm:gap-8">
            <div className="text-center">
              <span className="block text-2xl font-bold text-white">{watchlist.length}</span>
              <span className="text-[11px] text-white/30 uppercase tracking-wider">Listede</span>
            </div>
            <FollowListsModal
              profileId={profile.id}
              currentUserId={user?.id ?? null}
              followersCount={followers}
              followingCount={following}
            />
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-margin-mobile md:px-12 mt-8 mb-16">
          <h2 className="text-white font-semibold mb-4">İzleme Listesi</h2>
          {watchlist.length === 0 ? (
            <div className="glass-card p-5 text-sm text-white/40">
              Bu kullanıcının izleme listesi şu an boş.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlist.map((item) => {
                const poster = item.poster_path ? `${POSTER_BASE}${item.poster_path}` : null;
                return (
                  <Link
                    key={item.show_id}
                    href={`/show/${item.show_id}`}
                    className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 hover:scale-[1.02] transition-all duration-300 block"
                  >
                    {poster
                      ? <img alt={item.show_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={poster} />
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-full p-3">
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
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
