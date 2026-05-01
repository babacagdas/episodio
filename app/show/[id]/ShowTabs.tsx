'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Episode, Season, Show } from '@/lib/tmdb';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const STILL_BASE = 'https://image.tmdb.org/t/p/w300';

interface Review {
  id: string;
  user_id: string;
  show_id: number;
  rating: number;
  content: string;
  created_at: string;
  profiles?: { username: string; full_name: string; avatar_url: string };
}

interface Props {
  showId: number;
  episodesBySeason: Record<number, Episode[]>;
  similar: Show[];
  poster: string | null;
  seasons: Season[];
}

export default function ShowTabs({ showId, episodesBySeason, similar, poster, seasons }: Props) {
  const [tab, setTab] = useState<'episodes' | 'reviews' | 'similar'>('episodes');
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(
    seasons[0]?.season_number ?? null
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [myContent, setMyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function loadReviews() {
    if (reviewsLoaded) return;
    setReviewsError('');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('show_id', showId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setReviewsError('Yorumlar yüklenemedi. Lütfen tekrar deneyin.');
      setReviewsLoaded(true);
      return;
    }

    setReviews(data ?? []);
    setReviewsLoaded(true);
  }

  async function submitReview() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !myContent.trim() || myRating === 0) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('reviews')
      .upsert({ user_id: user.id, show_id: showId, rating: myRating, content: myContent.trim() }, { onConflict: 'user_id,show_id' })
      .select('*, profiles(username, full_name, avatar_url)')
      .single();
    if (!error && data) {
      setReviews(prev => [data, ...prev.filter(r => r.user_id !== user.id)]);
      setMyContent('');
      setMyRating(0);
      setReviewsLoaded(true);
    }
    setSubmitting(false);
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-8 border-b border-white/10 mb-8">
        {(['episodes', 'reviews', 'similar'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'reviews') loadReviews(); }}
            className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t ? 'text-white border-b-2 border-[#E50914]' : 'text-white/40 hover:text-white'
            }`}
          >
            {t === 'episodes' ? 'Bölümler' : t === 'reviews' ? 'Yorumlar' : 'Benzer Diziler'}
          </button>
        ))}
      </div>

      {/* Episodes */}
      {tab === 'episodes' && (
        <>
          <div className="space-y-4 mb-16">
            {seasons.length === 0 || selectedSeasonNumber === null ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/20">
                <span className="material-symbols-outlined text-5xl mb-3">tv_off</span>
                <p className="text-sm">Bu dizi için sezon bulunamadı.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {seasons.map((season) => {
                    const active = season.season_number === selectedSeasonNumber;
                    return (
                      <button
                        key={season.season_number}
                        type="button"
                        onClick={() => setSelectedSeasonNumber(season.season_number)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active ? 'bg-[#D4A017] text-black' : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        {season.name || `Sezon ${season.season_number}`}
                      </button>
                    );
                  })}
                </div>

                <section className="space-y-3">
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
                    {seasons.find((season) => season.season_number === selectedSeasonNumber)?.name || `Sezon ${selectedSeasonNumber}`} - {(episodesBySeason[selectedSeasonNumber] ?? []).length} Bolum
                  </p>

                  {(episodesBySeason[selectedSeasonNumber] ?? []).length === 0 ? (
                    <div className="bg-[#141414] border border-white/5 rounded-xl p-4 text-xs text-white/40">
                      Bu sezon icin bolum bulunamadi.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(episodesBySeason[selectedSeasonNumber] ?? []).map((ep: Episode) => {
                        const still = ep.still_path ? `${STILL_BASE}${ep.still_path}` : poster;
                        return (
                          <Link
                            key={ep.id}
                            href={`/show/${showId}/season/${selectedSeasonNumber}/episode/${ep.episode_number}`}
                            className="bg-[#141414] border border-white/5 rounded-xl p-4 flex gap-4 items-center hover:bg-[#1A1A1A] hover:border-white/10 transition-all cursor-pointer group"
                          >
                            <div className="w-28 h-16 md:w-40 md:h-24 rounded-lg overflow-hidden relative shrink-0 bg-[#1A1A1A]">
                              {still
                                ? <img alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={still} />
                                : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20">movie</span></div>
                              }
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                              </div>
                              <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {ep.episode_number}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-white truncate mb-1">B{ep.episode_number}: {ep.name}</h3>
                              {ep.overview && <p className="text-xs text-white/40 line-clamp-2 mb-2">{ep.overview}</p>}
                              <div className="flex items-center gap-3">
                                {ep.runtime && <span className="text-xs text-white/30">{ep.runtime} dk</span>}
                                {ep.air_date && <span className="text-xs text-white/30">{ep.air_date.slice(0, 4)}</span>}
                                {ep.vote_average > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[#D4A017] text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    <span className="text-xs text-white/40">{ep.vote_average.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </>
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        <div className="mb-16 space-y-6">
          {/* Yorum yaz */}
          <div className="bg-[#141414] border border-white/5 rounded-xl p-5 flex flex-col gap-4">
            <p className="text-sm font-semibold text-white">Yorumunu Yaz</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setMyRating(s)}>
                  <span
                    className="material-symbols-outlined text-2xl transition-colors"
                    style={{
                      color: s <= myRating ? '#D4A017' : 'rgba(255,255,255,0.2)',
                      fontVariationSettings: s <= myRating ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >star</span>
                </button>
              ))}
              {myRating > 0 && <span className="text-xs text-white/30 ml-2">{myRating}/5</span>}
            </div>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none resize-none transition-colors"
              placeholder="Bu dizi hakkında ne düşünüyorsun?"
              rows={3}
              value={myContent}
              onChange={e => setMyContent(e.target.value)}
            />
            {!userId && (
              <p className="text-xs text-white/30">Yorum göndermek için <Link href="/signin" className="text-[#E50914] hover:text-white transition-colors">giriş yapmalısın</Link>.</p>
            )}
            <button
              onClick={submitReview}
              disabled={submitting || !myContent.trim() || myRating === 0 || !userId}
              className="self-end px-6 py-2 bg-[#E50914] text-white text-sm font-semibold rounded-full hover:bg-red-700 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {submitting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Gönder'}
            </button>
          </div>

          {/* Yorumlar listesi */}
          {!reviewsLoaded ? (
            <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
          ) : reviewsError ? (
            <div className="flex flex-col items-center py-16 text-[#E50914]">
              <span className="material-symbols-outlined text-4xl mb-2">error</span>
              <p className="text-sm">{reviewsError}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-white/20">
              <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
              <p className="text-sm">Henüz yorum yok. İlk yorumu sen yaz!</p>
            </div>
          ) : (
            reviews.map((r) => {
              const name = r.profiles?.full_name || r.profiles?.username || 'Kullanıcı';
              const av = r.profiles?.avatar_url;
              return (
                <div key={r.id} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                    {av ? <img src={av} alt={name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-lg">person</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className="material-symbols-outlined text-[12px]" style={{ color: s <= r.rating ? '#D4A017' : 'rgba(255,255,255,0.15)', fontVariationSettings: s <= r.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                        ))}
                      </div>
                      <span className="text-xs text-white/20">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{r.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Similar */}
      {tab === 'similar' && (
        <div className="mb-16">
          {similar.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-white/20">
              <span className="material-symbols-outlined text-4xl mb-2">tv_off</span>
              <p className="text-sm">Benzer dizi bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similar.slice(0, 12).map((s) => {
                const p = s.poster_path ? `${POSTER_BASE}${s.poster_path}` : null;
                return (
                  <Link key={s.id} href={`/show/${s.id}`} className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#141414] border border-white/5 group hover:border-white/20 hover:scale-[1.02] transition-all duration-300 block">
                    {p
                      ? <img alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={p} />
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-white/20 text-4xl">movie</span></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-70" />
                    <div className="absolute bottom-0 left-0 w-full p-3">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="material-symbols-outlined text-[11px] text-[#D4A017]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-[11px] text-white">{s.vote_average.toFixed(1)}</span>
                      </div>
                      <h3 className="text-xs font-semibold text-white truncate">{s.name}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
