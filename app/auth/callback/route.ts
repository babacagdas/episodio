import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (!existing) {
        const fallbackUsername = user.email?.split('@')[0] ?? user.id.slice(0, 8);
        const username =
          (user.user_metadata?.preferred_username as string | undefined) ||
          (user.user_metadata?.user_name as string | undefined) ||
          fallbackUsername;
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          '';
        const avatarUrl =
          (user.user_metadata?.avatar_url as string | undefined) ||
          (user.user_metadata?.picture as string | undefined) ||
          '';

        await supabase.from('profiles').insert({
          id: user.id,
          username: (username || fallbackUsername).toLowerCase().replace(/\s/g, ''),
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}/home`);
}
