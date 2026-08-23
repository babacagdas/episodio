import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

type TabType = 'followers' | 'following';

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get('profileId')?.trim() ?? '';
  const tabParam = req.nextUrl.searchParams.get('tab')?.trim() ?? '';
  const tab: TabType = tabParam === 'following' ? 'following' : 'followers';

  if (!profileId) return NextResponse.json([]);

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

  const relationField = tab === 'followers' ? 'follower_id' : 'following_id';
  const filterField = tab === 'followers' ? 'following_id' : 'follower_id';

  const { data: relations, error: relationError } = await supabase
    .from('follows')
    .select(relationField)
    .eq(filterField, profileId)
    .limit(100);

  if (relationError) return NextResponse.json([]);

  const ids: string[] = (relations ?? [])
    .map((row: Record<string, string>) => row[relationField])
    .filter(Boolean);

  if (ids.length === 0) return NextResponse.json([]);

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', ids);

  if (profileError) return NextResponse.json([]);

  const ordered = ids
    .map((id: string) => (profiles ?? []).find((profile: any) => profile.id === id))
    .filter(Boolean);

  return NextResponse.json(ordered);
}
