'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ShareListButton from './ShareListButton';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

interface ListItemData {
  show_id: number;
  show_name: string;
  poster_path: string | null;
}

interface Props {
  listId: string;
  initialName: string;
  initialDescription: string | null;
  visibility: 'public' | 'private';
  ownerName: string;
  isOwner: boolean;
  initialItems: ListItemData[];
  initialLikesCount: number;
  initiallyLiked: boolean;
}

export default function ListDetailClient({
  listId,
  initialName,
  initialDescription,
  visibility,
  ownerName,
  isOwner,
  initialItems,
  initialLikesCount,
  initiallyLiked,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ListItemData[]>(initialItems);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likedByMe, setLikedByMe] = useState(initiallyLiked);
  const [message, setMessage] = useState('');

  const itemCountText = useMemo(() => `${items.length} dizi • ${ownerName}`, [items.length, ownerName]);

  async function removeItem(showId: number) {
    const supabase = createClient();
    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('list_id', listId)
      .eq('show_id', showId);

    if (error) {
      setMessage(`Kaldırılamadı: ${error.message}`);
      return;
    }

    setItems((prev) => prev.filter((item) => item.show_id !== showId));
  }

  async function saveListMeta() {
    if (!name.trim()) {
      setMessage('Liste adı boş olamaz.');
      return;
    }
    setSaving(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase
      .from('lists')
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq('id', listId);

    if (error) {
      setMessage(`Kaydedilemedi: ${error.message}`);
      setSaving(false);
      return;
    }

    setEditing(false);
    setSaving(false);
    setMessage('Liste güncellendi.');
    setTimeout(() => setMessage(''), 2000);
    router.refresh();
  }

  async function deleteList() {
    const confirmed = window.confirm('Listeyi silmek istediğine emin misin? Bu işlem geri alınamaz.');
    if (!confirmed) return;

    setDeleting(true);
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.from('lists').delete().eq('id', listId);

    if (error) {
      setMessage(`Liste silinemedi: ${error.message}`);
      setDeleting(false);
      return;
    }

    router.push('/profile');
    router.refresh();
  }

  async function toggleLike() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    setLikeLoading(true);
    if (likedByMe) {
      const { error } = await supabase
        .from('list_likes')
        .delete()
        .eq('list_id', listId)
        .eq('user_id', user.id);
      if (!error) {
        setLikedByMe(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
      setLikeLoading(false);
      return;
    }

    const { error } = await supabase.from('list_likes').insert({
      list_id: listId,
      user_id: user.id,
    });
    if (!error) {
      setLikedByMe(true);
      setLikesCount((prev) => prev + 1);
    }
    setLikeLoading(false);
  }

  return (
    <>
      <section className="mb-8">
        <div className="flex flex-col gap-3">
          <div className="flex-1">
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-2">
              {visibility === 'public' ? 'Public Liste' : 'Private Liste'}
            </p>

            {editing ? (
              <div className="space-y-3 max-w-xl">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors"
                  placeholder="Liste adı"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none transition-colors resize-none"
                  placeholder="Açıklama (opsiyonel)"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveListMeta}
                    disabled={saving}
                    className="px-4 py-2 rounded-full bg-[#E50914] text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setName(initialName); setDescription(initialDescription ?? ''); }}
                    className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-2">{name}</h1>
                {description && <p className="text-sm text-white/55 max-w-3xl">{description}</p>}
                <p className="text-xs text-white/35 mt-3">{itemCountText}</p>
              </>
            )}

            {message && <p className="text-xs text-[#D4A017] mt-3">{message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <ShareListButton title={name} />
            <button
              type="button"
              onClick={toggleLike}
              disabled={likeLoading}
              className={`h-8 px-2.5 rounded-full border flex items-center gap-1 transition-colors ${
                likedByMe
                  ? 'bg-[#E50914]/20 border-[#E50914]/60 text-[#FFB3B8]'
                  : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
              } disabled:opacity-50`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: likedByMe ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              <span className="text-xs font-semibold">{likesCount}</span>
            </button>
            {isOwner && !editing && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Düzenle"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button
                  type="button"
                  onClick={deleteList}
                  disabled={deleting}
                  className="w-8 h-8 rounded-full bg-[#E50914]/20 border border-[#E50914]/50 text-[#FFB3B8] flex items-center justify-center hover:bg-[#E50914]/30 transition-colors disabled:opacity-50"
                  title="Sil"
                >
                  {deleting
                    ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-sm">delete</span>
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/20">
          <span className="material-symbols-outlined text-5xl mb-3">playlist_play</span>
          <p className="text-sm">Bu listede henüz dizi yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => {
            const poster = item.poster_path ? `${POSTER_BASE}${item.poster_path}` : null;
            return (
              <div key={`${listId}-${item.show_id}`} className="relative">
                <Link
                  href={`/show/${item.show_id}`}
                  className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 hover:scale-[1.02] transition-all duration-300 block"
                >
                  {poster
                    ? <img alt={item.show_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={poster} />
                    : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-full p-3">
                    <h3 className="text-xs font-semibold text-white truncate">{item.show_name}</h3>
                  </div>
                </Link>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.show_id)}
                    className="absolute top-2 right-2 z-10 bg-black/70 border border-white/20 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-[#E50914]/70 hover:border-[#E50914] transition-colors"
                    title="Listeden kaldır"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
