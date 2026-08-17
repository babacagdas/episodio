'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLists } from '@/lib/useLists';
import { createClient } from '@/lib/supabase/client';

interface Props {
  show: {
    id: number;
    name: string;
    poster_path: string | null;
  };
}

export default function AddToListButton({ show }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { lists, loading, addShowToList } = useLists();

  async function handleAdd(listId: string) {
    setMessage('');
    const result = await addShowToList({
      listId,
      showId: show.id,
      showName: show.name,
      posterPath: show.poster_path,
    });
    setMessage(result.ok ? 'Listeye eklendi.' : `Eklenemedi: ${result.message}`);
  }

  async function openModal() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 border backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-white/90 hover:text-white"
      >
        <span className="material-symbols-outlined text-base">playlist_add</span>
        <span>Listeye Ekle</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-[380px] rounded-3xl p-6 bg-[#0D0D0E]/95 border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Listeye Ekle</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="w-5 h-5 border-2 border-white/20 border-t-[#C91520] rounded-full animate-spin" />
              </div>
            ) : lists.length === 0 ? (
              <div className="text-xs text-white/40 py-6 text-center">
                Henüz listen yok.{' '}
                <Link href="/profile" className="text-[#C91520] hover:text-white font-semibold transition-colors" onClick={() => setOpen(false)}>
                  Profilden liste oluştur.
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => handleAdd(list.id)}
                    className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-4 py-3 transition-all"
                  >
                    <p className="text-xs font-bold text-white">{list.name}</p>
                    {list.description && <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{list.description}</p>}
                  </button>
                ))}
              </div>
            )}

            {message && <p className="text-xs font-medium text-[#D4A017] mt-3 text-center">{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}
