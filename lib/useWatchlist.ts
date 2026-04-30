'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface WatchlistItem {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Supabase'den çek
        const { data } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false });

        if (data) {
          setWatchlist(data.map(r => ({
            id: r.show_id,
            name: r.show_name,
            poster_path: r.poster_path,
            vote_average: r.vote_average,
            first_air_date: r.first_air_date,
          })));
        }
      } else {
        // Giriş yoksa localStorage
        try {
          const stored = localStorage.getItem('episodio_watchlist');
          if (stored) setWatchlist(JSON.parse(stored));
        } catch {}
      }
      setLoading(false);
    }

    load();
  }, []);

  const toggle = useCallback(async (item: WatchlistItem) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const exists = watchlist.some(i => i.id === item.id);

    if (user) {
      if (exists) {
        await supabase.from('watchlist').delete().eq('user_id', user.id).eq('show_id', item.id);
      } else {
        await supabase.from('watchlist').insert({
          user_id: user.id,
          show_id: item.id,
          show_name: item.name,
          poster_path: item.poster_path,
          vote_average: item.vote_average,
          first_air_date: item.first_air_date,
        });
      }
    } else {
      // localStorage fallback
      const next = exists ? watchlist.filter(i => i.id !== item.id) : [...watchlist, item];
      localStorage.setItem('episodio_watchlist', JSON.stringify(next));
    }

    setWatchlist(prev =>
      exists ? prev.filter(i => i.id !== item.id) : [...prev, item]
    );
  }, [watchlist]);

  const isInWatchlist = useCallback((id: number) => {
    return watchlist.some(i => i.id === id);
  }, [watchlist]);

  return { watchlist, loading, toggle, isInWatchlist };
}
