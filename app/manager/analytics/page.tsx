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

// Hafta Başı ve Sonu Hesaplayıcı (Pazartesi - Pazar)
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

export default async function WeeklyAnalyticsPage() {
  const { user, isAllowed } = await checkAdminAccess();

  if (!isAllowed) {
    redirect('/home');
  }

  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  // Supabase Auth & Profiles
  let authUsersList: any[] = [];
  if (admin) {
    try {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) authUsersList = authData.users;
    } catch {
      // continue
    }
  }

  const [profilesRes, listsRes, reviewsRes, notesRes, watchRes] = await Promise.all([
    db.from('profiles').select('id, username, full_name, avatar_url, created_at').order('created_at', { ascending: false }),
    db.from('lists').select('id, name, visibility, user_id, created_at').order('created_at', { ascending: false }),
    db.from('reviews').select('id, user_id, show_id, rating, content, created_at').order('created_at', { ascending: false }),
    db.from('show_notes').select('id, user_id, show_id, show_name, content, is_public, updated_at').order('updated_at', { ascending: false }),
    db.from('watch_status').select('id, updated_at').order('updated_at', { ascending: false }),
  ]);

  const profilesList = (profilesRes.data ?? []);
  const listsList = (listsRes.data ?? []);
  const reviewsList = (reviewsRes.data ?? []);
  const notesList = (notesRes.data ?? []);
  const watchList = (watchRes.data ?? []);

  // Map users together
  const userMap = new Map<string, { id: string; name: string; username: string | null; email?: string | null; avatar_url: string | null }>();

  authUsersList.forEach((u) => {
    userMap.set(u.id, {
      id: u.id,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.username || u.email || 'Kullanıcı',
      username: u.user_metadata?.username ?? (u.email ? u.email.split('@')[0] : null),
      email: u.email ?? null,
      avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
    });
  });

  profilesList.forEach((p: any) => {
    const existing = userMap.get(p.id);
    userMap.set(p.id, {
      id: p.id,
      name: p.full_name || p.username || existing?.name || 'Kullanıcı',
      username: p.username || existing?.username || null,
      email: existing?.email ?? null,
      avatar_url: p.avatar_url || existing?.avatar_url || null,
    });
  });

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

  // Ensure current week exists
  getOrCreateWeek(now);

  // Group Users
  profilesList.forEach((p: any) => {
    if (!p.created_at) return;
    const d = new Date(p.created_at);
    const week = getOrCreateWeek(d);
    const userInfo = userMap.get(p.id);
    const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    week.users.push({
      id: p.id,
      name: userInfo?.name || 'Kullanıcı',
      username: userInfo?.username || null,
      email: userInfo?.email || null,
      avatar_url: userInfo?.avatar_url || null,
      date: dateStr,
    });
  });

  // Group Lists
  listsList.forEach((l: any) => {
    if (!l.created_at) return;
    const d = new Date(l.created_at);
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

  // Group Reviews
  reviewsList.forEach((r: any) => {
    if (!r.created_at) return;
    const d = new Date(r.created_at);
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

  // Group Notes
  notesList.forEach((n: any) => {
    if (!n.updated_at) return;
    const d = new Date(n.updated_at);
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

  // Group Watch Count
  watchList.forEach((w: any) => {
    if (!w.updated_at) return;
    const d = new Date(w.updated_at);
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
