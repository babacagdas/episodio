'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Status = 'watching' | 'completed' | 'dropped' | null;

const OPTIONS: { value: Status; label: string; icon: string; color: string }[] = [
  { value: 'watching', label: 'İzliyorum', icon: 'play_arrow', color: 'bg-[#C91520] border-[#C91520]' },
  { value: 'completed', label: 'Bitirdim', icon: 'check_circle', color: 'bg-green-600 border-green-600' },
  { value: 'dropped', label: 'Bıraktım', icon: 'cancel', color: 'bg-white/20 border-white/30' },
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
        className={`px-5 py-3 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 border ${
          current
            ? `${current.color} text-white`
            : 'bg-[#C91520] border-[#C91520] text-white hover:bg-[#A8121B]'
        } disabled:opacity-50`}
      >
        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
          {current?.icon ?? 'play_arrow'}
        </span>
        {current?.label ?? 'İzleme Durumu'}
        <span className="material-symbols-outlined text-base">expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[160px]">
            {OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWatchStatus(opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/5 ${
                  status === opt.value ? 'text-white' : 'text-white/60'
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: status === opt.value ? "'FILL' 1" : "'FILL' 0" }}>
                  {opt.icon}
                </span>
                {opt.label}
                {status === opt.value && <span className="ml-auto material-symbols-outlined text-base text-[#C91520]">check</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
