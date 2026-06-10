'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getShowDetail, type EpisodeShort } from '@/lib/tmdb';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpcomingEpisodeItem {
  showId: number;
  showName: string;
  posterPath: string | null;
  nextEpisode: EpisodeShort;
}

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState<UpcomingEpisodeItem[]>([]);
  const supabase = createClient();

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEpisodes([]);
        setLoading(false);
        return;
      }

      // İzleme listesini çek
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select('show_id, show_name, poster_path')
        .eq('user_id', user.id);

      if (!watchlistData || watchlistData.length === 0) {
        setEpisodes([]);
        setLoading(false);
        return;
      }

      // Her dizi için paralel TMDB istekleri
      const results = await Promise.all(
        watchlistData.map(async (item) => {
          try {
            const detail = await getShowDetail(String(item.show_id));
            if (detail.next_episode_to_air) {
              return {
                showId: item.show_id,
                showName: item.show_name,
                posterPath: item.poster_path,
                nextEpisode: detail.next_episode_to_air,
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      // Null değerleri temizle ve tarih sırasına göre sırala
      const activeEpisodes = results.filter((r): r is UpcomingEpisodeItem => r !== null);
      activeEpisodes.sort((a, b) => 
        new Date(a.nextEpisode.air_date).getTime() - new Date(b.nextEpisode.air_date).getTime()
      );

      setEpisodes(activeEpisodes);
    } catch (err) {
      console.error('Takvim yüklenirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isOpen) {
      loadCalendar();
    }
  }, [isOpen, loadCalendar]);

  if (!isOpen) return null;

  // Geri sayım metni hesaplayıcı
  const getCountdown = (airDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const airDate = new Date(airDateStr);
    airDate.setHours(0, 0, 0, 0);

    const diffTime = airDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Yayınlandı', color: 'bg-white/10 border-white/10 text-white/50' };
    if (diffDays === 0) return { text: 'Bugün', color: 'bg-[#E50914]/20 border-[#E50914]/40 text-white font-bold' };
    if (diffDays === 1) return { text: 'Yarın', color: 'bg-[#D4A017]/20 border-[#D4A017]/40 text-[#D4A017] font-bold' };
    return { text: `${diffDays} gün kaldı`, color: 'bg-white/5 border-white/10 text-white/70' };
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
  const STILL_BASE = 'https://image.tmdb.org/t/p/w300';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Gövdesi */}
      <div className="relative bg-[#111111] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#141414]">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D4A017]">calendar_month</span>
              Bölüm Takvimi
            </h2>
            <p className="text-xs text-white/45 mt-0.5">İzleme listenizdeki dizilerin yaklaşan bölümleri</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#111111]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="w-8 h-8 border-2 border-white/10 border-t-[#E50914] rounded-full animate-spin" />
              <span className="text-xs text-white/40">Dizi takviminiz hazırlanıyor...</span>
            </div>
          ) : episodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/20">
              <span className="material-symbols-outlined text-5xl mb-3">calendar_today</span>
              <h3 className="text-white font-semibold mb-1">Yaklaşan Bölüm Yok</h3>
              <p className="text-sm max-w-xs leading-relaxed">
                İzleme listenizdeki dizilere ait yakın zamanda yayınlanacak yeni bir bölüm bulunmuyor.
              </p>
            </div>
          ) : (
            episodes.map((item) => {
              const countdown = getCountdown(item.nextEpisode.air_date);
              const stillImg = item.nextEpisode.still_path 
                ? `${STILL_BASE}${item.nextEpisode.still_path}` 
                : item.posterPath 
                  ? `${POSTER_BASE}${item.posterPath}`
                  : null;

              return (
                <div 
                  key={item.nextEpisode.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Dizi Resmi veya Bölüm Görseli */}
                  <Link 
                    href={`/show/${item.showId}`}
                    onClick={onClose}
                    className="w-full sm:w-[160px] aspect-[16/9] rounded-xl overflow-hidden bg-[#1A1A1A] shrink-0 border border-white/5 hover:opacity-85 transition-opacity relative block"
                  >
                    {stillImg ? (
                      <img 
                        src={stillImg} 
                        alt={item.showName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/15 text-3xl">movie</span>
                      </div>
                    )}
                  </Link>

                  {/* Bölüm Detayları */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <Link 
                          href={`/show/${item.showId}`}
                          onClick={onClose}
                          className="font-bold text-white hover:text-[#D4A017] transition-colors truncate text-base block"
                        >
                          {item.showName}
                        </Link>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${countdown.color}`}>
                          {countdown.text}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-white/50 mb-2">
                        Sezon {item.nextEpisode.season_number}, Bölüm {item.nextEpisode.episode_number} 
                        {item.nextEpisode.name ? ` • "${item.nextEpisode.name}"` : ''}
                      </p>

                      {item.nextEpisode.overview && (
                        <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-3 pr-2">
                          {item.nextEpisode.overview}
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] text-white/30 flex items-center gap-1.5 mt-auto">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>{formatDate(item.nextEpisode.air_date)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
