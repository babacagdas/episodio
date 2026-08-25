import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminEmail } from '@/lib/supabase/admin';

export const runtime = 'edge';

let memoryAnnouncement = {
  id: 'announcement-1',
  is_active: false,
  message: '',
  type: 'info',
  link: '',
  updated_at: new Date().toISOString(),
};

export async function GET() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const db = admin || supabase;

  try {
    const { data } = await db.from('site_settings').select('value').eq('key', 'announcement').maybeSingle();
    if (data?.value) {
      return NextResponse.json(data.value);
    }
  } catch {
    // continue
  }

  return NextResponse.json(memoryAnnouncement);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = {
      id: `announcement-${Date.now()}`,
      is_active: !!body.is_active,
      message: String(body.message || '').trim(),
      type: body.type || 'info',
      link: String(body.link || '').trim(),
      updated_at: new Date().toISOString(),
    };

    memoryAnnouncement = payload;

    const admin = createAdminClient();
    const db = admin || supabase;

    try {
      await db.from('site_settings').upsert({
        key: 'announcement',
        value: payload,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // continue
    }

    return NextResponse.json({ success: true, announcement: payload });
  } catch {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }
}
