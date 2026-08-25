import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';

export const runtime = 'edge';

const ALLOWED_TABLES = [
  'watch_status',
  'lists',
  'reviews',
  'show_notes',
  'episode_discussions',
  'episode_comment_replies',
] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { table, id } = await request.json();

    if (!table || !id || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Geçersiz tablo veya ID' }, { status: 400 });
    }

    const admin = createAdminClient();
    const db = admin || supabase;

    const { error } = await db.from(table).delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, table, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Silme işlemi başarısız' }, { status: 500 });
  }
}
