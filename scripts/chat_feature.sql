-- Supabase SQL: Real-time chat (Mesajlaşma) özelliği için tablo ve RLS tanımları
-- Dashboard > SQL Editor'de bir kez çalıştırın.

create table if not exists public.direct_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  is_read boolean default false not null
);

-- Hızlı sorgular için indeksler
create index if not exists idx_direct_messages_sender_receiver on public.direct_messages(sender_id, receiver_id);
create index if not exists idx_direct_messages_created_at on public.direct_messages(created_at);

-- Row Level Security (RLS) etkinleştirme
alter table public.direct_messages enable row level security;

-- Mesaj okuma politikası: Gönderen veya alıcı mesajı görebilir
drop policy if exists "direct_messages_select" on public.direct_messages;
create policy "direct_messages_select"
  on public.direct_messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Mesaj gönderme politikası: Sadece kendi adına mesaj gönderebilir
drop policy if exists "direct_messages_insert" on public.direct_messages;
create policy "direct_messages_insert"
  on public.direct_messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Real-time (Gerçek zamanlı yayın) aktifleştirme
-- Eğer 'supabase_realtime' yayını yoksa önce oluşturulmalıdır:
-- create publication supabase_realtime;
alter publication supabase_realtime add table public.direct_messages;
