import Link from 'next/link';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';

function formatTimeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} g önce`;
}

interface NotificationRow {
  id: string;
  message: string;
  link: string | null;
  actor_id: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

import TestNotificationButton from '@/components/TestNotificationButton';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin?next=/notifications');

  const { data: rows } = await supabase
    .from('notifications')
    .select('id, message, link, actor_id, type, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60);

  const notifications = (rows ?? []) as NotificationRow[];
  const actorIds = Array.from(new Set(notifications.map((item) => item.actor_id).filter((id): id is string => !!id)));
  const actorMap: Record<string, { username: string | null; full_name: string | null; avatar_url: string | null }> = {};

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', actorIds);
    (profiles ?? []).forEach((profile) => {
      actorMap[profile.id] = {
        username: profile.username ?? null,
        full_name: profile.full_name ?? null,
        avatar_url: profile.avatar_url ?? null,
      };
    });
  }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return (
    <div className="min-h-screen pb-24 md:pb-0 pt-[60px] md:pt-0">
      <MobileHeader />
      <Sidebar />
      <main className="md:ml-[240px] px-6 md:px-12 py-8 max-w-4xl">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="premium-kicker mb-2">Hesap</p>
            <h1 className="text-3xl font-bold text-white">Bildirimler</h1>
          </div>
          <TestNotificationButton />
        </div>

        {notifications.length === 0 ? (
          <div className="premium-panel-flat rounded-2xl p-8 text-sm text-white/45">
            Henüz bildirimin yok.
          </div>
        ) : (
          <div className="premium-panel-flat overflow-hidden rounded-2xl">
            {notifications.map((item) => {
              const actor = item.actor_id ? actorMap[item.actor_id] : null;
              const actorPath = actor?.username ? `/u/${actor.username}` : item.actor_id ? `/u/${item.actor_id}` : null;
              const href = item.type === 'follow' ? (actorPath ?? item.link ?? '/home') : (item.link ?? actorPath ?? '/home');
              const name = actor?.full_name || actor?.username || 'Kullanıcı';
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`flex gap-4 border-b border-white/[0.08] px-5 py-4 transition-colors last:border-b-0 hover:bg-white/[0.04] ${item.is_read ? 'opacity-75' : ''}`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
                    {actor?.avatar_url ? (
                      <img src={actor.avatar_url} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-white/35">person</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-white">{name}</p>
                      <span className="shrink-0 text-[11px] text-white/35">{formatTimeAgo(item.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">{item.message}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
