import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';

export const runtime = 'edge';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { userId, is_banned } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 });
    }

    const admin = createAdminClient();
    const db = admin || supabase;

    // 1. Supabase Auth user metadata güncelleme
    if (admin) {
      try {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { is_banned: !!is_banned },
        });
      } catch {
        // continue
      }
    }

    // 2. Profiles tablosunda varsa is_banned alanını güncelleme
    try {
      await db.from('profiles').update({ is_banned: !!is_banned }).eq('id', userId);
    } catch {
      // continue
    }

    return NextResponse.json({ success: true, userId, is_banned: !!is_banned });
  } catch {
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}
