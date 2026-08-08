import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatClient from './ChatClient';

export const metadata = {
  title: 'Mesajlar - Episodio',
  description: 'Takipçileriniz ve arkadaşlarınızla gerçek zamanlı sohbet edin.',
};

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin?next=/chat');
  }

  const currentUser = {
    id: user.id,
    username: user.email?.split('@')[0] || 'kullanici',
    full_name: 'Kullanıcı',
    avatar_url: null,
  };

  return <ChatClient currentUser={currentUser} />;
}
