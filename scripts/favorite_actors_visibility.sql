-- Favori oyuncular görünürlüğü.
-- Varsayılan açık: kullanıcı isterse profilinden gizliye alabilir.
alter table public.profiles
  add column if not exists favorite_actors_visible boolean not null default true;

update public.profiles
set favorite_actors_visible = true
where favorite_actors_visible is null;

-- actor_swipes tablosu RLS okuma politikası
alter table public.actor_swipes enable row level security;

drop policy if exists "actor_swipes_select_public" on public.actor_swipes;
create policy "actor_swipes_select_public"
on public.actor_swipes for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = actor_swipes.user_id
      and coalesce(p.favorite_actors_visible, true) = true
  )
);
