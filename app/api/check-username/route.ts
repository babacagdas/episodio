import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUsername = searchParams.get('username') || '';
  const cleanUsername = rawUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');

  if (!cleanUsername || cleanUsername.length < 3) {
    return NextResponse.json({ available: false, message: 'Kullanıcı adı en az 3 karakter olmalı.' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (data) {
      return NextResponse.json({ available: false, message: `❌ @${cleanUsername} kullanıcı adı başkası tarafından alınmış!` });
    }

    return NextResponse.json({ available: true, message: `✅ @${cleanUsername} kullanılabilir.` });
  } catch {
    return NextResponse.json({ available: true, message: `✅ @${cleanUsername} kullanılabilir.` });
  }
}
