import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';

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

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user,
    allowed: isAdminEmail(user?.email),
  };
}

async function deleteListAction(formData: FormData) {
  'use server';

  const { allowed } = await requireAdmin();
  if (!allowed) return;

  const listId = String(formData.get('listId') ?? '');
  if (!listId) return;

  const admin = createAdminClient();
  if (!admin) return;

  await admin.from('lists').delete().eq('id', listId);
  revalidatePath('/admin');
}

async function deleteReviewAction(formData: FormData) {
  'use server';

  const { allowed } = await requireAdmin();
  if (!allowed) return;

  const reviewId = String(formData.get('reviewId') ?? '');
  if (!reviewId) return;

  const admin = createAdminClient();
  if (!admin) return;

  await admin.from('reviews').delete().eq('id', reviewId);
  revalidatePath('/admin');
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#C91520]/12 text-[#C91520]">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <p className="text-3xl font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/38">{label}</p>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-5 text-sm font-semibold text-white/42">
      {children}
    </div>
  );
}

export default async function AdminPage() {
  const { user, allowed } = await requireAdmin();

  if (!user) {
    return (
      <main className="min-h-screen bg-[#070707] px-6 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <h1 className="text-2xl font-black">Admin Panel</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50">Yönetim paneline erişmek için giriş yapmalısın.</p>
          <Link href="/signin?next=/admin" className="mt-5 inline-flex rounded-xl bg-[#C91520] px-4 py-2.5 text-sm font-bold text-white">
            Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#070707] px-6 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <h1 className="text-2xl font-black">Erişim Yok</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Bu panel sadece uygulama sahibi hesaplara açıktır. Vercel ortam değişkenlerinde
            <span className="font-bold text-white"> ADMIN_EMAILS</span> değerine kendi e-postanı ekle.
          </p>
          <p className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-xs text-white/45">
            Giriş yapan hesap: <span className="text-white">{user.email}</span>
          </p>
        </div>
      </main>
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return (
      <main className="min-h-screen bg-[#070707] px-6 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <h1 className="text-2xl font-black">Admin Kurulumu Eksik</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Verileri yönetebilmek için Vercel ortam değişkenlerine <span className="font-bold text-white">SUPABASE_SERVICE_ROLE_KEY</span> eklenmeli.
          </p>
        </div>
      </main>
    );
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const todayFormatted = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const [
    // Toplam Sayılar
    profilesCount,
    listsCount,
    reviewsCount,
    followsCount,
    messagesCount,
    watchingCount,

    // Son 24 Saat Günlük Sayılar
    dailyProfilesCount,
    dailyListsCount,
    dailyReviewsCount,
    dailyFollowsCount,
    dailyMessagesCount,
    dailyWatchingCount,

    // Son Liste & Kullanıcılar
    profilesRes,
    listsRes,
    reviewsRes,
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('lists').select('*', { count: 'exact', head: true }),
    admin.from('reviews').select('*', { count: 'exact', head: true }),
    admin.from('follows').select('*', { count: 'exact', head: true }),
    admin.from('direct_messages').select('*', { count: 'exact', head: true }),
    admin.from('watch_status').select('*', { count: 'exact', head: true }),

    // 24 Saat Filtreli
    admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
    admin.from('lists').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
    admin.from('reviews').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
    admin.from('follows').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
    admin.from('direct_messages').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
    admin.from('watch_status').select('*', { count: 'exact', head: true }).gte('updated_at', last24h),

    admin.from('profiles').select('id, username, full_name, avatar_url, created_at').order('created_at', { ascending: false }).limit(8),
    admin.from('lists').select('id, name, visibility, user_id, created_at').order('created_at', { ascending: false }).limit(8),
    admin.from('reviews').select('id, user_id, show_id, rating, content, created_at').order('created_at', { ascending: false }).limit(8),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const lists = (listsRes.data ?? []) as ListRow[];
  const reviews = (reviewsRes.data ?? []) as ReviewRow[];

  return (
    <main className="min-h-screen bg-[#070707] px-5 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-[1380px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.08] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/home" className="mb-5 inline-flex text-sm font-bold text-white/45 transition-colors hover:text-white">
              ← Uygulamaya dön
            </Link>
            <h1 className="text-4xl font-black leading-none tracking-normal">Admin Panel</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/48">
              Kullanıcıları, listeleri, yorumları ve canlı platform metriklerini gerçek zamanlı takip edebilirsiniz.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-xs font-semibold text-white/45">
            Yetkili hesap: <span className="text-white">{user.email}</span>
          </div>
        </div>

        {/* 1. TOPLAM İSTATİSTİKLER */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Genel Toplam İstatistikler</h2>
        </div>
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
          <StatCard label="Kullanıcı" value={profilesCount.count ?? 0} icon="group" />
          <StatCard label="Liste" value={listsCount.count ?? 0} icon="featured_play_list" />
          <StatCard label="Yorum" value={reviewsCount.count ?? 0} icon="reviews" />
          <StatCard label="Takip" value={followsCount.count ?? 0} icon="person_add" />
          <StatCard label="Mesaj" value={messagesCount.count ?? 0} icon="chat" />
          <StatCard label="İzleme Kaydı" value={watchingCount.count ?? 0} icon="play_circle" />
        </section>

        {/* 2. GÜNLÜK İSTATİSTİK BANNER'I (SON 24 SAAT - OTOMATİK TARİHLİ) */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#141018] via-[#12121C] to-[#0A0A10] p-5 shadow-2xl relative">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#C91520]/10 blur-3xl" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Son 24 Saat Günlük İstatistikleri
              </h3>
            </div>
            <div className="text-xs font-bold text-white/45 bg-white/5 px-3 py-1 rounded-full border border-white/10 self-start sm:self-auto">
              📅 {todayFormatted} (Canlı)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <span className="text-xs font-semibold text-white/40 block mb-1">Yeni Kullanıcı</span>
              <span className="text-xl font-black text-emerald-400">+{dailyProfilesCount.count ?? 0}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <span className="text-xs font-semibold text-white/40 block mb-1">Yeni Liste</span>
              <span className="text-xl font-black text-sky-400">+{dailyListsCount.count ?? 0}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <span className="text-xs font-semibold text-white/40 block mb-1">Yeni Yorum</span>
              <span className="text-xl font-black text-purple-400">+{dailyReviewsCount.count ?? 0}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <span className="text-xs font-semibold text-white/40 block mb-1">Yeni Takip</span>
              <span className="text-xl font-black text-amber-400">+{dailyFollowsCount.count ?? 0}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <span className="text-xs font-semibold text-white/40 block mb-1">Yeni Mesaj</span>
              <span className="text-xl font-black text-pink-400">+{dailyMessagesCount.count ?? 0}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <span className="text-xs font-semibold text-white/40 block mb-1">İzleme Aktivitesi</span>
              <span className="text-xl font-black text-[#C91520]">+{dailyWatchingCount.count ?? 0}</span>
            </div>
          </div>
        </section>

        {/* 3. SON AKTİVİTELER GRID */}
        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
            <h2 className="mb-4 text-lg font-black">Son Kaydolan Kullanıcılar</h2>
            {profiles.length === 0 ? (
              <EmptyState>Kullanıcı bulunamadı.</EmptyState>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <Link key={profile.id} href={profile.username ? `/u/${profile.username}` : '/admin'} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/20 p-3 transition-colors hover:bg-white/[0.035]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                      {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-white/35">person</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">{profile.full_name || profile.username || 'İsimsiz kullanıcı'}</span>
                      <span className="block truncate text-xs text-white/38">@{profile.username || profile.id.slice(0, 8)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
            <h2 className="mb-4 text-lg font-black">Son Oluşturulan Listeler</h2>
            {lists.length === 0 ? (
              <EmptyState>Liste bulunamadı.</EmptyState>
            ) : (
              <div className="space-y-3">
                {lists.map((list) => (
                  <div key={list.id} className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/list/${list.id}`} className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white transition-colors hover:text-[#C91520]">{list.name}</span>
                        <span className="block text-xs text-white/38">{list.visibility || 'private'} • {list.user_id.slice(0, 8)}</span>
                      </Link>
                      <form action={deleteListAction}>
                        <input type="hidden" name="listId" value={list.id} />
                        <button className="rounded-lg border border-[#C91520]/25 bg-[#C91520]/10 px-2.5 py-1 text-[11px] font-bold text-[#F06A73] transition-colors hover:bg-[#C91520]/20">
                          Kaldır
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
            <h2 className="mb-4 text-lg font-black">Son Yazılan Yorumlar</h2>
            {reviews.length === 0 ? (
              <EmptyState>Yorum bulunamadı.</EmptyState>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/show/${review.show_id}`} className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white transition-colors hover:text-[#C91520]">Dizi #{review.show_id}</span>
                        <span className="block text-xs text-white/38">Puan: {review.rating ?? '-'} • {review.user_id.slice(0, 8)}</span>
                      </Link>
                      <form action={deleteReviewAction}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <button className="rounded-lg border border-[#C91520]/25 bg-[#C91520]/10 px-2.5 py-1 text-[11px] font-bold text-[#F06A73] transition-colors hover:bg-[#C91520]/20">
                          Kaldır
                        </button>
                      </form>
                    </div>
                    {review.content ? <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">{review.content}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
