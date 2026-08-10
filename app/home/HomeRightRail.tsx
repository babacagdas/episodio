import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FriendsActivitySection from './FriendsActivitySection';
import DeferredClientSection from './DeferredClientSection';

import WhatsAppInviteCard from './WhatsAppInviteCard';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

export default async function HomeRightRail() {
  const supabase = await createClient();

  const { data: lists } = await supabase
    .from('lists')
    .select('id, name, description')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(12);

  const listRows = (lists ?? []) as { id: string; name: string; description: string | null }[];
  const listIds = new Set(listRows.map((list) => list.id));
  const listIdArray = Array.from(listIds);

  const [{ data: items }, { data: likes }] = listIdArray.length > 0
    ? await Promise.all([
        supabase.from('list_items').select('list_id, poster_path').in('list_id', listIdArray),
        supabase.from('list_likes').select('list_id').in('list_id', listIdArray),
      ])
    : [{ data: [] }, { data: [] }];

  const postersByListId: Record<string, string | null> = {};
  const countsByListId: Record<string, number> = {};
  (items ?? []).forEach((row: { list_id: string; poster_path: string | null }) => {
    if (!listIds.has(row.list_id)) return;
    countsByListId[row.list_id] = (countsByListId[row.list_id] ?? 0) + 1;
    if (!postersByListId[row.list_id] && row.poster_path) {
      postersByListId[row.list_id] = row.poster_path;
    }
  });

  const likesByListId: Record<string, number> = {};
  (likes ?? []).forEach((row: { list_id: string }) => {
    if (!listIds.has(row.list_id)) return;
    likesByListId[row.list_id] = (likesByListId[row.list_id] ?? 0) + 1;
  });

  const popular = listRows
    .map((list) => ({
      ...list,
      itemCount: countsByListId[list.id] ?? 0,
      likeCount: likesByListId[list.id] ?? 0,
      poster: postersByListId[list.id] ?? null,
    }))
    .sort((a, b) => b.likeCount - a.likeCount || b.itemCount - a.itemCount)
    .slice(0, 4);
  const friendColors = ['#C91520', '#D4A017', '#22c55e', '#3b82f6'];

  return (
    <aside className="hidden w-[280px] shrink-0 select-none flex-col gap-5 xl:flex">
      <section className="rounded-2xl border border-white/[0.06] bg-transparent p-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <DeferredClientSection
          delay={450}
          fallback={
            <div>
              <div className="mb-4 h-5 w-28 rounded-full border border-white/[0.06]" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-7 rounded-lg border border-white/[0.05]" />
                ))}
              </div>
            </div>
          }
        >
          <FriendsActivitySection compact />
        </DeferredClientSection>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-transparent p-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <h2 className="mb-4 text-base font-bold uppercase tracking-wider text-white">Popüler Listeler</h2>

        {popular.length === 0 ? (
          <p className="text-[12.5px] text-white/40">Henüz popüler liste yok.</p>
        ) : (
          <div className="mb-4 space-y-4">
            {popular.map((list, index) => {
              const poster = list.poster ? `${POSTER_BASE}${list.poster}` : null;

              return (
                <Link
                  key={list.id}
                  href={`/list/${list.id}`}
                  className="group flex select-none items-start gap-3"
                >
                  <span className="w-4 shrink-0 pt-0.5 text-sm font-black text-white/35">
                    {index + 1}
                  </span>

                  <span className="flex h-12 w-9 shrink-0 overflow-hidden rounded border border-white/[0.08] bg-transparent shadow-sm">
                    {poster ? (
                      <img src={poster} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="material-symbols-outlined flex h-full w-full items-center justify-center text-base text-white/10">movie</span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1 pt-0.5 leading-snug">
                    <span className="block truncate text-[13px] font-bold text-white transition-colors group-hover:text-[#C91520]">
                      {list.name}
                    </span>
                    <span className="text-[10.5px] font-bold text-white/35">
                      {list.likeCount} kaydetme
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <Link
          href="/search"
          className="inline-flex pt-1 text-[11px] font-bold uppercase tracking-wider text-[#C91520] transition-colors hover:text-white"
        >
          Tüm popüler listeleri gör &gt;
        </Link>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-transparent p-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
        <h2 className="mb-4 text-base font-bold uppercase tracking-wider text-white">Arkadaşlarını Takip Et</h2>

        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center -space-x-2">
            {friendColors.map((color, index) => {
              return (
                <div
                  key={index}
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-[#07080b] shadow-md"
                  style={{ zIndex: 10 - index, backgroundColor: color }}
                />
              );
            })}
          </div>

          <Link
            href="/search"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-transparent text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04]"
            aria-label="Arkadaş bul"
          >
            <span className="material-symbols-outlined text-[17px] font-bold">add</span>
          </Link>
        </div>

        <p className="mb-4 text-[11.5px] font-semibold leading-relaxed text-white/40">
          Daha fazla arkadaşını takip et, listelerini ve önerilerini gör.
        </p>

        <Link
          href="/search"
          className="inline-flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-transparent px-3.5 py-2.5 text-[12px] font-bold text-white transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98]"
        >
          <span>Arkadaşlarını Bul</span>
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </Link>
      </section>

      {/* WhatsApp Davet Kartı */}
      <WhatsAppInviteCard />
    </aside>
  );
}
