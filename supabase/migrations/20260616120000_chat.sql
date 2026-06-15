-- ============ chat_messages ============
-- One conversation per coach<->client pair, scoped by client_id (the client's profile id).
-- sender_id distinguishes whether the coach or the client sent the message.
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index chat_messages_client_id_idx on public.chat_messages(client_id, created_at);
alter table public.chat_messages enable row level security;

-- Client sees and sends in their own thread.
create policy "chat_client_select"
  on public.chat_messages for select to authenticated
  using (client_id = auth.uid());

create policy "chat_client_insert"
  on public.chat_messages for insert to authenticated
  with check (client_id = auth.uid() and sender_id = auth.uid());

-- Coach sees and sends in threads of their own clients.
create policy "chat_coach_select"
  on public.chat_messages for select to authenticated
  using (exists (select 1 from public.clients c
                 where c.id = chat_messages.client_id and c.coach_id = auth.uid()));

create policy "chat_coach_insert"
  on public.chat_messages for insert to authenticated
  with check (sender_id = auth.uid()
              and exists (select 1 from public.clients c
                          where c.id = chat_messages.client_id and c.coach_id = auth.uid()));

-- Either party may mark messages in their thread as read.
create policy "chat_client_update"
  on public.chat_messages for update to authenticated
  using (client_id = auth.uid());

create policy "chat_coach_update"
  on public.chat_messages for update to authenticated
  using (exists (select 1 from public.clients c
                 where c.id = chat_messages.client_id and c.coach_id = auth.uid()));

-- Enable realtime delivery for this table.
alter publication supabase_realtime add table public.chat_messages;
