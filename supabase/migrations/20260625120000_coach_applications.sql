-- supabase/migrations/20260625120000_coach_applications.sql

create table public.coach_applications (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  full_name     text not null,
  email         text not null,
  phone         text not null,
  city          text not null,
  specialty     text not null check (specialty in ('fitness', 'nutrition', 'both')),
  client_count  int not null default 0,
  status        text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected')),
  admin_notes   text
);

-- No RLS policies: anon cannot select/update. Admin client (service role) bypasses RLS entirely.
-- Index for admin list view (newest first).
create index coach_applications_created_at_idx on public.coach_applications (created_at desc);
