import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SplashClient from './SplashClient';

export const runtime = 'edge';

export default async function Splash({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const nextPath = params.next ? `&next=${encodeURIComponent(params.next)}` : '';
    redirect(`/auth/callback?code=${params.code}${nextPath}`);
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user) {
    redirect('/home');
  }

  return <SplashClient />;
}
