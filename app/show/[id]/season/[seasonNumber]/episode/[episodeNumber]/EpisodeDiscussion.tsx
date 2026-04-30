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
}

interface EpisodeReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface Props {
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export default function EpisodeDiscussion({ showId, seasonNumber, episodeNumber }: Props) {
  const [comments, setComments] = useState<EpisodeComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [likesByComment, setLikesByComment] = useState<Record<string, number>>({});
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [repliesByComment, setRepliesByComment] = useState<Record<string, EpisodeReply[]>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function loadComments() {
    setError('');
    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from('episode_discussions')
      .select('*')
      .eq('show_id', showId)
      .eq('season_number', seasonNumber)
      .eq('episode_number', episodeNumber)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(`Yorumlar yüklenemedi: ${queryError.message}`);
      setLoaded(true);
      return;
    }

    setComments((data ?? []) as EpisodeComment[]);
    await Promise.all([loadLikes((data ?? []) as EpisodeComment[]), loadReplies((data ?? []) as EpisodeComment[])]);
    setLoaded(true);
  }

  useEffect(() => {
    loadComments();
  }, [showId, seasonNumber, episodeNumber]);

  async function submitComment() {
    if (!userId || !content.trim() || rating === 0) return;
    setSubmitting(true);
    setError('');

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from('episode_discussions')
      .insert({
        user_id: userId,
        show_id: showId,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        rating,
        content: content.trim(),
      })
      .select('*')
      .single();

    if (insertError) {
      setError(`Yorum kaydedilemedi: ${insertError.message}`);
      setSubmitting(false);
      return;
    }

    setComments((prev) => [data as EpisodeComment, ...prev]);
    setContent('');
    setRating(0);
    setSubmitting(false);
  }

  async function createNotification(payload: {
    user_id: string;
    actor_id: string;
    type: string;
    message: string;
    link: string;
  }) {
    const supabase = createClient();
    await supabase.from('notifications').insert(payload);
  }

  async function loadLikes(commentList: EpisodeComment[]) {
    if (commentList.length === 0) {
      setLikesByComment({});
      setLikedCommentIds({});
      return;
    }

    const ids = commentList.map((c) => c.id);
    const supabase = createClient();
    const { data, error: likeError } = await supabase
      .from('episode_comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', ids);

    if (likeError) return;

    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};
    (data ?? []).forEach((row: { comment_id: string; user_id: string }) => {
      counts[row.comment_id] = (counts[row.comment_id] ?? 0) + 1;
      if (userId && row.user_id === userId) mine[row.comment_id] = true;
    });

    setLikesByComment(counts);
    setLikedCommentIds(mine);
  }

  async function loadReplies(commentList: EpisodeComment[]) {
    if (commentList.length === 0) {
      setRepliesByComment({});
      return;
    }

    const ids = commentList.map((c) => c.id);
    const supabase = createClient();
    const { data, error: replyError } = await supabase
      .from('episode_comment_replies')
      .select('*')
      .in('comment_id', ids)
      .order('created_at', { ascending: true });

    if (replyError) return;

    const grouped: Record<string, EpisodeReply[]> = {};
    (data ?? []).forEach((row: EpisodeReply) => {
      if (!grouped[row.comment_id]) grouped[row.comment_id] = [];
      grouped[row.comment_id].push(row);
    });
    setRepliesByComment(grouped);
  }

  async function toggleLike(commentId: string) {
    if (!userId) {
      setError('Beğenmek için giriş yapmalısın.');
      return;
    }

    const supabase = createClient();
    const alreadyLiked = !!likedCommentIds[commentId];

    if (alreadyLiked) {
      const { error: deleteError } = await supabase
        .from('episode_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (deleteError) {
        setError(`Beğeni kaldırılamadı: ${deleteError.message}`);
        return;
      }

      setLikedCommentIds((prev) => ({ ...prev, [commentId]: false }));
      setLikesByComment((prev) => ({ ...prev, [commentId]: Math.max(0, (prev[commentId] ?? 1) - 1) }));
      return;
    }

    const { error: insertError } = await supabase.from('episode_comment_likes').insert({
      comment_id: commentId,
      user_id: userId,
    });

    if (insertError) {
      setError(`Beğeni kaydedilemedi: ${insertError.message}`);
      return;
    }

    setLikedCommentIds((prev) => ({ ...prev, [commentId]: true }));
    setLikesByComment((prev) => ({ ...prev, [commentId]: (prev[commentId] ?? 0) + 1 }));

    const targetComment = comments.find((item) => item.id === commentId);
    if (targetComment && targetComment.user_id !== userId) {
      await createNotification({
        user_id: targetComment.user_id,
        actor_id: userId,
        type: 'episode_like',
        message: 'Bölüm yorumunu beğendi.',
        link: `/show/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
      });
    }
  }

  async function submitReply(commentId: string) {
    if (!userId || !replyContent.trim()) return;
    setReplySubmitting(true);
    setError('');

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from('episode_comment_replies')
      .insert({
        comment_id: commentId,
        user_id: userId,
        content: replyContent.trim(),
      })
      .select('*')
      .single();

    if (insertError) {
      setError(`Yanıt gönderilemedi: ${insertError.message}`);
      setReplySubmitting(false);
      return;
    }

    setRepliesByComment((prev) => ({
      ...prev,
      [commentId]: [...(prev[commentId] ?? []), data as EpisodeReply],
    }));

    const targetComment = comments.find((item) => item.id === commentId);
    if (targetComment && targetComment.user_id !== userId) {
      await createNotification({
        user_id: targetComment.user_id,
        actor_id: userId,
        type: 'episode_reply',
        message: 'Yorumuna yanıt yazdı.',
        link: `/show/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
      });
    }

    setReplyContent('');
    setReplyingTo(null);
    setReplySubmitting(false);
  }

  return (
    <section className="mb-16 space-y-6">
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 flex flex-col gap-4">
        <p className="text-sm font-semibold text-white">Bölüm Sohbeti ve Puanlama</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} type="button">
              <span
                className="material-symbols-outlined text-2xl transition-colors"
                style={{
                  color: s <= rating ? '#D4A017' : 'rgba(255,255,255,0.2)',
                  fontVariationSettings: s <= rating ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                star
              </span>
            </button>
          ))}
          {rating > 0 && <span className="text-xs text-white/30 ml-2">{rating}/5</span>}
        </div>

        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none resize-none transition-colors"
          placeholder="Bu bölüm hakkında düşüncelerini yaz..."
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {!userId && (
          <p className="text-xs text-white/30">
            Yorum göndermek için <Link href="/signin" className="text-[#E50914] hover:text-white transition-colors">giriş yapmalısın</Link>.
          </p>
        )}

        <button
          type="button"
          onClick={submitComment}
          disabled={submitting || !content.trim() || rating === 0 || !userId}
          className="self-end px-6 py-2 bg-[#E50914] text-white text-sm font-semibold rounded-full hover:bg-red-700 transition-all disabled:opacity-40 flex items-center gap-2"
        >
          {submitting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Gönder'}
        </button>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-8"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-8 text-[#E50914]">
          <span className="material-symbols-outlined text-3xl mb-2">error</span>
          <p className="text-sm text-center">{error}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-white/20">
          <span className="material-symbols-outlined text-4xl mb-2">forum</span>
          <p className="text-sm">Henüz sohbet başlamadı. İlk yorumu sen yaz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const name = `Kullanıcı ${comment.user_id.slice(0, 6)}`;
            return (
              <div key={comment.id} className="bg-[#141414] border border-white/5 rounded-xl p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-lg">person</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{name}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-[12px]" style={{ color: s <= comment.rating ? '#D4A017' : 'rgba(255,255,255,0.15)', fontVariationSettings: s <= comment.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                      ))}
                    </div>
                    <span className="text-xs text-white/20">{new Date(comment.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      type="button"
                      onClick={() => toggleLike(comment.id)}
                      className={`text-xs transition-colors ${likedCommentIds[comment.id] ? 'text-[#D4A017]' : 'text-white/35 hover:text-white'}`}
                    >
                      Beğen ({likesByComment[comment.id] ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingTo((prev) => (prev === comment.id ? null : comment.id))}
                      className="text-xs text-white/35 hover:text-white transition-colors"
                    >
                      Yanıtla
                    </button>
                  </div>

                  {(repliesByComment[comment.id] ?? []).length > 0 && (
                    <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                      {(repliesByComment[comment.id] ?? []).map((reply) => (
                        <div key={reply.id} className="text-xs">
                          <p className="text-white/45">
                            Kullanıcı {reply.user_id.slice(0, 6)} • {new Date(reply.created_at).toLocaleDateString('tr-TR')}
                          </p>
                          <p className="text-white/65 mt-1">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingTo === comment.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/20 focus:border-[#E50914]/50 focus:outline-none resize-none"
                        placeholder="Yanıt yaz..."
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="button"
                          onClick={() => submitReply(comment.id)}
                          disabled={replySubmitting || !replyContent.trim() || !userId}
                          className="px-3 py-1.5 text-xs rounded-lg bg-[#E50914] text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                        >
                          {replySubmitting ? 'Gönderiliyor...' : 'Yanıt Gönder'}
                        </button>
                      </div>
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
