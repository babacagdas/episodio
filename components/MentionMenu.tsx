'use client';

import type { RefObject } from 'react';

export interface MentionUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export default function MentionMenu({
  open,
  anchorRef,
  items,
  onPick,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement>;
  items: MentionUser[];
  onPick: (user: MentionUser) => void;
}) {
  if (!open || items.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-40">
      <div className="rounded-2xl border border-white/10 bg-black shadow-2xl overflow-hidden">
        <div className="max-h-[132px] overflow-y-auto">
          {items.map((u) => {
            const label = u.full_name || u.username || 'Kullanıcı';
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => onPick(u)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] border-b border-[#E50914]/35 last:border-b-0"
              >
                <div className="w-8 h-8 rounded-full bg-[#0f0f0f] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-white/25 text-sm">person</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-semibold truncate">{label}</p>
                  <p className="text-xs text-white/35 truncate">@{u.username ?? u.id.slice(0, 8)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

