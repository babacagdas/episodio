-- Supabase SQL: Ortak liste daveti için kolon + RLS
-- Dashboard > SQL Editor'de bir kez çalıştırın.

alter table public.lists
add column if not exists shared_with_user_id uuid null;

-- RLS (varsa zaten açık kalır)
alter table public.lists enable row level security;

-- LISTS SELECT: sahibi veya davetli görebilsin (public/private fark etmez)
drop policy if exists "lists_select_owner_or_shared" on public.lists;
create policy "lists_select_owner_or_shared"
on public.lists for select
using (auth.uid() = user_id or auth.uid() = shared_with_user_id or visibility = 'public');

-- LISTS UPDATE: sadece sahibi metadata güncellesin (mevcut davranışla uyumlu)
drop policy if exists "lists_update_owner" on public.lists;
create policy "lists_update_owner"
on public.lists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- LIST_ITEMS: ekleme yetkisi sahibi veya davetli (kabul sonrası)
alter table public.list_items enable row level security;

drop policy if exists "list_items_select_owner_or_shared_or_public" on public.list_items;
create policy "list_items_select_owner_or_shared_or_public"
on public.list_items for select
using (
  exists (
    select 1
    from public.lists l
    where l.id = list_id
      and (
        l.visibility = 'public'
        or auth.uid() = l.user_id
        or auth.uid() = l.shared_with_user_id
      )
  )
);

drop policy if exists "list_items_insert_owner_or_shared" on public.list_items;
create policy "list_items_insert_owner_or_shared"
on public.list_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.lists l
    where l.id = list_id
      and (auth.uid() = l.user_id or auth.uid() = l.shared_with_user_id)
  )
);

-- Silme mevcutta sadece owner UI ile yapılıyor, policy'yi bozmuyoruz (istersen ekleriz)

