import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';

import ManagerPinAuth from './ManagerPinAuth';
import ManagerUserList from './ManagerUserList';
import AnnouncementForm from './AnnouncementForm';
import ManagerDailyFeed, { DailyUserFeedItem, DailyListFeedItem, DailyCommentFeedItem } from './ManagerDailyFeed';

export const dynamic = 'force-dynamic';

type UserItem = {
  id: string;
  email?: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
  is_banned?: boolean;
};

type ListRow = {
  id: string;
  name: string;
  visibility: string | null;
  user_id: string;
  created_at?: string | null;
};

type ReviewRow = {
  id: string;
  user_id: string;
  show_id: number;
  rating: number | null;
  content: string | null;
  created_at?: string | null;
};

type ShowNoteRow = {
  id?: string;
  user_id: string;
  show_id: number;
  show_name?: string | null;
  content: string | null;
  is_public?: boolean;
  updated_at?: string | null;
};

type EpisodeDiscussionRow = {
  id: string;
  user_id: string;
  show_id: number;
  season_number?: number;
  episode_number?: number;
  content: string | null;
  created_at?: string | null;
};

type EpisodeReplyRow = {
  id: string;
  user_id: string;
  comment_id: string;
  content: string | null;
  created_at?: string | null;
};

async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?next=/manager');
  }

  const isAllowed = isAdminEmail(user.email);
  return { user, isAllowed };
}

// Admin Moderasyon Aksiyonları (Liste Silme)
async function deleteListAction(formData: FormData) {
  'use server';
  const { isAllowed } = await checkAdminAccess();
  if (!isAllowed) return;

  const listId = String(formData.get('listId') ?? '');
  if (!listId) return;

  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  await db.from('lists').delete().eq('id', listId);
  revalidatePath('/manager');
}

// Admin Moderasyon Aksiyonları (Yorum Silme)
async function deleteReviewAction(formData: FormData) {
  'use server';
  const { isAllowed } = await checkAdminAccess();
  if (!isAllowed) return;

  const reviewId = String(formData.get('reviewId') ?? '');
  const type = String(formData.get('type') ?? 'review');
  if (!reviewId) return;

  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  if (type === 'episode') {
    await db.from('episode_discussions').delete().eq('id', reviewId);
  } else if (type === 'reply') {
    await db.from('episode_comment_replies').delete().eq('id', reviewId);
  } else {
    await db.from('reviews').delete().eq('id', reviewId);
  }

  revalidatePath('/manager');
}

function StatCard({ label, value, icon, badge }: { label: string; value: number | string; icon: string; badge?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0F0F14]/90 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#C91520]/10 blur-2xl pointer-events-none rounded-full" />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C91520]/15 text-[#C91520] border border-[#C91520]/20">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        {badge && (
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            {badge}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}

export default async function ManagerDashboardPage() {
  const { user, isAllowed } = await checkAdminAccess();

  // Yetkisiz Erişim Kartı
  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070709] px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0E0E12] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C91520]/20 text-[#C91520] border border-[#C91520]/30">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="text-xl font-bold text-white">Erişim Engellendi</h1>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            Bu yönetici paneline yalnızca yetkili yöneticiler (<span className="text-white font-bold">{user.email}</span>) erişebilir.
          </p>
          <Link
            href="/home"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C91520] px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#E50914]"
          >
            <span>Ana Sayfaya Dön</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  // 1. Supabase Auth ve Profiles Verilerini Çekme (Tam Kapsamlı Canlı Veriler)
  let authUsersList: any[] = [];
  if (admin) {
    try {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        authUsersList = authData.users;
      }
    } catch {
      // continue
    }
  }

  const [profilesRes, listsRes, reviewsRes, notesRes, epDiscussionsRes, epRepliesRes] = await Promise.all([
    db.from('profiles').select('id, username, full_name, avatar_url, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('lists').select('id, name, visibility, user_id, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('reviews').select('id, user_id, show_id, rating, content, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('show_notes').select('id, user_id, show_id, show_name, content, is_public, updated_at', { count: 'exact' }).order('updated_at', { ascending: false }),
    db.from('episode_discussions').select('id, user_id, show_id, season_number, episode_number, content, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('episode_comment_replies').select('id, user_id, comment_id, content, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
  ]);

  const profilesList = (profilesRes.data ?? []) as UserItem[];
  const lists = (listsRes.data ?? []) as ListRow[];
  const reviews = (reviewsRes.data ?? []) as ReviewRow[];
  const notes = (notesRes.data ?? []) as ShowNoteRow[];
  const epDiscussions = (epDiscussionsRes.data ?? []) as EpisodeDiscussionRow[];
  const epReplies = (epRepliesRes.data ?? []) as EpisodeReplyRow[];

  // Auth Users + Profiles Tablosunu Birleştirme (Mevcut kullanıcı adları öncelikli)
  const userMap = new Map<string, UserItem>();

  authUsersList.forEach((u) => {
    userMap.set(u.id, {
      id: u.id,
      email: u.email ?? null,
      username: u.user_metadata?.username ?? (u.email ? u.email.split('@')[0] : null),
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
      avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
      created_at: u.created_at,
      is_banned: !!u.user_metadata?.is_banned,
    });
  });

  profilesList.forEach((p: any) => {
    const existing = userMap.get(p.id);
    const updatedUsername = (p.username && p.username.trim()) ? p.username : (existing?.username || null);
    const updatedFullName = (p.full_name && p.full_name.trim()) ? p.full_name : (existing?.full_name || null);

    userMap.set(p.id, {
      id: p.id,
      email: existing?.email ?? null,
      username: updatedUsername,
      full_name: updatedFullName,
      avatar_url: p.avatar_url || existing?.avatar_url || null,
      created_at: p.created_at || existing?.created_at || null,
      is_banned: p.is_banned !== undefined ? !!p.is_banned : (existing?.is_banned || false),
    });
  });

  const allUsers = Array.from(userMap.values());
  const totalUserCount = allUsers.length > 0 ? allUsers.length : (profilesRes.count ?? profilesList.length);
  const totalListCount = listsRes.count ?? lists.length;
  
  // TÜM YORUM VE YANIT TİPLERİNİN TOPLAMI (Eksiksiz %100 Gerçek Yorum Sayısı)
  const totalReviewCount = 
    (reviewsRes.count ?? reviews.length) + 
    (notesRes.count ?? notes.length) + 
    (epDiscussionsRes.count ?? epDiscussions.length) + 
    (epRepliesRes.count ?? epReplies.length);

  // SON 24 SAAT GÜNLÜK HESAPLAMALARI (Otomatik Tarihli)
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const todayFormatted = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const dailyUsersCount = allUsers.filter((u) => u.created_at && u.created_at >= last24h).length;
  const dailyListsCount = lists.filter((l) => l.created_at && l.created_at >= last24h).length;
  
  const dailyReviewsCount = 
    reviews.filter((r) => r.created_at && r.created_at >= last24h).length +
    notes.filter((n) => n.updated_at && n.updated_at >= last24h).length +
    epDiscussions.filter((d) => d.created_at && d.created_at >= last24h).length +
    epReplies.filter((rp) => rp.created_at && rp.created_at >= last24h).length;

  // SON 24 SAAT DETAYLI İÇERİK FEED'LERİ
  const dailyUsersFeed: DailyUserFeedItem[] = allUsers
    .filter((u) => u.created_at && u.created_at >= last24h)
    .map((u) => ({
      id: u.id,
      name: u.full_name || u.username || u.email || 'Kullanıcı',
      username: u.username || null,
      email: u.email || null,
      avatar_url: u.avatar_url || null,
      created_at: u.created_at || '',
    }));

  const dailyListsFeed: DailyListFeedItem[] = lists
    .filter((l) => l.created_at && l.created_at >= last24h)
    .map((l) => {
      const author = userMap.get(l.user_id);
      return {
        id: l.id,
        name: l.name,
        visibility: l.visibility,
        creatorName: author?.username || author?.full_name || 'Kullanıcı',
        created_at: l.created_at || '',
      };
    });

  const dailyCommentsFeed: DailyCommentFeedItem[] = [
    ...reviews.filter((r) => r.created_at && r.created_at >= last24h).map((r) => {
      const author = userMap.get(r.user_id);
      return {
        id: `r-${r.id}`,
        type: 'review' as const,
        authorName: author?.username || author?.full_name || 'Kullanıcı',
        content: r.content,
        rating: r.rating,
        created_at: r.created_at || '',
      };
    }),
    ...notes.filter((n) => n.updated_at && n.updated_at >= last24h).map((n) => {
      const author = userMap.get(n.user_id);
      return {
        id: `n-${n.id || Math.random()}`,
        type: 'note' as const,
        authorName: author?.username || author?.full_name || 'Kullanıcı',
        content: n.content,
        titleInfo: n.show_name,
        created_at: n.updated_at || '',
      };
    }),
    ...epDiscussions.filter((d) => d.created_at && d.created_at >= last24h).map((d) => {
      const author = userMap.get(d.user_id);
      return {
        id: `d-${d.id}`,
        type: 'discussion' as const,
        authorName: author?.username || author?.full_name || 'Kullanıcı',
        content: d.content,
        titleInfo: `S${d.season_number || 1}E${d.episode_number || 1}`,
        created_at: d.created_at || '',
      };
    }),
    ...epReplies.filter((rp) => rp.created_at && rp.created_at >= last24h).map((rp) => {
      const author = userMap.get(rp.user_id);
      return {
        id: `rp-${rp.id}`,
        type: 'reply' as const,
        authorName: author?.username || author?.full_name || 'Kullanıcı',
        content: rp.content,
        created_at: rp.created_at || '',
      };
    }),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <ManagerPinAuth adminEmail={user.email || ''}>
      <div className="min-h-screen bg-[#070709] text-[#F4F6FA] select-none pb-20">
        
        {/* Header: Logo + Haftalık Analiz Butonu (Parlamasız Temiz Buton) */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0E]/90 backdrop-blur-2xl px-4 md:px-10 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.png" alt="Episodio" className="h-7 w-auto object-contain pointer-events-none select-none" />
            </div>

            <Link
              href="/manager/analytics"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-xs font-bold text-white/90 hover:text-white transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-[#C91520]">analytics</span>
              <span>Haftalık Analiz</span>
            </Link>
          </div>
        </header>

        {/* Main Container */}
        <main className="mx-auto max-w-7xl px-4 md:px-10 pt-8 space-y-8">

          {/* Başlık */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Manager Yönetim Paneli</h1>
            <p className="mt-1 text-xs sm:text-sm text-white/45">
              Episodio platformundaki tüm canlı üye kayıtları, oluşturulan listeler, yazılan yorumlar ve günlük aktiviteler.
            </p>
          </div>

          {/* 1. Özet İstatistik Kartları (Genel Toplam) */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Kayıtlı Üyeler" value={totalUserCount} icon="group" />
            <StatCard label="Oluşturulan Listeler" value={totalListCount} icon="format_list_bulleted" />
            <StatCard label="Yazılan Tüm Yorumlar & Notlar" value={totalReviewCount} icon="rate_review" />
          </section>

          {/* 2. GÜNLÜK İSTATİSTİK BANNER'I VE 24S CANLI İÇERİK AKIŞI */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#141018] via-[#12121C] to-[#0A0A10] p-6 shadow-2xl">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#C91520]/10 blur-3xl" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Son 24 Saat Günlük İstatistikleri
                </h3>
              </div>
              <div className="text-xs font-bold text-white/50 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 self-start sm:self-auto">
                📅 {todayFormatted} (Son 24 Saat Raporu)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white/40 block mb-1">Yeni Kayıt Üye</span>
                  <span className="text-2xl font-black text-emerald-400">+{dailyUsersCount}</span>
                </div>
                <span className="material-symbols-outlined text-2xl text-emerald-400/40">person_add</span>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white/40 block mb-1">Yeni Oluşturulan Liste</span>
                  <span className="text-2xl font-black text-sky-400">+{dailyListsCount}</span>
                </div>
                <span className="material-symbols-outlined text-2xl text-sky-400/40">playlist_add</span>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white/40 block mb-1">Yeni Yorum & Yanıt</span>
                  <span className="text-2xl font-black text-purple-400">+{dailyReviewsCount}</span>
                </div>
                <span className="material-symbols-outlined text-2xl text-purple-400/40">add_comment</span>
              </div>
            </div>

            {/* ⚡ Son 24 Saatin Detaylı Canlı İçerik Akışı (Açıklamalı & Filtreli) */}
            <ManagerDailyFeed
              users={dailyUsersFeed}
              lists={dailyListsFeed}
              comments={dailyCommentsFeed}
            />
          </section>

          {/* 3. Sitede Canlı Duyuru / Banner Yönetimi */}
          <AnnouncementForm />

          {/* 4. Kayıtlı Üyeler Tablosu (Arama Çubuğu & Max 15 Satır Scroll Özellikli) */}
          <ManagerUserList users={allUsers} />

          {/* 5. İki Kolonlu Yapı: Son Listeler ve Son Yorumlar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Son Listeler */}
            <section className="rounded-3xl border border-white/10 bg-[#0E0E14] p-5 sm:p-6 shadow-2xl flex flex-col">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-[#C91520]">format_list_bulleted</span>
                Oluşturulan Listeler ({lists.length})
              </h2>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                {lists.length === 0 ? (
                  <p className="text-xs text-white/30 py-6 text-center">Henüz liste yok.</p>
                ) : (
                  lists.map((l) => {
                    const creator = userMap.get(l.user_id);
                    const creatorUsername = creator?.username || creator?.full_name || creator?.email || 'Kullanıcı';

                    return (
                      <div key={l.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                        <div className="min-w-0 flex-1">
                          <Link href={`/list/${l.id}`} target="_blank" className="font-bold text-xs text-white hover:text-[#C91520] transition-colors truncate block">
                            {l.name}
                          </Link>
                          <p className="text-[10.5px] text-white/40 mt-0.5">
                            Oluşturan: @{creatorUsername} &bull; {l.visibility === 'private' ? 'Gizli' : 'Açık'}
                          </p>
                        </div>

                        <form action={deleteListAction}>
                          <input type="hidden" name="listId" value={l.id} />
                          <button
                            type="submit"
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Listeyi Sil"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </form>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Son Yorumlar, Bölüm Tartışmaları & Notlar (Tüm Kaynaklar) */}
            <section className="rounded-3xl border border-white/10 bg-[#0E0E14] p-5 sm:p-6 shadow-2xl flex flex-col">
              <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C91520]">rate_review</span>
                  Tüm Yorumlar & İncelemeler
                </span>
                <span className="text-xs font-bold text-[#C91520]">Toplam: {totalReviewCount}</span>
              </h2>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                {reviews.length === 0 && notes.length === 0 && epDiscussions.length === 0 && epReplies.length === 0 ? (
                  <p className="text-xs text-white/30 py-6 text-center">Henüz yorum yok.</p>
                ) : (
                  <>
                    {/* Dizi İncelemeleri */}
                    {reviews.map((r) => {
                      const reviewer = userMap.get(r.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || reviewer?.email || 'Kullanıcı';

                      return (
                        <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-white">@{reviewerUsername}</span>
                              <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                Dizi İncelemesi
                              </span>
                              {r.rating && (
                                <span className="text-[10px] font-black text-[#D4A017] bg-[#D4A017]/10 px-1.5 py-0.2 rounded">
                                  ★ {r.rating}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                              {r.content}
                            </p>
                          </div>

                          <form action={deleteReviewAction}>
                            <input type="hidden" name="reviewId" value={r.id} />
                            <input type="hidden" name="type" value="review" />
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Yorumu Sil"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </form>
                        </div>
                      );
                    })}

                    {/* Bölüm Yorumları */}
                    {epDiscussions.map((d) => {
                      const reviewer = userMap.get(d.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || reviewer?.email || 'Kullanıcı';

                      return (
                        <div key={d.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-white">@{reviewerUsername}</span>
                              <span className="text-[9.5px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                                S{d.season_number ?? 1} E{d.episode_number ?? 1} Bölüm Yorumu
                              </span>
                            </div>
                            <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                              {d.content}
                            </p>
                          </div>

                          <form action={deleteReviewAction}>
                            <input type="hidden" name="reviewId" value={d.id} />
                            <input type="hidden" name="type" value="episode" />
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Bölüm Yorumunu Sil"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </form>
                        </div>
                      );
                    })}

                    {/* Bölüm Yorum Yanıtları */}
                    {epReplies.map((rp) => {
                      const reviewer = userMap.get(rp.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || reviewer?.email || 'Kullanıcı';

                      return (
                        <div key={rp.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-white">@{reviewerUsername}</span>
                              <span className="text-[9.5px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                                Yorum Yanıtı
                              </span>
                            </div>
                            <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                              {rp.content}
                            </p>
                          </div>

                          <form action={deleteReviewAction}>
                            <input type="hidden" name="reviewId" value={rp.id} />
                            <input type="hidden" name="type" value="reply" />
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Yanıtı Sil"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </form>
                        </div>
                      );
                    })}

                    {/* Dizi Notları */}
                    {notes.map((n, idx) => {
                      const reviewer = userMap.get(n.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || reviewer?.email || 'Kullanıcı';

                      return (
                        <div key={n.id || `note-${idx}`} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-white">@{reviewerUsername}</span>
                              <span className="text-[9.5px] font-semibold text-white/40 bg-white/5 px-1.5 py-0.2 rounded">
                                {n.show_name || `Dizi #${n.show_id}`} (Not)
                              </span>
                            </div>
                            <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                              {n.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </section>

          </div>

        </main>
      </div>
    </ManagerPinAuth>
  );
}
