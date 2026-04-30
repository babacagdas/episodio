import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type TabType = 'followers' | 'following';

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get('profileId')?.trim() ?? '';
  const tabParam = req.nextUrl.searchParams.get('tab')?.trim() ?? '';
  const tab: TabType = tabParam === 'following' ? 'following' : 'followers';

  if (!profileId) return NextResponse.json([]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json([]);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const relationField = tab === 'followers' ? 'follower_id' : 'following_id';
  const filterField = tab === 'followers' ? 'following_id' : 'follower_id';

  const { data: relations, error: relationError } = await supabase
    .from('follows')
    .select(relationField)
    .eq(filterField, profileId)
    .limit(100);

  if (relationError) return NextResponse.json([]);

  const ids = (relations ?? [])
    .map((row: Record<string, string>) => row[relationField])
    .filter(Boolean);

  if (ids.length === 0) return NextResponse.json([]);

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', ids);

  if (profileError) return NextResponse.json([]);

  const ordered = ids
    .map((id) => (profiles ?? []).find((profile) => profile.id === id))
    .filter(Boolean);

  return NextResponse.json(ordered);
}
