-- Foto: saved photographers + messaging (Session 3)

-- ============================================================
-- saved_photographers
-- ============================================================
create table public.saved_photographers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  photographer_id uuid references public.photographer_profiles(id) on delete cascade not null,
  created_at      timestamptz default now() not null,
  unique (user_id, photographer_id)
);

alter table public.saved_photographers enable row level security;

create policy "users can view their own saved photographers"
  on public.saved_photographers for select
  using (auth.uid() = user_id);

create policy "users can save photographers"
  on public.saved_photographers for insert
  with check (auth.uid() = user_id);

create policy "users can unsave photographers"
  on public.saved_photographers for delete
  using (auth.uid() = user_id);

-- ============================================================
-- conversations
-- ============================================================
create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references public.profiles(id) on delete cascade not null,
  photographer_id   uuid references public.photographer_profiles(id) on delete cascade not null,
  created_at        timestamptz default now() not null,
  unique (client_id, photographer_id)
);

alter table public.conversations enable row level security;

create policy "participants can view their conversations"
  on public.conversations for select
  using (
    auth.uid() = client_id
    or exists (
      select 1 from public.photographer_profiles
      where photographer_profiles.id = conversations.photographer_id
        and photographer_profiles.user_id = auth.uid()
    )
  );

create policy "clients can start conversations"
  on public.conversations for insert
  with check (auth.uid() = client_id);

-- ============================================================
-- messages
-- ============================================================
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  content         text not null check (char_length(content) <= 2000),
  read_at         timestamptz,
  created_at      timestamptz default now() not null
);

create index messages_conversation_id_created_at
  on public.messages (conversation_id, created_at asc);

alter table public.messages enable row level security;

create policy "participants can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.client_id = auth.uid()
          or exists (
            select 1 from public.photographer_profiles
            where photographer_profiles.id = conversations.photographer_id
              and photographer_profiles.user_id = auth.uid()
          )
        )
    )
  );

create policy "participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.client_id = auth.uid()
          or exists (
            select 1 from public.photographer_profiles
            where photographer_profiles.id = conversations.photographer_id
              and photographer_profiles.user_id = auth.uid()
          )
        )
    )
  );

-- Recipients (not the sender) need to be able to mark messages as read.
create policy "participants can mark received messages as read"
  on public.messages for update
  using (
    sender_id != auth.uid()
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.client_id = auth.uid()
          or exists (
            select 1 from public.photographer_profiles
            where photographer_profiles.id = conversations.photographer_id
              and photographer_profiles.user_id = auth.uid()
          )
        )
    )
  )
  with check (sender_id != auth.uid());

-- ============================================================
-- Realtime: broadcast INSERTs on messages to subscribed clients
-- ============================================================
alter publication supabase_realtime add table public.messages;
