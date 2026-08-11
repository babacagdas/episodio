import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';

import ManagerPinAuth from './ManagerPinAuth';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
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

  // Veritabanından Doğrudan Veri Çekme (FK İlişki Bağımlılığı Olmadan)
  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  const [profilesRes, listsRes, reviewsRes, notesRes, watchRes] = await Promise.all([
    db.from('profiles').select('id, username, full_name, avatar_url, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('lists').select('id, name, visibility, user_id, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('reviews').select('id, user_id, show_id, rating, content, created_at', { count: 'exact' }).order('created_at', { ascending: false }),
    db.from('show_notes').select('id, user_id, show_id, show_name, content, is_public, updated_at', { count: 'exact' }).order('updated_at', { ascending: false }),
    db.from('watch_status').select('id', { count: 'exact', head: true }),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const lists = (listsRes.data ?? []) as ListRow[];
  const reviews = (reviewsRes.data ?? []) as ReviewRow[];
  const notes = (notesRes.data ?? []) as ShowNoteRow[];

  const totalUserCount = profilesRes.count ?? profiles.length;
  const totalListCount = listsRes.count ?? lists.length;
  const totalReviewCount = (reviewsRes.count ?? 0) + (notesRes.count ?? 0);
  const totalWatchCount = watchRes.count ?? 0;

  // Hızlı profil arama haritası (Map lookup)
  const profileMap = new Map<string, ProfileRow>();
  profiles.forEach((p) => profileMap.set(p.id, p));

  return (
    <ManagerPinAuth adminEmail={user.email || ''}>
      <div className="min-h-screen bg-[#070709] text-[#F4F6FA] select-none pb-20">
        
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0E]/90 backdrop-blur-2xl px-4 md:px-10 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/home" aria-label="Episodio Ana Sayfa">
                <img src="/logo.png" alt="Episodio" className="h-7 w-auto object-contain" />
              </Link>
              <span className="rounded-full bg-[#C91520]/20 border border-[#C91520]/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#C91520]">
                Manager Panel
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Yönetici: <strong className="text-white">{user.email}</strong></span>
              </div>

              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-base">home</span>
                <span className="hidden sm:inline">Siteye Dön</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="mx-auto max-w-7xl px-4 md:px-10 pt-8 space-y-10">

          {/* Başlık */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Yönetim Paneli & Canlı İstatistikler</h1>
            <p className="mt-1 text-xs sm:text-sm text-white/45">
              Episodio platformundaki canlı üye sayıları, içerik aktivitesi ve moderasyon araçları.
            </p>
          </div>

          {/* 1. Özet İstatistik Kartları (Canlı Canlı Tüm Veriler) */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Kayıtlı Üyeler" value={totalUserCount} icon="group" badge="Canlı Veri" />
            <StatCard label="İzlenen Diziler" value={totalWatchCount} icon="visibility" />
            <StatCard label="Oluşturulan Listeler" value={totalListCount} icon="format_list_bulleted" />
            <StatCard label="Yazılan Yorumlar & Notlar" value={totalReviewCount} icon="rate_review" />
          </section>

          {/* 2. Kayıtlı Üyeler Tablosu (Kimler Üye Olmuş?) */}
          <section className="rounded-3xl border border-white/10 bg-[#0E0E14] p-5 sm:p-6 shadow-2xl">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C91520]">person</span>
                  Kayıtlı Kullanıcılar ({profiles.length})
                </h2>
                <p className="text-xs text-white/40 mt-0.5">Platforma en son katılan üyeler ve profilleri</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Kullanıcı</th>
                    <th className="py-3 px-3">Kullanıcı Adı</th>
                    <th className="py-3 px-3">Kayıt Tarihi</th>
                    <th className="py-3 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profiles.map((p) => {
                    const name = p.full_name || p.username || 'Kullanıcı';
                    const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Bilinmiyor';

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-white/30 text-sm">person</span>
                              )}
                            </div>
                            <span className="font-semibold text-white truncate max-w-[160px] sm:max-w-[220px]">{name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-white/60 font-medium">
                          @{p.username || p.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-3 text-white/40">
                          {dateStr}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/u/${p.username || p.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                          >
                            <span>Profili Gör</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

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
                    const creator = profileMap.get(l.user_id);
                    const creatorUsername = creator?.username || creator?.full_name || 'Kullanıcı';

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
                      const reviewer = profileMap.get(r.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || 'Kullanıcı';

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
                      const reviewer = profileMap.get(n.user_id);
                      const reviewerUsername = reviewer?.username || reviewer?.full_name || 'Kullanıcı';

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
