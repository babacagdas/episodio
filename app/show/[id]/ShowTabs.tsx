'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  isSpoiler?: boolean;
  created_at: string;
  likeCount: number;
  likedByMe: boolean;
  profiles?: { username: string; full_name: string; avatar_url: string };
}

interface Props {
  showId: number;
  episodesBySeason: Record<number, Episode[]>;
  similar: Show[];
  poster: string | null;
  seasons: Season[];
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} g`;
}

const SPOILER_PREFIX = '[SPOILER]';
function parseSpoiler(raw: string) {
  const isSpoiler = raw.startsWith(SPOILER_PREFIX);
  return {
    isSpoiler,
    content: isSpoiler ? raw.replace(SPOILER_PREFIX, '').trim() : raw,
  };
}
function buildSpoilerContent(content: string, isSpoiler: boolean) {
  return isSpoiler ? `${SPOILER_PREFIX} ${content}` : content;
}

export default function ShowTabs({ showId, episodesBySeason, similar, poster, seasons }: Props) {
  const [tab, setTab] = useState<'episodes' | 'reviews' | 'notes' | 'similar'>('episodes');
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(seasons[0]?.season_number ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myContent, setMyContent] = useState('');
  const [mySpoiler, setMySpoiler] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Notes
  const [noteContent, setNoteContent] = useState('');
  const [notePublic, setNotePublic] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: p } = await supabase.from('profiles').select('full_name, username, avatar_url').eq('id', data.user.id).single();
      if (p) {
        setUserAvatar(p.avatar_url);
        setUserName(p.full_name || p.username || null);
      }
    });
  }, []);

  async function loadReviews() {
    if (reviewsLoaded) return;
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const me = authData.user?.id ?? null;

    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('show_id', showId)
      .order('created_at', { ascending: false });

    const ids = (data ?? []).map((r: any) => r.id);
    let likesMap: Record<string, number> = {};
    let myLikes: Set<string> = new Set();

    if (ids.length > 0) {
      const { data: likes } = await supabase.from('review_likes').select('review_id, user_id').in('review_id', ids);
      (likes ?? []).forEach((l: any) => {
        likesMap[l.review_id] = (likesMap[l.review_id] ?? 0) + 1;
        if (l.user_id === me) myLikes.add(l.review_id);
      });
    }

    setReviews((data ?? []).map((r: any) => {
      const parsed = parseSpoiler(r.content ?? '');
      return {
      ...r,
      content: parsed.content,
      isSpoiler: parsed.isSpoiler,
      profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
      likeCount: likesMap[r.id] ?? 0,
      likedByMe: myLikes.has(r.id),
    };}));
    setReviewsLoaded(true);
  }

  async function loadNote() {
    if (noteLoaded || !userId) return;
    const supabase = createClient();
    const { data } = await supabase.from('show_notes').select('content, is_public').eq('user_id', userId).eq('show_id', showId).maybeSingle();
    if (data) { setNoteContent(data.content); setNotePublic(data.is_public); }
    setNoteLoaded(true);
  }

  async function submitReview() {
    if (!userId || !myContent.trim() || myRating === 0) return;
    setSubmitting(true);
    setSubmitError('');
    const supabase = createClient();
    const payload = buildSpoilerContent(myContent.trim(), mySpoiler);
    const { data, error } = await supabase
      .from('reviews')
      .insert({ user_id: userId, show_id: showId, rating: myRating, content: payload })
      .select('*, profiles(username, full_name, avatar_url)')
      .single();
    if (!error && data) {
      const parsed = parseSpoiler(data.content ?? '');
      const r = { ...data, content: parsed.content, isSpoiler: parsed.isSpoiler, profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles, likeCount: 0, likedByMe: false };
      setReviews(prev => [r, ...prev]);
      setMyContent('');
      setMyRating(0);
      setMySpoiler(false);
      setReviewsLoaded(true);
    } else if (error) {
      setSubmitError(error.message ?? 'Yorum gönderilemedi.');
    }
    setSubmitting(false);
  }

  async function deleteReview(reviewId: string) {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', userId);
    if (!error) setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  }

  async function toggleLike(reviewId: string) {
    if (!userId) { window.location.href = '/signin'; return; }
    const supabase = createClient();
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    if (review.likedByMe) {
      await supabase.from('review_likes').delete().eq('user_id', userId).eq('review_id', reviewId);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likedByMe: false, likeCount: r.likeCount - 1 } : r));
    } else {
      await supabase.from('review_likes').insert({ user_id: userId, review_id: reviewId });
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likedByMe: true, likeCount: r.likeCount + 1 } : r));
    }
  }

  async function saveNote() {
    if (!userId || !noteContent.trim()) return;
    setNoteSaving(true);
    const supabase = createClient();
    await supabase.from('show_notes').upsert({
      user_id: userId,
      show_id: showId,
      show_name: '',
      poster_path: null,
      content: noteContent.trim(),
      is_public: notePublic,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,show_id' });
    setNoteSaving(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 border-b border-white/10 mb-8 overflow-x-hidden">
        {(['episodes', 'reviews', 'notes', 'similar'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === 'reviews') loadReviews();
              if (t === 'notes') { loadNote(); }
            }}
            className={`pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t ? 'text-white border-b-2 border-[#E50914]' : 'text-white/40 hover:text-white'
            }`}
          >
            {t === 'episodes' ? 'Bölümler' : t === 'reviews' ? 'Yorumlar' : t === 'notes' ? 'Notum' : 'Benzer'}
          </button>
        ))}
      </div>

      {/* Episodes */}
      {tab === 'episodes' && (
        <div className="space-y-4 mb-16">
          {seasons.length === 0 || selectedSeasonNumber === null ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/20">
              <span className="material-symbols-outlined text-5xl mb-3">tv_off</span>
              <p className="text-sm">Bu dizi için sezon bulunamadı.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {seasons.map((season) => (
                  <button
                    key={season.season_number}
                    type="button"
                    onClick={() => setSelectedSeasonNumber(season.season_number)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      season.season_number === selectedSeasonNumber ? 'bg-[#D4A017] text-black' : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {season.name || `Sezon ${season.season_number}`}
                  </button>
                ))}
              </div>
              <section className="space-y-3">
                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
                  {seasons.find(s => s.season_number === selectedSeasonNumber)?.name || `Sezon ${selectedSeasonNumber}`} — {(episodesBySeason[selectedSeasonNumber] ?? []).length} Bölüm
                </p>
                {(episodesBySeason[selectedSeasonNumber] ?? []).length === 0 ? (
                  <div className="bg-[#141414] border border-white/5 rounded-xl p-4 text-xs text-white/40">Bu sezon için bölüm bulunamadı.</div>
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
                            <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{ep.episode_number}</div>
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
      )}

      {/* Reviews — Instagram style */}
      {tab === 'reviews' && (
        <div className="mb-16">
          {/* Yorum yaz */}
          {userId ? (
            <div className="flex gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-lg">person</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setMyRating(s)}>
                      <span className="material-symbols-outlined text-xl transition-colors" style={{ color: s <= myRating ? '#D4A017' : 'rgba(255,255,255,0.2)', fontVariationSettings: s <= myRating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                    placeholder="Yorumunu yaz..."
                    value={myContent}
                    onChange={e => setMyContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReview(); } }}
                  />
                  <button
                    onClick={submitReview}
                    disabled={submitting || !myContent.trim() || myRating === 0}
                    className="px-3.5 py-2 bg-[#E50914] text-white text-sm font-semibold rounded-full hover:bg-red-700 transition-all disabled:opacity-40"
                  >
                    {submitting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin block" /> : 'Paylaş'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMySpoiler((prev) => !prev)}
                  className={`mt-2 text-[11px] font-semibold transition-colors ${mySpoiler ? 'text-[#E50914]' : 'text-white/35 hover:text-white/70'}`}
                >
                  {mySpoiler ? 'Spoiler etiketi açık' : 'Spoiler etiketi ekle'}
                </button>
                {submitError && (
                  <p className="mt-2 text-xs text-[#E50914]">{submitError}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/30 mb-6">Yorum yazmak için <Link href="/signin" className="text-[#E50914]">giriş yap</Link>.</p>
          )}

          {/* Liste */}
          {!reviewsLoaded ? (
            <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-white/20">
              <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
              <p className="text-sm">Henüz yorum yok. İlk yorumu sen yaz!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((r) => {
                const name = r.profiles?.full_name || r.profiles?.username || 'Kullanıcı';
                const username = r.profiles?.username;
                return (
                  <div key={r.id} className="flex gap-3">
                    <Link href={username ? `/u/${username}` : '#'} className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                      {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} alt={name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-lg">person</span>}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <Link href={username ? `/u/${username}` : '#'} className="text-sm font-semibold text-white hover:text-white/80 transition-colors">{name}</Link>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className="material-symbols-outlined text-[11px]" style={{ color: s <= r.rating ? '#D4A017' : 'rgba(255,255,255,0.15)', fontVariationSettings: s <= r.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                            ))}
                          </div>
                        </div>
                        {r.isSpoiler && !revealedSpoilers[r.id] ? (
                          <button
                            type="button"
                            onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [r.id]: true }))}
                            className="mt-1 text-xs font-semibold text-[#E50914] hover:text-white transition-colors"
                          >
                            Spoiler var — Göster
                          </button>
                        ) : (
                          <p className="text-sm text-white/75 leading-relaxed">{r.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 px-2">
                        <span className="text-[11px] text-white/25">{timeAgo(r.created_at)}</span>
                        <button
                          onClick={() => toggleLike(r.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                          style={{ color: r.likedByMe ? '#E50914' : 'rgba(255,255,255,0.3)' }}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: r.likedByMe ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          {r.likeCount > 0 && r.likeCount}
                        </button>
                        {r.user_id === userId && (
                          <button
                            type="button"
                            onClick={() => deleteReview(r.id)}
                            className="text-[11px] font-semibold text-white/30 hover:text-[#E50914] transition-colors"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Kişisel Not */}
      {tab === 'notes' && (
        <div className="mb-16 max-w-xl">
          {!userId ? (
            <p className="text-sm text-white/30">Not eklemek için <Link href="/signin" className="text-[#E50914]">giriş yap</Link>.</p>
          ) : (
            <div className="space-y-4">
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:border-white/25 focus:outline-none resize-none transition-colors"
                placeholder="Bu dizi hakkında kişisel notun..."
                rows={5}
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNotePublic(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!notePublic ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Sadece ben
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotePublic(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${notePublic ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-sm">public</span>
                    Profilde göster
                  </button>
                </div>
                <button
                  onClick={saveNote}
                  disabled={noteSaving || !noteContent.trim()}
                  className="px-5 py-2 bg-[#E50914] text-white text-sm font-semibold rounded-full hover:bg-red-700 transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  {noteSaving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : noteSaved ? '✓ Kaydedildi' : 'Kaydet'}
                </button>
              </div>
              <p className="text-xs text-white/25">
                {notePublic ? 'Bu not profilinde herkese görünür.' : 'Bu not sadece sana görünür.'}
              </p>
            </div>
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
