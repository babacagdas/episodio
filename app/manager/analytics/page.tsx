import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';



import ManagerPinAuth from '../ManagerPinAuth';
import WeeklyAnalyticsClient, { WeeklyData } from './WeeklyAnalyticsClient';

export const dynamic = 'force-dynamic';

async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?next=/manager/analytics');
  }

  const isAllowed = isAdminEmail(user.email);
  return { user, isAllowed };
}

// Hafta Başı ve Sonu Hesaplayıcı (Pazartesi 00:00 - Pazar 23:59)
function getISOWeekInfo(d: Date): { start: Date; end: Date; weekKey: string; label: string } {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date.setDate(diffToMonday));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const formatShort = (dateObj: Date) =>
    dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

  const label = `${formatShort(start)} - ${formatShort(end)} ${end.getFullYear()}`;
  const weekKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

  return { start, end, weekKey, label };
}

type UnifiedUser = {
  id: string;
  name: string;
  username: string | null;
  email?: string | null;
  avatar_url: string | null;
  created_at?: string | null;
};

export default async function WeeklyAnalyticsPage() {
  const { user, isAllowed } = await checkAdminAccess();

  if (!isAllowed) {
    redirect('/home');
  }

  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  // Supabase Auth Users & Public Profiles
  let authUsersList: any[] = [];
  if (admin) {
    try {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) authUsersList = authData.users;
    } catch {
      // continue
    }
  }

  const [profilesRes, listsRes, reviewsRes, notesRes, epDiscussionsRes, epRepliesRes, watchRes] = await Promise.all([
    db.from('profiles').select('id, username, full_name, avatar_url, created_at').order('created_at', { ascending: false }),
    db.from('lists').select('id, name, visibility, user_id, created_at').order('created_at', { ascending: false }),
    db.from('reviews').select('id, user_id, show_id, rating, content, created_at').order('created_at', { ascending: false }),
    db.from('show_notes').select('id, user_id, show_id, show_name, content, is_public, updated_at, created_at').order('updated_at', { ascending: false }),
    db.from('episode_discussions').select('id, user_id, show_id, season_number, episode_number, content, created_at').order('created_at', { ascending: false }),
    db.from('episode_comment_replies').select('id, user_id, comment_id, content, created_at').order('created_at', { ascending: false }),
    db.from('watch_status').select('id, updated_at, created_at').order('updated_at', { ascending: false }),
  ]);

  const profilesList = (profilesRes.data ?? []);
  const listsList = (listsRes.data ?? []);
  const reviewsList = (reviewsRes.data ?? []);
  const notesList = (notesRes.data ?? []);
  const watchList = (watchRes.data ?? []);

  // Map users together (Auth Users + Profiles)
  const userMap = new Map<string, UnifiedUser>();

  authUsersList.forEach((u) => {
    const nick = u.user_metadata?.username || (u.email ? u.email.split('@')[0] : null);
    const fullName = u.user_metadata?.full_name || u.user_metadata?.name || nick || 'Kullanıcı';

    userMap.set(u.id, {
      id: u.id,
      name: fullName,
      username: nick,
      email: u.email ?? null,
      avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
      created_at: u.created_at || null,
    });
  });

  profilesList.forEach((p: any) => {
    const existing = userMap.get(p.id);
    const updatedUsername = (p.username && p.username.trim()) ? p.username : (existing?.username || null);
    const updatedName = (p.full_name && p.full_name.trim()) ? p.full_name : (p.username || existing?.name || 'Kullanıcı');

    userMap.set(p.id, {
      id: p.id,
      name: updatedName,
      username: updatedUsername,
      email: existing?.email ?? null,
      avatar_url: p.avatar_url || existing?.avatar_url || null,
      created_at: p.created_at || existing?.created_at || null,
    });
  });

  const allUsers = Array.from(userMap.values());

  // Dynamic Weekly Grouping Map
  const weekMap = new Map<string, WeeklyData>();
  const now = new Date();
  const currentWeekInfo = getISOWeekInfo(now);

  function getOrCreateWeek(dateObj: Date): WeeklyData {
    const info = getISOWeekInfo(dateObj);
    if (!weekMap.has(info.weekKey)) {
      weekMap.set(info.weekKey, {
        weekKey: info.weekKey,
        label: info.label,
        startDate: info.start.toISOString(),
        endDate: info.end.toISOString(),
        isCurrentWeek: info.weekKey === currentWeekInfo.weekKey,
        users: [],
        lists: [],
        reviews: [],
        watchCount: 0,
      });
    }
    return weekMap.get(info.weekKey)!;
  }

  // Current week initialisation
  getOrCreateWeek(now);

  // 1. Group ALL Users (Auth Users + Profiles)
  allUsers.forEach((u) => {
    const rawDate = u.created_at ? new Date(u.created_at) : now;
    const d = isNaN(rawDate.getTime()) ? now : rawDate;
    const week = getOrCreateWeek(d);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    week.users.push({
      id: u.id,
      name: u.name || 'Kullanıcı',
      username: u.username || null,
      email: u.email || null,
      avatar_url: u.avatar_url || null,
      date: dateStr,
    });
  });

  // 2. Group Lists
  listsList.forEach((l: any) => {
    const rawDate = l.created_at ? new Date(l.created_at) : now;
    const d = isNaN(rawDate.getTime()) ? now : rawDate;
    const week = getOrCreateWeek(d);
    const userInfo = userMap.get(l.user_id);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    week.lists.push({
      id: l.id,
      name: l.name,
      visibility: l.visibility,
      creator: userInfo?.username || userInfo?.name || 'Kullanıcı',
      date: dateStr,
    });
  });

  // 3. Group Reviews
  reviewsList.forEach((r: any) => {
    const rawDate = r.created_at ? new Date(r.created_at) : now;
    const d = isNaN(rawDate.getTime()) ? now : rawDate;
    const week = getOrCreateWeek(d);
    const userInfo = userMap.get(r.user_id);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    week.reviews.push({
      id: r.id,
      content: r.content,
      rating: r.rating,
      reviewer: userInfo?.username || userInfo?.name || 'Kullanıcı',
      date: dateStr,
    });
  });

  // 4. Group Notes
  notesList.forEach((n: any) => {
    const rawDate = n.updated_at || n.created_at ? new Date(n.updated_at || n.created_at) : now;
    const d = isNaN(rawDate.getTime()) ? now : rawDate;
    const week = getOrCreateWeek(d);
    const userInfo = userMap.get(n.user_id);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    week.reviews.push({
      id: n.id || `note-${Math.random()}`,
      content: n.content,
      rating: null,
      reviewer: userInfo?.username || userInfo?.name || 'Kullanıcı',
      showName: n.show_name,
      date: dateStr,
    });
  });

  // 5. Group Episode Discussions
  (epDiscussionsRes.data ?? []).forEach((d: any) => {
    const rawDate = d.created_at ? new Date(d.created_at) : now;
    const dateObj = isNaN(rawDate.getTime()) ? now : rawDate;
    const week = getOrCreateWeek(dateObj);
    const userInfo = userMap.get(d.user_id);
    const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    week.reviews.push({
      id: d.id,
      content: d.content,
      rating: null,
      reviewer: userInfo?.username || userInfo?.name || 'Kullanıcı',
      showName: `S${d.season_number || 1}E${d.episode_number || 1} Bölüm Yorumu`,
      date: dateStr,
    });
  });

  // 6. Group Episode Replies
  (epRepliesRes.data ?? []).forEach((rp: any) => {
    const rawDate = rp.created_at ? new Date(rp.created_at) : now;
    const dateObj = isNaN(rawDate.getTime()) ? now : rawDate;
    const week = getOrCreateWeek(dateObj);
    const userInfo = userMap.get(rp.user_id);
    const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    week.reviews.push({
      id: rp.id,
      content: rp.content,
      rating: null,
      reviewer: userInfo?.username || userInfo?.name || 'Kullanıcı',
      showName: 'Yorum Yanıtı',
      date: dateStr,
    });
  });

  // 7. Group Watch Count
  watchList.forEach((w: any) => {
    const rawDate = w.updated_at || w.created_at ? new Date(w.updated_at || w.created_at) : now;
    const d = isNaN(rawDate.getTime()) ? now : rawDate;
    const week = getOrCreateWeek(d);
    week.watchCount += 1;
  });

  const sortedWeeks = Array.from(weekMap.values()).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <ManagerPinAuth adminEmail={user.email || ''}>
      <WeeklyAnalyticsClient weeks={sortedWeeks} />
    </ManagerPinAuth>
  );
}
