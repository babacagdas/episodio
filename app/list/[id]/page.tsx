import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { MobileHeader, BottomNav } from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';
import ListDetailClient from './ListDetailClient';

interface ListPageParams {
  id: string;
}

interface ListData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  created_at: string;
}

interface ListItemData {
  show_id: number;
  show_name: string;
  poster_path: string | null;
}

export default async function ListDetailPage({ params }: { params: Promise<ListPageParams> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData.user?.id ?? null;

  const { data: listRaw } = await supabase
    .from('lists')
    .select('id, user_id, shared_with_user_id, name, description, visibility, created_at')
    .eq('id', id)
    .single();

  const list = listRaw as (ListData & { shared_with_user_id?: string | null }) | null;
  if (!list) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-lg font-semibold mb-2">Liste bulunamadı</p>
          <Link href="/profile" className="text-[#D4A017] hover:text-white transition-colors text-sm">
            Profile dön
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === list.user_id;
  const isSharedWithMe = !!currentUserId && list.shared_with_user_id === currentUserId;
  if (list.visibility === 'private' && !isOwner && !isSharedWithMe) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-lg font-semibold mb-2">Bu liste gizli</p>
          <p className="text-sm text-white/40">Yalnızca liste sahibi görüntüleyebilir.</p>
        </div>
      </div>
    );
  }

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', list.user_id)
    .maybeSingle();

  const { data: itemsRaw } = await supabase
    .from('list_items')
    .select('show_id, show_name, poster_path')
    .eq('list_id', list.id)
    .order('added_at', { ascending: false });

  const [{ count: likesCount }, likedRow] = await Promise.all([
    supabase
      .from('list_likes')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', list.id),
    currentUserId
      ? supabase
          .from('list_likes')
          .select('id')
          .eq('list_id', list.id)
          .eq('user_id', currentUserId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const items = (itemsRaw ?? []) as ListItemData[];
  const ownerName = ownerProfile?.full_name || ownerProfile?.username || 'Kullanıcı';
  const ownerUsername = ownerProfile?.username ?? null;

  return (
    <div className="font-body-md text-body-md antialiased pb-24 md:pb-0">
      <MobileHeader />
      <Sidebar />

      <main className="md:ml-[240px] px-margin-mobile md:px-12 py-8 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2 text-xs text-white/35 mb-4">
          <Link href={isOwner ? '/profile' : ownerUsername ? `/u/${ownerUsername}` : '/search'} className="hover:text-white transition-colors">
            {isOwner ? 'Profil' : ownerName}
          </Link>
          <span>•</span>
          <span>Liste</span>
        </div>

        <ListDetailClient
          listId={list.id}
          initialName={list.name}
          initialDescription={list.description}
          visibility={list.visibility}
          ownerName={ownerName}
          isOwner={isOwner}
          isSharedWithMe={isSharedWithMe}
          currentUserId={currentUserId}
          sharedWithUserId={list.shared_with_user_id ?? null}
          initialItems={items}
          initialLikesCount={likesCount ?? 0}
          initiallyLiked={!!likedRow.data}
        />
      </main>

      <BottomNav />
    </div>
  );
}
