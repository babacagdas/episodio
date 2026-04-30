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
      window.location.href = '/signin';
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="px-6 py-2.5 border font-semibold text-sm rounded-full transition-all flex items-center gap-2 backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <span className="material-symbols-outlined text-lg">playlist_add</span>
        Listeye Ekle
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-5 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Listeye Ekle</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : lists.length === 0 ? (
              <div className="text-sm text-white/40 py-6 text-center">
                Henüz listen yok.{' '}
                <Link href="/profile" className="text-[#E50914] hover:text-white transition-colors" onClick={() => setOpen(false)}>
                  Profilden liste oluştur.
                </Link>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => handleAdd(list.id)}
                    className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-4 py-3 transition-colors"
                  >
                    <p className="text-sm font-semibold text-white">{list.name}</p>
                    {list.description && <p className="text-xs text-white/40 mt-1 line-clamp-1">{list.description}</p>}
                  </button>
                ))}
              </div>
            )}

            {message && <p className="text-xs text-[#D4A017] mt-3">{message}</p>}
          </div>
        </div>
      )}
    </>
  );
}
