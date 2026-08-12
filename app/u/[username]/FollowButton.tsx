'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  targetUserId: string;
  initialFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);

  async function toggleFollow() {
    // ⚡ OPTIMISTIC UI: 0ms anında takip buton durumunu değiştir
    const previous = following;
    const nextState = !following;
    setFollowing(nextState);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFollowing(previous);
        window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      if (previous) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) setFollowing(previous);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) {
          setFollowing(previous);
        } else {
          const { data: actorProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          const actorUsername = actorProfile?.username ?? null;
          await supabase.from('notifications').insert({
            user_id: targetUserId,
            actor_id: user.id,
            type: 'follow',
            message: actorUsername ? `@${actorUsername} seni takip etmeye başladı.` : 'Seni takip etmeye başladı.',
            link: actorUsername ? `/u/${actorUsername}` : `/u/${user.id}`,
          });
        }
      }
    } catch {
      setFollowing(previous);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      className={`px-3.5 py-1.5 md:px-4 md:py-1.5 text-xs font-semibold rounded-full transition-all active:scale-95 ${
        following ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#C91520] text-white hover:bg-[#A8121B] shadow-[0_0_15px_rgba(201,21,32,0.3)]'
      }`}
    >
      {following ? 'Takibi Bırak' : 'Takip Et'}
    </button>
  );
}
