import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const me = authData.user;
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as null | {
    listId?: string;
    invitedUserId?: string;
  };
  const listId = body?.listId?.trim() ?? '';
  const invitedUserId = body?.invitedUserId?.trim() ?? '';
  if (!listId || !invitedUserId) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  if (invitedUserId === me.id) return NextResponse.json({ error: 'Kendini davet edemezsin.' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // Liste gerçekten bende mi?
  const { data: list } = await admin
    .from('lists')
    .select('id, user_id, name, shared_with_user_id')
    .eq('id', listId)
    .maybeSingle();

  if (!list) return NextResponse.json({ error: 'Liste bulunamadı.' }, { status: 404 });
  if (list.user_id !== me.id) return NextResponse.json({ error: 'Bu listeyi sadece sahibi paylaşabilir.' }, { status: 403 });
  if (list.shared_with_user_id) return NextResponse.json({ error: 'Bu liste zaten paylaşımlı.' }, { status: 400 });

  // Davet edilen kullanıcı var mı?
  const { data: invited } = await admin.from('profiles').select('id').eq('id', invitedUserId).maybeSingle();
  if (!invited) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

  // Bildirim (sadece davetliye)
  const link = `/list/${listId}?invite=1`;
  const { error: notifyError } = await admin.from('notifications').insert({
    user_id: invitedUserId,
    actor_id: me.id,
    type: 'list_invite',
    message: `Seni bir listeye davet etti: ${list.name}`,
    link,
  });
  if (notifyError) return NextResponse.json({ error: notifyError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

