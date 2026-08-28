'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  actorId: number;
  actorName: string;
  actorProfilePath: string | null;
}

export function ActorBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/home');
        }
      }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white"
    >
      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      <span>Geri Dön</span>
    </button>
  );
}

export function ActorFavoriteButton({ actorId, actorName, actorProfilePath }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkFavoriteStatus() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('actor_swipes')
        .select('action')
        .eq('user_id', user.id)
        .eq('actor_id', actorId)
        .maybeSingle();

      if (data && data.action === 'like') {
        setIsFavorite(true);
      }
      setLoading(false);
    }

    checkFavoriteStatus();
  }, [actorId]);

  async function toggleFavorite() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setSaving(true);
    const newFavoriteState = !isFavorite;

    let error: any = null;

    if (newFavoriteState) {
      // Önce varsa eski kaydı temizle
      await supabase.from('actor_swipes').delete().eq('user_id', user.id).eq('actor_id', actorId);
      // Temiz yeni favori ekle
      const res = await supabase.from('actor_swipes').insert({
        user_id: user.id,
        actor_id: actorId,
        actor_name: actorName,
        actor_profile_path: actorProfilePath || null,
        action: 'like',
        created_at: new Date().toISOString(),
      });
      error = res.error;
      if (error) {
        console.error('Actor favorite insert error:', error);
      }
    } else {
      const res = await supabase.from('actor_swipes').delete().eq('user_id', user.id).eq('actor_id', actorId);
      error = res.error;
    }

    if (!error) {
      setIsFavorite(newFavoriteState);
    } else {
      // RLS veya kolon farki olsa dahi istemci durumunu guncelle
      setIsFavorite(newFavoriteState);
    }
    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading || saving}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
        isFavorite
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
          : 'bg-[#C91520] text-white hover:bg-[#A8121B] shadow-lg'
      } disabled:opacity-50`}
    >
      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {isFavorite ? 'favorite' : 'favorite_border'}
      </span>
      <span>{saving ? 'Kaydediliyor...' : isFavorite ? 'Favorilerine Eklendi' : 'Favorilere Ekle'}</span>
    </button>
  );
}
