'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  targetUserId: string;
  initialFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    setLoading(true);
    if (following) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      if (!error) setFollowing(false);
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (!error) {
        setFollowing(true);
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
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
        following ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#E50914] text-white hover:bg-red-700'
      } disabled:opacity-40`}
    >
      {loading ? 'Bekle...' : following ? 'Takibi Bırak' : 'Takip Et'}
    </button>
  );
}
