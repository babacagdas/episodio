'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ProfileSearchResult {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface CreateListModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (listId: string) => void;
}

export default function CreateListModal({ open, onClose, onSuccess }: CreateListModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<ProfileSearchResult[]>([]);
  const [invitedUser, setInvitedUser] = useState<ProfileSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  async function searchInvite(q: string) {
    setInviteQuery(q);
    if (!q.trim()) {
      setInviteResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data)) setInviteResults(data);
    } catch {
      setInviteResults([]);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError('Lütfen bir liste adı girin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        onClose();
        router.push('/signin?next=/profile?tab=lists');
        return;
      }

      // 1. Liste Oluştur
      const { data: newList, error: listError } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          visibility,
        })
        .select('id')
        .single();

      if (listError || !newList) {
        setError(listError?.message || 'Liste oluşturulurken bir hata oluştu.');
        setLoading(false);
        return;
      }

      // 2. Ortak davetli ekleme
      if (invitedUser) {
        await supabase.from('list_collaborators').insert({
          list_id: newList.id,
          user_id: invitedUser.id,
          role: 'editor',
        });
      }

      // Sıfırla ve kapat
      setName('');
      setDescription('');
      setVisibility('public');
      setInviteQuery('');
      setInviteResults([]);
      setInvitedUser(null);
      setLoading(false);
      onClose();

      window.dispatchEvent(new Event('episodio:list-created'));

      if (onSuccess) {
        onSuccess(newList.id);
      } else {
        router.push(`/list/${newList.id}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Bağlantı hatası oluştu.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 select-none">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-[380px] bg-[#0D0D0E]/95 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl backdrop-blur-xl animate-[chatScaleIn_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white tracking-wide">Yeni Liste Oluştur</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Input: Name */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-base pointer-events-none">format_list_bulleted</span>
          <input
            className="w-full bg-[#121216] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#16161c] focus:outline-none transition-all"
            placeholder="Liste adı (örn: En İyi Bilim Kurgu)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Textarea: Description */}
        <textarea
          className="w-full bg-[#121216] border border-white/10 rounded-2xl px-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:border-[#C91520] focus:ring-1 focus:ring-[#C91520]/50 focus:bg-[#16161c] focus:outline-none transition-all resize-none"
          placeholder="Kısa açıklama (opsiyonel)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Visibility Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              visibility === 'public'
                ? 'bg-[#C91520] text-white shadow-[0_2px_10px_rgba(201,21,32,0.4)]'
                : 'bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">public</span>
            Herkese Açık
          </button>

          <button
            type="button"
            onClick={() => setVisibility('private')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              visibility === 'private'
                ? 'bg-[#C91520] text-white shadow-[0_2px_10px_rgba(201,21,32,0.4)]'
                : 'bg-white/[0.05] text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Gizli
          </button>
        </div>

        {/* Invite Friend (Optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-white/40 font-medium">Ortak Liste Arkadaşı Davet Et (Opsiyonel):</label>
          {invitedUser ? (
            <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5">
              <span className="text-xs text-white font-medium">@{invitedUser.username || invitedUser.full_name}</span>
              <button type="button" onClick={() => setInvitedUser(null)} className="text-white/40 hover:text-white text-xs">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">person_add</span>
              <input
                className="w-full bg-[#121216] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none"
                placeholder="Kullanıcı adı ara..."
                value={inviteQuery}
                onChange={(e) => searchInvite(e.target.value)}
              />
              {inviteResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#121216] border border-white/10 rounded-xl max-h-32 overflow-y-auto z-20 shadow-xl">
                  {inviteResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setInvitedUser(u);
                        setInviteResults([]);
                        setInviteQuery('');
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-white/5 text-left text-xs text-white"
                    >
                      <span className="font-semibold">{u.full_name || u.username}</span>
                      <span className="text-white/40 text-[10px]">@{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-[#C91520]">{error}</p>}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="w-full py-3 rounded-xl bg-[#C91520] hover:bg-[#E21825] text-white text-xs font-bold transition-all shadow-[0_4px_20px_rgba(201,21,32,0.4)] disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 mt-1 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Liste Oluştur</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
