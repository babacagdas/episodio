import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';



export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');

  if (!targetUserId) {
    return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 });
  }

  const admin = createAdminClient();
  const db = admin || supabase;

  try {
    const [watchedRes, listsRes, reviewsRes, notesRes, epDiscussionsRes, epRepliesRes] = await Promise.all([
      db.from('watch_status').select('id, show_id, show_name, status, updated_at').eq('user_id', targetUserId).order('updated_at', { ascending: false }).limit(50),
      db.from('lists').select('id, name, visibility, created_at').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(50),
      db.from('reviews').select('id, show_id, rating, content, created_at').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(50),
      db.from('show_notes').select('id, show_id, show_name, content, is_public, updated_at').eq('user_id', targetUserId).order('updated_at', { ascending: false }).limit(50),
      db.from('episode_discussions').select('id, show_id, season_number, episode_number, content, created_at').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(50),
      db.from('episode_comment_replies').select('id, comment_id, content, created_at').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(50),
    ]);

    return NextResponse.json({
      watched: watchedRes.data ?? [],
      lists: listsRes.data ?? [],
      reviews: reviewsRes.data ?? [],
      notes: notesRes.data ?? [],
      epDiscussions: epDiscussionsRes.data ?? [],
      epReplies: epRepliesRes.data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Veri çekme hatası' }, { status: 500 });
  }
}
