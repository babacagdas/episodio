'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface UserReviewsModalProps {
  userId: string;
  username: string;
  avatarUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CombinedReviewItem {
  id: string;
  type: 'show_review' | 'episode_comment';
  show_id: number | string;
  show_name: string;
  poster_path: string;
  rating?: number | null;
  season_number?: number;
  episode_number?: number;
  content: string;
  created_at: string;
}

function formatPosterUrl(path: string | null | undefined): string {
  if (!path || path.trim() === '') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `https://image.tmdb.org/t/p/w342${path}`;
  return `https://image.tmdb.org/t/p/w342/${path}`;
}

export default function UserReviewsModal({
  userId,
  username,
  avatarUrl,
  isOpen,
  onClose,
}: UserReviewsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'shows' | 'episodes'>('all');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<CombinedReviewItem[]>([]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    async function fetchUserReviews() {
      setLoading(true);
      const supabase = createClient();

      try {
        // 1. Genel Dizi İncelemelerini Çek (reviews tablosu)
        const { data: showReviews } = await supabase
          .from('reviews')
          .select('id, show_id, rating, content, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(40);

        // 2. Bölüm Yorumlarını Çek (episode_discussions tablosu)
        const { data: epComments } = await supabase
          .from('episode_discussions')
          .select('id, show_id, season_number, episode_number, content, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(40);

        // 3. Kullanıcının watch_status tablosundan mevcut dizi isimlerini ve afişlerini çek
        const { data: watchStatusData } = await supabase
          .from('watch_status')
          .select('show_id, show_name, poster_path')
          .eq('user_id', userId);

        const showDetailsMap: Record<string, { name: string; poster: string }> = {};

        (watchStatusData || []).forEach((row) => {
          if (row.show_id) {
            const idKey = String(row.show_id);
            showDetailsMap[idKey] = {
              name: row.show_name || 'Dizi',
              poster: formatPosterUrl(row.poster_path),
            };
          }
        });

        // 4. Tüm benzersiz Show ID'leri topla
        const allShowIds = Array.from(
          new Set([
            ...(showReviews || []).map((r) => String(r.show_id)),
            ...(epComments || []).map((c) => String(c.show_id)),
          ])
        ).filter(Boolean);

        // Eksik veya afişi bulunmayan tüm dizileri sunucumuzun /api/shows/batch-details rotasından çek
        const missingIds = allShowIds.filter(
          (id) => !showDetailsMap[id] || !showDetailsMap[id].poster
        );

        if (missingIds.length > 0) {
          try {
            const apiRes = await fetch(`/api/shows/batch-details?ids=${missingIds.join(',')}`);
            if (apiRes.ok) {
              const batchMap: Record<string, { name: string; poster: string }> = await apiRes.json();
              Object.keys(batchMap).forEach((idKey) => {
                if (batchMap[idKey]) {
                  showDetailsMap[idKey] = {
                    name: batchMap[idKey].name || showDetailsMap[idKey]?.name || 'Dizi',
                    poster: formatPosterUrl(batchMap[idKey].poster) || showDetailsMap[idKey]?.poster || '',
                  };
                }
              });
            }
          } catch {
            // ignore batch fetch error
          }
        }

        // 5. Verileri birleştir
        const combined: CombinedReviewItem[] = [];

        (showReviews || []).forEach((r) => {
          const idKey = String(r.show_id);
          const detail = showDetailsMap[idKey] || { name: 'Dizi', poster: '' };
          combined.push({
            id: `show_${r.id}`,
            type: 'show_review',
            show_id: r.show_id,
            show_name: detail.name,
            poster_path: detail.poster,
            rating: r.rating,
            content: r.content,
            created_at: r.created_at,
          });
        });

        (epComments || []).forEach((c) => {
          const idKey = String(c.show_id);
          const detail = showDetailsMap[idKey] || { name: 'Dizi', poster: '' };
          combined.push({
            id: `ep_${c.id}`,
            type: 'episode_comment',
            show_id: c.show_id,
            show_name: detail.name,
            poster_path: detail.poster,
            season_number: c.season_number,
            episode_number: c.episode_number,
            content: c.content,
            created_at: c.created_at,
          });
        });

        combined.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setReviews(combined);
      } catch {
        // error handling
      } finally {
        setLoading(false);
      }
    }

    fetchUserReviews();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const filteredReviews = reviews.filter((item) => {
    if (activeTab === 'shows') return item.type === 'show_review';
    if (activeTab === 'episodes') return item.type === 'episode_comment';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0A0A0E]/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Başlık Barı */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-[#C91520] flex items-center justify-center text-white font-bold text-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                username[0]?.toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">@{username} Yorumları</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Sekmeler (Tümü / Dizi İncelemeleri / Bölüm Yorumları) */}
        <div className="flex items-center gap-1.5 p-2.5 px-4 border-b border-white/10 bg-black/40">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#C91520] text-white shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Tümü ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('shows')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'shows'
                ? 'bg-[#C91520] text-white shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Dizi İncelemeleri ({reviews.filter((r) => r.type === 'show_review').length})
          </button>
          <button
            onClick={() => setActiveTab('episodes')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'episodes'
                ? 'bg-[#C91520] text-white shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Bölüm Yorumları ({reviews.filter((r) => r.type === 'episode_comment').length})
          </button>
        </div>

        {/* Yorumlar Listesi */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40 gap-3">
              <span className="w-8 h-8 border-2 border-[#C91520] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Yorumlar Yükleniyor...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/40 gap-2">
              <span className="material-symbols-outlined text-4xl">rate_review</span>
              <p className="text-sm font-semibold text-white/70">Henüz Yorum Yapılmamış</p>
              <p className="text-xs max-w-xs">Bu kategoride henüz yazılmış bir dizi veya bölüm incelemesi bulunmuyor.</p>
            </div>
          ) : (
            filteredReviews.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all"
              >
                {/* Sol Taraf: Dizi Afişi + Puan Rozeti */}
                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  <Link
                    href={`/show/${item.show_id}`}
                    onClick={onClose}
                    className="relative aspect-[2/3] w-16 sm:w-20 rounded-xl overflow-hidden border border-white/20 shadow-lg group bg-[#141414]"
                  >
                    {item.poster_path ? (
                      <img
                        src={item.poster_path}
                        alt={item.show_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to text box if image network error occurs
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C91520]/40 to-[#141414] p-1 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-white/40 text-xl">tv</span>
                        <span className="text-[9px] font-bold text-white/70 leading-tight mt-1 line-clamp-2">{item.show_name}</span>
                      </div>
                    )}
                  </Link>
                  {item.rating && (
                    <span className="text-[11px] font-bold text-white/90 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                      Puan: {item.rating}/10
                    </span>
                  )}
                </div>

                {/* Sağ Taraf: Detaylar & Yorum Metni */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Rozet Sağ Üstte, Başlık Sol Tarafta */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Link
                        href={`/show/${item.show_id}`}
                        onClick={onClose}
                        className="text-sm sm:text-base font-extrabold text-white hover:text-[#C91520] transition-colors truncate mr-1"
                      >
                        {item.show_name}
                      </Link>

                      {item.type === 'show_review' ? (
                        <span className="shrink-0 text-[9px] font-medium text-white/50 border border-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Dizi İncelemesi
                        </span>
                      ) : (
                        <span className="shrink-0 text-[9px] font-medium text-white/60 border border-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {item.season_number}. Sezon {item.episode_number}. Bölüm
                        </span>
                      )}
                    </div>

                    {/* Yorum Metni */}
                    <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium whitespace-pre-line mt-1">
                      {item.content}
                    </p>
                  </div>

                  {/* Alt Bilgi Barı */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-[11px] text-white/40">
                    <span>{new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    
                    <Link
                      href={
                        item.type === 'episode_comment'
                          ? `/show/${item.show_id}/season/${item.season_number}/episode/${item.episode_number}`
                          : `/show/${item.show_id}`
                      }
                      onClick={onClose}
                      className="text-[#C91520] hover:underline font-bold flex items-center gap-0.5"
                    >
                      <span>Git</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </Link>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
