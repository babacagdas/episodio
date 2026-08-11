import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function ensureProfile(supabase: any) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) return;

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
      const baseUsername = cleanUsername || `user_${user.id.slice(0, 6)}`;
      let finalUsername = baseUsername;
      let counter = 1;

      while (true) {
        const { data: taken } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', finalUsername)
          .neq('id', user.id)
          .maybeSingle();

        if (!taken) break;
        finalUsername = `${baseUsername}_${counter}`;
        counter++;
      }

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
  } catch (err) {
    console.error('ensureProfile error:', err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as any;
  const next = searchParams.get('next');

  const supabase = await createClient();

  // 1. Email OTP / Token Hash Doğrulaması (PKCE Bağımsız)
  if (token_hash && type) {
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash,
        type,
      });

      if (!otpError) {
        await ensureProfile(supabase);
        const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/home';
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
    } catch {
      // continue
    }
  }

  // 2. PKCE Authorization Code Exchange
  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        const { data: currentUser } = await supabase.auth.getUser();
        if (currentUser?.user) {
          return NextResponse.redirect(`${origin}/home`);
        }

        const friendlyInfo = 'E-posta doğrulaması tamamlandı. Lütfen e-posta ve şifrenizle giriş yapın.';
        return NextResponse.redirect(`${origin}/signin?msg=${encodeURIComponent(friendlyInfo)}`);
      }

      await ensureProfile(supabase);
    } catch {
      // continue
    }
  }

  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/home';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
