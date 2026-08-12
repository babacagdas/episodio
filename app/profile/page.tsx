import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { MobileHeader } from '@/components/Nav';
import ProfileContent from './ProfileContent';
import NotificationsBell from '@/app/home/NotificationsBell';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?next=/profile');
  }

  // ⚡ SERVER-SIDE PRE-FETCH: Tüm profil verisi ve 5 istatistik sayaci sunucuda 0ms istemci beklemesiyle cekilir
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
    supabase
      .from('profiles')
      .select('username, full_name, bio, avatar_url, activity_visible, cover_show_id, favorite_actors_visible')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', user.id),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', user.id),
    supabase.from('watch_status').select('show_id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('episode_discussions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('episode_comment_replies').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('watchlist').select('show_id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const p = profileRes.data;
  const initialProfile = {
    username: p?.username ?? (user.email?.split('@')[0] ?? ''),
    full_name: p?.full_name ?? (user.user_metadata?.full_name ?? ''),
    bio: p?.bio ?? '',
    avatar_url: p?.avatar_url ?? (user.user_metadata?.avatar_url ?? ''),
    activity_visible: p?.activity_visible ?? true,
    cover_show_id: p?.cover_show_id ?? null,
    favorite_actors_visible: p?.favorite_actors_visible !== false,
  };

  const totalReviewsCount = (reviewRes.count ?? 0) + (epDiscussionsRes.count ?? 0) + (epRepliesRes.count ?? 0);

  const initialStats = {
    followersCount: followersRes.count ?? 0,
    followingCount: followingRes.count ?? 0,
    watchedCount: watchedRes.count ?? 0,
    reviewCount: totalReviewsCount,
    watchlistCount: watchlistRes.count ?? 0,
  };

  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0 pt-[60px] md:pt-0 min-h-screen overflow-x-hidden">
      <MobileHeader rightElement={<NotificationsBell />} />
      <Sidebar />
      <ProfileContent
        initialUser={user}
        initialProfile={initialProfile}
        initialStats={initialStats}
      />
    </div>
  );
}
