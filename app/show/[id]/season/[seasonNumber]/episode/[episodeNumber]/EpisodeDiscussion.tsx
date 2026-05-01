'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface EpisodeComment {
  id: string;
  user_id: string;
  show_id: number;
  season_number: number;
  episode_number: number;
  rating: number;
  content: string;
  created_at: string;
  likeCount: number;
  likedByMe: boolean;
  replies: EpisodeReply[];
  profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

interface EpisodeReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

interface Props {
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa`;
  return `${Math.floor(h / 24)} g`;
}

export default function EpisodeDiscussion({ showId, seasonNumber, episodeNumber }: Props) {
  const [comments, setComments] = useState<EpisodeComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: p } = await supabase.from('profiles').select('avatar_url').eq('id', data.user.id).single();
      if (p) setUserAvatar(p.avatar_url);
    });
    loadComments();
  }, [showId, seasonNumber, episodeNumber]);

  async function loadComments() {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const me = authData.user?.id ?? null;

    const { data: rows } = await supabase
      .from('episode_discussions')
      .select('*')
      .eq('show_id', showId)
      .eq('season_number', seasonNumber)
      .eq('episode_number', episodeNumber)
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setLoaded(true); return; }

    const commentIds = rows.map((r: any) => r.id);
    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id))) as string[];

    const [likesRes, repliesRes, profilesRes] = await Promise.all([
      supabase.from('episode_comment_likes').select('comment_id, user_id').in('comment_id', commentIds),
      supabase.from('episode_comment_replies').select('*').in('comment_id', commentIds).order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', userIds),
    ]);

    const profileMap: Record<string, any> = {};
    (profilesRes.data ?? []).forEach((p: any) => { profileMap[p.id] = p; });

    const replyUserIds = Array.from(new Set((repliesRes.data ?? []).map((r: any) => r.user_id))) as string[];
    if (replyUserIds.length > 0) {
      const { data: replyProfiles } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', replyUserIds);
      (replyProfiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
    }

    const likesMap: Record<string, number> = {};
    const myLikes = new Set<string>();
    (likesRes.data ?? []).forEach((l: any) => {
      likesMap[l.comment_id] = (likesMap[l.comment_id] ?? 0) + 1;
      if (l.user_id === me) myLikes.add(l.comment_id);
    });

    const repliesMap: Record<string, EpisodeReply[]> = {};
    (repliesRes.data ?? []).forEach((r: any) => {
      if (!repliesMap[r.comment_id]) repliesMap[r.comment_id] = [];
      repliesMap[r.comment_id].push({ ...r, profile: profileMap[r.user_id] ?? null });
    });

    setComments(rows.map((r: any) => ({
      ...r,
      profile: profileMap[r.user_id] ?? null,
      likeCount: likesMap[r.id] ?? 0,
      likedByMe: myLikes.has(r.id),
      replies: repliesMap[r.id] ?? [],
    })));
    setLoaded(true);
  }

  async function submitComment() {
    if (!userId || !content.trim() || rating === 0) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('episode_discussions')
      .insert({ user_id: userId, show_id: showId, season_number: seasonNumber, episode_number: episodeNumber, rating, content: content.trim() })
      .select('*').single();
    if (!error && data) {
      const { data: p } = await supabase.from('profiles').select('username, full_name, avatar_url').eq('id', userId).single();
      setComments(prev => [{ ...data, profile: p ?? null, likeCount: 0, likedByMe: false, replies: [] }, ...prev]);
      setContent(''); setRating(0);
    }
    setSubmitting(false);
  }

  async function toggleLike(commentId: string) {
    if (!userId) { window.location.href = '/signin'; return; }
    const supabase = createClient();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    if (comment.likedByMe) {
      await supabase.from('episode_comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, likedByMe: false, likeCount: c.likeCount - 1 } : c));
    } else {
      await supabase.from('episode_comment_likes').insert({ comment_id: commentId, user_id: userId });
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, likedByMe: true, likeCount: c.likeCount + 1 } : c));
      if (comment.user_id !== userId) {
        await supabase.from('notifications').insert({ user_id: comment.user_id, actor_id: userId, type: 'episode_like', message: 'Bölüm yorumunu beğendi.', link: `/show/${showId}/season/${seasonNumber}/episode/${episodeNumber}` });
      }
    }
  }

  async function submitReply(commentId: string) {
    if (!userId || !replyContent.trim()) return;
    setReplySubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('episode_comment_replies')
      .insert({ comment_id: commentId, user_id: userId, content: replyContent.trim() })
      .select('*').single();
    if (!error && data) {
      const { data: p } = await supabase.from('profiles').select('username, full_name, avatar_url').eq('id', userId).single();
      const reply: EpisodeReply = { ...data, profile: p ?? null };
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c));
      const comment = comments.find(c => c.id === commentId);
      if (comment && comment.user_id !== userId) {
        await supabase.from('notifications').insert({ user_id: comment.user_id, actor_id: userId, type: 'episode_reply', message: 'Yorumuna yanıt yazdı.', link: `/show/${showId}/season/${seasonNumber}/episode/${episodeNumber}` });
      }
      setReplyContent(''); setReplyingTo(null);
    }
    setReplySubmitting(false);
  }

  return (
    <section className="mb-16">
      {/* Yorum yaz */}
      {userId ? (
        <div className="flex gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
            {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-lg">person</span>}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <span className="material-symbols-outlined text-xl transition-colors" style={{ color: s <= rating ? '#D4A017' : 'rgba(255,255,255,0.2)', fontVariationSettings: s <= rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                placeholder="Bu bölüm hakkında ne düşünüyorsun?"
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={submitting || !content.trim() || rating === 0}
                className="px-4 py-2 bg-[#E50914] text-white text-sm font-semibold rounded-full hover:bg-red-700 transition-all disabled:opacity-40"
              >
                {submitting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin block" /> : 'Paylaş'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/30 mb-6">Yorum yazmak için <Link href="/signin" className="text-[#E50914]">giriş yap</Link>.</p>
      )}

      {!loaded ? (
        <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-white/20">
          <span className="material-symbols-outlined text-4xl mb-2">forum</span>
          <p className="text-sm">Henüz sohbet başlamadı. İlk yorumu sen yaz.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map(comment => {
            const name = comment.profile?.full_name || comment.profile?.username || 'Kullanıcı';
            const username = comment.profile?.username;
            return (
              <div key={comment.id} className="flex gap-3">
                <Link href={username ? `/u/${username}` : '#'} className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                  {comment.profile?.avatar_url ? <img src={comment.profile.avatar_url} alt={name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-lg">person</span>}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-white/[0.04] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={username ? `/u/${username}` : '#'} className="text-sm font-semibold text-white hover:text-white/80 transition-colors">{name}</Link>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className="material-symbols-outlined text-[11px]" style={{ color: s <= comment.rating ? '#D4A017' : 'rgba(255,255,255,0.15)', fontVariationSettings: s <= comment.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-white/75 leading-relaxed">{comment.content}</p>
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 px-2">
                    <span className="text-[11px] text-white/25">{timeAgo(comment.created_at)}</span>
                    <button onClick={() => toggleLike(comment.id)} className="flex items-center gap-1 text-[11px] font-semibold transition-colors" style={{ color: comment.likedByMe ? '#E50914' : 'rgba(255,255,255,0.3)' }}>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: comment.likedByMe ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                      {comment.likeCount > 0 && comment.likeCount}
                    </button>
                    <button onClick={() => setReplyingTo(prev => prev === comment.id ? null : comment.id)} className="text-[11px] font-semibold text-white/30 hover:text-white transition-colors">
                      Yanıtla
                    </button>
                  </div>

                  {/* Yanıtlar */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-3 border-l border-white/10">
                      {comment.replies.map(reply => {
                        const rName = reply.profile?.full_name || reply.profile?.username || 'Kullanıcı';
                        const rUsername = reply.profile?.username;
                        return (
                          <div key={reply.id} className="flex gap-2">
                            <Link href={rUsername ? `/u/${rUsername}` : '#'} className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                              {reply.profile?.avatar_url ? <img src={reply.profile.avatar_url} alt={rName} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-white/20 text-sm">person</span>}
                            </Link>
                            <div className="flex-1">
                              <div className="bg-white/[0.03] rounded-2xl rounded-tl-sm px-3 py-2">
                                <Link href={rUsername ? `/u/${rUsername}` : '#'} className="text-xs font-semibold text-white hover:text-white/80 transition-colors">{rName}</Link>
                                <p className="text-xs text-white/65 mt-0.5">{reply.content}</p>
                              </div>
                              <span className="text-[10px] text-white/25 px-2">{timeAgo(reply.created_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Yanıt yaz */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2 pl-3">
                      <input
                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white text-xs placeholder:text-white/25 focus:border-white/25 focus:outline-none transition-colors"
                        placeholder="Yanıt yaz..."
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitReply(comment.id); } }}
                        autoFocus
                      />
                      <button type="button" onClick={() => submitReply(comment.id)} disabled={replySubmitting || !replyContent.trim()} className="px-3 py-1.5 bg-[#E50914] text-white text-xs font-semibold rounded-full disabled:opacity-40">
                        {replySubmitting ? '...' : 'Gönder'}
                      </button>
                      <button type="button" onClick={() => { setReplyingTo(null); setReplyContent(''); }} className="text-white/30 hover:text-white text-xs transition-colors">İptal</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
