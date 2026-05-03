'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserList {
  id: string;
  user_id: string;
  shared_with_user_id?: string | null;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  created_at: string;
}

export interface ListShowItem {
  show_id: number;
  show_name: string;
  poster_path: string | null;
}

export function useLists() {
  const [lists, setLists] = useState<UserList[]>([]);
  const [sharedLists, setSharedLists] = useState<UserList[]>([]);
  const [likedLists, setLikedLists] = useState<UserList[]>([]);
  const [countsByListId, setCountsByListId] = useState<Record<string, number>>({});
  const [postersByListId, setPostersByListId] = useState<Record<string, string[]>>({});
  const [likesByListId, setLikesByListId] = useState<Record<string, number>>({});
  const [likedByMeMap, setLikedByMeMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLists = useCallback(async () => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setLists([]);
      setSharedLists([]);
      setLikedLists([]);
      setCountsByListId({});
      setPostersByListId({});
      setLikesByListId({});
      setLikedByMeMap({});
      setLoading(false);
      return;
    }

    const [{ data: listsData, error: listsError }, { data: likedRows }] = await Promise.all([
      supabase
        .from('lists')
        .select('id, user_id, shared_with_user_id, name, description, visibility, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('list_likes')
        .select('list_id')
        .eq('user_id', user.id),
    ]);

    if (listsError) {
      setError(listsError.message);
      setLists([]);
      setSharedLists([]);
      setLikedLists([]);
      setCountsByListId({});
      setPostersByListId({});
      setLikesByListId({});
      setLikedByMeMap({});
      setLoading(false);
      return;
    }

    const likedIds = Array.from(new Set((likedRows ?? []).map((row: { list_id: string }) => row.list_id)));
    const likedMap: Record<string, boolean> = {};
    likedIds.forEach((id) => { likedMap[id] = true; });
    setLikedByMeMap(likedMap);

    const [{ data: likedListsData }, { data: sharedListsData }] = await Promise.all([
      likedIds.length > 0
      ? await supabase
          .from('lists')
          .select('id, user_id, shared_with_user_id, name, description, visibility, created_at')
          .in('id', likedIds)
          .order('created_at', { ascending: false })
      : { data: [] as any[] },
      supabase
        .from('lists')
        .select('id, user_id, shared_with_user_id, name, description, visibility, created_at')
        .eq('shared_with_user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const parsedLists = (listsData ?? []) as UserList[];
    const parsedSharedLists = (sharedListsData ?? []) as UserList[];
    const parsedLikedLists = ((likedListsData ?? []) as UserList[]).filter((list) => list.user_id !== user.id);
    setLists(parsedLists);
    setSharedLists(parsedSharedLists);
    setLikedLists(parsedLikedLists);

    const relevantIds = Array.from(new Set([
      ...parsedLists.map((list) => list.id),
      ...parsedSharedLists.map((list) => list.id),
      ...parsedLikedLists.map((list) => list.id),
    ]));

    if (relevantIds.length === 0) {
      setCountsByListId({});
      setPostersByListId({});
      setLikesByListId({});
      setLoading(false);
      return;
    }

    const [{ data: itemsData }, { data: likesData }] = await Promise.all([
      supabase
        .from('list_items')
        .select('list_id, poster_path')
        .in('list_id', relevantIds),
      supabase
        .from('list_likes')
        .select('list_id')
        .in('list_id', relevantIds),
    ]);

    const counts: Record<string, number> = {};
    const posters: Record<string, string[]> = {};
    (itemsData ?? []).forEach((row: { list_id: string; poster_path: string | null }) => {
      counts[row.list_id] = (counts[row.list_id] ?? 0) + 1;
      if (!posters[row.list_id]) posters[row.list_id] = [];
      if (row.poster_path && posters[row.list_id].length < 4) posters[row.list_id].push(row.poster_path);
    });

    const likesCount: Record<string, number> = {};
    (likesData ?? []).forEach((row: { list_id: string }) => {
      likesCount[row.list_id] = (likesCount[row.list_id] ?? 0) + 1;
    });

    setCountsByListId(counts);
    setPostersByListId(posters);
    setLikesByListId(likesCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const createList = useCallback(async (payload: {
    name: string;
    description?: string;
    visibility?: 'public' | 'private';
    invitedUserId?: string | null;
  }) => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) return { ok: false, message: 'Giriş yapmalısın.' };

    const { data, error: insertError } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        visibility: payload.visibility ?? 'public',
      })
      .select('id, user_id, name, description, visibility, created_at')
      .single();

    if (insertError) {
      return { ok: false, message: insertError.message };
    }

    const newList = data as UserList;
    setLists((prev) => [newList, ...prev]);
    setCountsByListId((prev) => ({ ...prev, [newList.id]: 0 }));
    setPostersByListId((prev) => ({ ...prev, [newList.id]: [] }));
    setLikesByListId((prev) => ({ ...prev, [newList.id]: 0 }));
    // Opsiyonel davet: listeyi paylaşımlı yapmadan sadece bildirim gönderiyoruz (kabul edince shared_with_user_id set edilir)
    if (payload.invitedUserId) {
      try {
        await fetch('/api/lists/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listId: newList.id, invitedUserId: payload.invitedUserId }),
        });
      } catch {}
    }
    return { ok: true, list: newList };
  }, []);

  const addShowToList = useCallback(async (payload: {
    listId: string;
    showId: number;
    showName: string;
    posterPath: string | null;
  }) => {
    const supabase = createClient();
    const { error: insertError } = await supabase.from('list_items').insert({
      list_id: payload.listId,
      show_id: payload.showId,
      show_name: payload.showName,
      poster_path: payload.posterPath,
    });

    if (insertError) {
      return { ok: false, message: insertError.message };
    }

    setCountsByListId((prev) => ({ ...prev, [payload.listId]: (prev[payload.listId] ?? 0) + 1 }));
    if (payload.posterPath) {
      setPostersByListId((prev) => {
        const current = prev[payload.listId] ?? [];
        if (current.length >= 4 || current.includes(payload.posterPath as string)) return prev;
        return { ...prev, [payload.listId]: [...current, payload.posterPath as string] };
      });
    }
    return { ok: true };
  }, []);

  return {
    lists,
    sharedLists,
    likedLists,
    countsByListId,
    postersByListId,
    likesByListId,
    likedByMeMap,
    loading,
    error,
    createList,
    addShowToList,
    reload: loadLists,
  };
}
