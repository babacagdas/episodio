'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface NotificationItem {
  id: string;
  message: string;
  link: string | null;
  actor_id: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
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
      .select('id, message, link, actor_id, type, is_read, created_at')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const baseItems = (data ?? []) as NotificationItem[];
    const actorIds = Array.from(
      new Set(baseItems.map((item) => item.actor_id).filter((value): value is string => !!value))
    );

    let actorMap: Record<string, NotificationItem['actor']> = {};
    if (actorIds.length > 0) {
      const { data: actorProfiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', actorIds);
      (actorProfiles ?? []).forEach((profile) => {
        actorMap[profile.id] = {
          username: profile.username ?? null,
          full_name: profile.full_name ?? null,
          avatar_url: profile.avatar_url ?? null,
        };
      });
    }

    setItems(
      baseItems.map((item) => ({
        ...item,
        actor: item.actor_id ? actorMap[item.actor_id] ?? null : null,
      }))
    );
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
        <div className="fixed top-16 left-3 right-3 max-h-[calc(100dvh-6rem)] overflow-y-auto bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-3 z-[120] md:absolute md:top-auto md:left-auto md:right-0 md:mt-2 md:w-[340px] md:max-h-[420px]">
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
                const actorProfilePath =
                  item.actor?.username
                    ? `/u/${item.actor.username}`
                    : item.actor_id
                      ? `/u/${item.actor_id}`
                      : null;
                const targetHref =
                  item.type === 'follow'
                    ? (actorProfilePath ?? item.link ?? '/home')
                    : (item.link ?? actorProfilePath ?? '/home');
                const content = (
                  <div className={`rounded-xl px-3 py-2 border ${item.is_read ? 'border-white/5 bg-white/[0.02]' : 'border-[#E50914]/30 bg-[#E50914]/10'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-[#1A1A1A] border border-white/10 flex items-center justify-center shrink-0">
                        {item.actor?.avatar_url ? (
                          <img src={item.actor.avatar_url} alt={item.actor.full_name ?? item.actor.username ?? 'Kullanıcı'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[15px] text-white/30">person</span>
                        )}
                      </div>
                      <p className="text-xs text-white/55 truncate">
                        {item.actor?.full_name || item.actor?.username || 'Kullanıcı'}
                      </p>
                    </div>
                    <p className="text-sm text-white/85 mt-1">{item.message}</p>
                    <p className="text-[11px] text-white/35 mt-1">{formatTimeAgo(item.created_at)} önce</p>
                  </div>
                );

                if (targetHref) {
                  return (
                    <Link key={item.id} href={targetHref} onClick={() => setOpen(false)}>
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
