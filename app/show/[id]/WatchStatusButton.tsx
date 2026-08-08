'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Status = 'watching' | 'completed' | 'dropped' | null;

const OPTIONS: { value: Status; label: string; icon: string; color: string }[] = [
  { value: 'watching', label: 'İzliyorum', icon: 'play_arrow', color: 'bg-[#C91520] border-[#C91520] text-white shadow-[0_0_15px_rgba(201,21,32,0.4)]' },
  { value: 'completed', label: 'Bitirdim', icon: 'check_circle', color: 'bg-emerald-600/90 border-emerald-500 text-white' },
  { value: 'dropped', label: 'Bıraktım', icon: 'cancel', color: 'bg-white/10 border-white/20 text-white/80' },
];

export default function WatchStatusButton({ showId, showName, posterPath }: {
  showId: number;
  showName: string;
  posterPath: string | null;
}) {
  const [status, setStatus] = useState<Status>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      const { data: row } = await supabase
        .from('watch_status')
        .select('status')
        .eq('user_id', data.user.id)
        .eq('show_id', showId)
        .maybeSingle();
      setStatus((row?.status as Status) ?? null);
      setLoading(false);
    });
  }, [showId]);

  async function setWatchStatus(newStatus: Status) {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`; return; }

    if (newStatus === status) {
      await supabase.from('watch_status').delete()
        .eq('user_id', authData.user.id).eq('show_id', showId);
      setStatus(null);
    } else {
      await supabase.from('watch_status').upsert({
        user_id: authData.user.id,
        show_id: showId,
        show_name: showName,
        poster_path: posterPath,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,show_id' });
      setStatus(newStatus);
    }
    setOpen(false);
  }

  const current = OPTIONS.find(o => o.value === status);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(prev => !prev)}
        disabled={loading}
        className={`px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 border backdrop-blur-md ${
          current
            ? `${current.color}`
            : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-white'
        } disabled:opacity-50`}
      >
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          {current?.icon ?? 'play_arrow'}
        </span>
        <span>{current?.label ?? 'İzleme Durumu'}</span>
        <span className="material-symbols-outlined text-sm opacity-60 ml-0.5">expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-[#0A0A0D] border border-white/10 rounded-2xl p-1 shadow-2xl min-w-[160px] backdrop-blur-xl">
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWatchStatus(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                  status === opt.value ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: status === opt.value ? "'FILL' 1" : "'FILL' 0" }}>
                  {opt.icon}
                </span>
                <span>{opt.label}</span>
                {status === opt.value && <span className="ml-auto material-symbols-outlined text-sm text-[#C91520]">check</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
