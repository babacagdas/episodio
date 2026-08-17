import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WrappedClient from './WrappedClient';

export const metadata = {
  title: 'Dizi Özeti (Wrapped) | Episodio',
  description: 'Episodio kişisel dizi izleme özetiniz ve istatistikleriniz.',
};

export default async function WrappedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?next=/wrapped');
  }

  // Kullanıcının profilini al
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  // İzleme geçmişini al
  const { data: watchRows } = await supabase
    .from('watch_status')
    .select('show_id, status, rating, updated_at')
    .eq('user_id', user.id);

  const watchedShows = watchRows ?? [];

  return (
    <WrappedClient
      user={{
        id: user.id,
        email: user.email ?? '',
        username: profile?.username || profile?.full_name || 'Dizi Sever',
        avatar_url: profile?.avatar_url || '',
      }}
      initialWatchData={watchedShows}
    />
  );
}
