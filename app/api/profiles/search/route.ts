import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json([]);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url')
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .order('updated_at', { ascending: false })
    .limit(12);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
