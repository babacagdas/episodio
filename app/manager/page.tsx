import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';

import ManagerPinAuth from './ManagerPinAuth';
import ManagerUserList from './ManagerUserList';

export const dynamic = 'force-dynamic';

type UserItem = {
  id: string;
  email?: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
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
  if (!reviewId) return;

  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  await db.from('reviews').delete().eq('id', reviewId);
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

  // 1. Supabase Auth ve Profiles Verilerini Çekme (Tam Kapsamlı)
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

  const [profilesRes, listsRes, reviewsRes, notesRes] = await Promise.all([
    db.from('profiles').select('id, username, full_name, avatar_url, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('lists').select('id, name, visibility, user_id, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('reviews').select('id, user_id, show_id, rating, content, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('show_notes').select('id, user_id, show_id, show_name, content, is_public, updated_at', { count: 'exact' }).order('updated_at', { ascending: false }),
  ]);

  const profilesList = (profilesRes.data ?? []) as UserItem[];
  const lists = (listsRes.data ?? []) as ListRow[];
  const reviews = (reviewsRes.data ?? []) as ReviewRow[];
  const notes = (notesRes.data ?? []) as ShowNoteRow[];

  // Auth Users + Profiles Tablosunu Birleştirme
  const userMap = new Map<string, UserItem>();

  authUsersList.forEach((u) => {
    userMap.set(u.id, {
      id: u.id,
      email: u.email ?? null,
      username: u.user_metadata?.username ?? (u.email ? u.email.split('@')[0] : null),
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
      avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
      created_at: u.created_at,
    });
  });

  profilesList.forEach((p) => {
    const existing = userMap.get(p.id);
    userMap.set(p.id, {
      id: p.id,
      email: existing?.email ?? null,
      username: p.username || existing?.username || null,
      full_name: p.full_name || existing?.full_name || null,
      avatar_url: p.avatar_url || existing?.avatar_url || null,
      created_at: p.created_at || existing?.created_at || null,
    });
  });

  const allUsers = Array.from(userMap.values());
  const totalUserCount = allUsers.length > 0 ? allUsers.length : (profilesRes.count ?? profilesList.length);
  const totalListCount = listsRes.count ?? lists.length;
  const totalReviewCount = (reviewsRes.count ?? 0) + (notesRes.count ?? 0);

  return (
    <ManagerPinAuth adminEmail={user.email || ''}>
      <div className="min-h-screen bg-[#070709] text-[#F4F6FA] select-none pb-20">
        
        {/* Header: Logo + Haftalık Analiz Butonu */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0E]/90 backdrop-blur-2xl px-4 md:px-10 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.png" alt="Episodio" className="h-7 w-auto object-contain pointer-events-none select-none" />
            </div>

            <Link
              href="/manager/analytics"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#C91520]/15 hover:bg-[#C91520]/25 px-4 py-1.5 text-xs font-bold text-white transition-all active:scale-95 shadow-[0_0_20px_rgba(201,21,32,0.25)]"
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Yönetim Paneli</h1>
            <p className="mt-1 text-xs sm:text-sm text-white/45">
              Episodio platformundaki canlı üye sayıları, içerik aktivitesi ve moderasyon araçları.
            </p>
          </div>

          {/* 1. Özet İstatistik Kartları (İzlenen Diziler Kaldırıldı, Canlı Veri Yazısı Kaldırıldı) */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Kayıtlı Üyeler" value={totalUserCount} icon="group" />
            <StatCard label="Oluşturulan Listeler" value={totalListCount} icon="format_list_bulleted" />
            <StatCard label="Yazılan Yorumlar & Notlar" value={totalReviewCount} icon="rate_review" />
          </section>

          {/* 2. Kayıtlı Üyeler Tablosu (Arama Çubuğu & Max 15 Satır Scroll Özellikli) */}
          <ManagerUserList users={allUsers} />

          {/* 3. İki Kolonlu Yapı: Son Listeler ve Son Yorumlar */}
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

            {/* Son Yorumlar & Notlar */}
            <section className="rounded-3xl border border-white/10 bg-[#0E0E14] p-5 sm:p-6 shadow-2xl flex flex-col">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="material-symbols-outlined text-[#C91520]">rate_review</span>
                Yazılan Yorumlar ({reviews.length})
              </h2>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                {reviews.length === 0 && notes.length === 0 ? (
                  <p className="text-xs text-white/30 py-6 text-center">Henüz yorum yok.</p>
                ) : (
                  <>
                    {reviews.map((r) => {
                      const reviewer = userMap.get(r.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || reviewer?.email || 'Kullanıcı';

                      return (
                        <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-white">@{reviewerUsername}</span>
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

                    {notes.map((n, idx) => {
                      const reviewer = userMap.get(n.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || reviewer?.email || 'Kullanıcı';

                      return (
                        <div key={n.id || `note-${idx}`} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-white">@{reviewerUsername}</span>
                              <span className="text-[10px] font-semibold text-white/40 bg-white/5 px-1.5 py-0.2 rounded">
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
