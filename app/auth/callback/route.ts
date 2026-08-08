import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(exchangeError.message)}`);
      }

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (user) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!existing) {
          const rawUsername =
            (user.user_metadata?.preferred_username as string | undefined) ||
            (user.user_metadata?.user_name as string | undefined) ||
            user.email?.split('@')[0] ||
            `user_${user.id.slice(0, 6)}`;

          const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
          const finalUsername = cleanUsername || `user_${user.id.slice(0, 6)}`;

          const fullName =
            (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.name as string | undefined) ||
            '';
          const avatarUrl =
            (user.user_metadata?.avatar_url as string | undefined) ||
            (user.user_metadata?.picture as string | undefined) ||
            '';

          await supabase.from('profiles').upsert(
            {
              id: user.id,
              username: finalUsername,
              full_name: fullName,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }
      }
    } catch (err) {
      console.error('Auth callback error:', err);
    }
  }

  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/home';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
