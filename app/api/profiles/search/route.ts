import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const safeQuery = q
    .replace(/[%,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);

  if (safeQuery.length < 2) return NextResponse.json([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let supabase: any;
  if (supabaseUrl && serviceRoleKey) {
    supabase = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } else {
    supabase = await createServerClient();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url')
    .or(`username.ilike.%${safeQuery}%,full_name.ilike.%${safeQuery}%`)
    .order('updated_at', { ascending: false })
    .limit(12);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
