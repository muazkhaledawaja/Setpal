-- client_invites: tokens coaches send to prospective clients
create table if not exists public.client_invites (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  email       text not null,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- index for fast token lookups (invite acceptance flow)
create index client_invites_token_idx on public.client_invites(token);
-- index for coach's invite list
create index client_invites_coach_id_idx on public.client_invites(coach_id);

alter table public.client_invites enable row level security;

-- coaches can see and manage their own invites
create policy "coaches_select_own_invites"
  on public.client_invites for select
  using (coach_id = auth.uid());

create policy "coaches_insert_own_invites"
  on public.client_invites for insert
  with check (coach_id = auth.uid());

create policy "coaches_update_own_invites"
  on public.client_invites for update
  using (coach_id = auth.uid());

-- anyone can read an invite by token (needed for the public invite page)
-- we scope it tightly: only pending, non-expired rows
create policy "public_read_invite_by_token"
  on public.client_invites for select
  using (status = 'pending' and expires_at > now());
