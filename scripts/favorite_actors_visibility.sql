-- Favori oyuncular görünürlüğü.
-- Varsayılan açık: kullanıcı isterse profilinden gizliye alabilir.
alter table public.profiles
  add column if not exists favorite_actors_visible boolean not null default true;

update public.profiles
set favorite_actors_visible = true
where favorite_actors_visible is null;
