'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface NotificationItem {
  id: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function formatTimeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  return `${days} g`;
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const unreadCount = items.filter((item) => !item.is_read).length;

  async function loadNotifications() {
    setLoading(true);
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('notifications')
      .select('id, message, link, is_read, created_at')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setItems((data ?? []) as NotificationItem[]);
    setLoading(false);
  }

  async function markAllRead() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authData.user.id)
      .eq('is_read', false);

    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((prev) => !prev); if (!open) loadNotifications(); }}
        className="rounded-full p-3 hover:bg-white/5 transition-colors relative bg-transparent border border-transparent"
      >
        <span className="material-symbols-outlined text-white">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[#E50914] text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-h-[420px] overflow-y-auto bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-3 z-50">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <p className="text-sm font-semibold text-white">Bildirimler</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-[#D4A017] hover:text-white transition-colors"
              >
                Tümünü okundu yap
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-2 py-6 text-sm text-white/35 text-center">Henüz bildirimin yok.</div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const content = (
                  <div className={`rounded-xl px-3 py-2 border ${item.is_read ? 'border-white/5 bg-white/[0.02]' : 'border-[#E50914]/30 bg-[#E50914]/10'}`}>
                    <p className="text-sm text-white/85">{item.message}</p>
                    <p className="text-[11px] text-white/35 mt-1">{formatTimeAgo(item.created_at)} önce</p>
                  </div>
                );

                if (item.link) {
                  return (
                    <Link key={item.id} href={item.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  );
                }
                return <div key={item.id}>{content}</div>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
