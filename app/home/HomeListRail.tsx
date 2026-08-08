import ListPreviewCard from '@/components/ListPreviewCard';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function HomeListRail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: follows } = user
    ? await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    : { data: [] };

  const followingIds = (follows ?? []).map((follow) => follow.following_id);

  if (followingIds.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-white">Arkadaşlarının Listeleri</h2>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-transparent p-5 sm:p-6">
          <p className="text-sm font-semibold leading-relaxed text-white/45">
            Listelerini görmek için bir arkadaş ekle.
          </p>
          <Link
            href="/search"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-[#C91520] transition-colors hover:text-white"
          >
            Arkadaş bul
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </Link>
        </div>
      </section>
    );
  }

  const { data: lists } = await supabase
    .from('lists')
    .select('id, name, description, visibility, user_id')
    .eq('visibility', 'public')
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(8);

  const listRows = (lists ?? []) as any[];

  if (listRows.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-white">Arkadaşlarının Listeleri</h2>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-transparent p-5 sm:p-6 text-sm font-semibold leading-relaxed text-white/45">
          Takip ettiğin arkadaşların henüz liste paylaşmadı.
        </div>
      </section>
    );
  }

  const creatorIds = Array.from(new Set(listRows.map((l) => l.user_id)));
  const listIdArray = listRows.map((list) => list.id);
  const [{ data: creatorsRes }, { data: items }, { data: likes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', creatorIds),
    supabase.from('list_items').select('list_id, poster_path').in('list_id', listIdArray),
    supabase.from('list_likes').select('list_id').in('list_id', listIdArray),
  ]);

  const creatorsMap = new Map((creatorsRes || []).map((c) => [c.id, c]));

  const listIds = new Set(listRows.map((list) => list.id));
  const postersByListId: Record<string, string[]> = {};
  const countsByListId: Record<string, number> = {};
  (items ?? []).forEach((row: { list_id: string; poster_path: string | null }) => {
    if (!listIds.has(row.list_id)) return;
    countsByListId[row.list_id] = (countsByListId[row.list_id] ?? 0) + 1;
    if (!postersByListId[row.list_id]) postersByListId[row.list_id] = [];
    if (row.poster_path && postersByListId[row.list_id].length < 4) {
      postersByListId[row.list_id].push(row.poster_path);
    }
  });

  const likesByListId: Record<string, number> = {};
  (likes ?? []).forEach((row: { list_id: string }) => {
    if (!listIds.has(row.list_id)) return;
    likesByListId[row.list_id] = (likesByListId[row.list_id] ?? 0) + 1;
  });

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Arkadaşlarının Listeleri</h2>
        <Link href="/search" className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#C91520] transition-colors hover:text-white">
          Tümünü Gör
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {listRows.slice(0, 4).map((list) => {
          const creator = creatorsMap.get(list.user_id);
          return (
            <ListPreviewCard
              key={list.id}
              id={list.id}
              name={list.name}
              description={list.description}
              visibility={list.visibility}
              posters={postersByListId[list.id] ?? []}
              itemCount={countsByListId[list.id] ?? 0}
              likeCount={likesByListId[list.id] ?? 0}
              creatorName={creator?.full_name || creator?.username || 'Kullanıcı'}
              creatorAvatar={creator?.avatar_url || null}
            />
          );
        })}
      </div>
    </section>
  );
}
