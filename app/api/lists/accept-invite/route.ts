import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const me = authData.user;
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as null | { listId?: string };
  const listId = body?.listId?.trim() ?? '';
  if (!listId) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: list } = await admin
    .from('lists')
    .select('id, user_id, shared_with_user_id')
    .eq('id', listId)
    .maybeSingle();

  if (!list) return NextResponse.json({ error: 'Liste bulunamadı.' }, { status: 404 });
  if (list.user_id === me.id) return NextResponse.json({ error: 'Zaten liste sahibisin.' }, { status: 400 });
  if (list.shared_with_user_id) {
    if (list.shared_with_user_id === me.id) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: 'Liste başka biriyle paylaşılıyor.' }, { status: 400 });
  }

  const { error } = await admin
    .from('lists')
    .update({ shared_with_user_id: me.id })
    .eq('id', listId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

