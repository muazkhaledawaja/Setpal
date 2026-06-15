-- ============================================================================
-- RLS for dashboard-created tables + admin features
-- ----------------------------------------------------------------------------
-- The clients / profiles / coaches tables were created in the Supabase
-- dashboard, so their RLS policies were never version-controlled. This
-- migration codifies the correct, idempotent policies so that:
--   * a coach can see their clients (and their clients' profiles),
--   * a client can see their coach (profile + coaches row),
--   * invite acceptance creates the clients row atomically (RPC, not a
--     permissive self-INSERT policy),
-- plus admin-facing features: dashboard stats, coach_id on the user list, and
-- admin write access to global (coach_id IS NULL) exercises.
--
-- Relies on the existing DB helper public.is_admin() (base schema).
-- Fully idempotent: drop-then-create policies, create-or-replace functions.
-- ============================================================================

alter table public.clients  enable row level security;
alter table public.profiles enable row level security;
alter table public.coaches  enable row level security;

-- ============================================================================
-- 1. clients RLS (Issue 1: coach can see their clients)
-- ============================================================================
drop policy if exists "clients_select_coach" on public.clients;
create policy "clients_select_coach"
  on public.clients for select
  using (coach_id = auth.uid());

drop policy if exists "clients_select_self" on public.clients;
create policy "clients_select_self"
  on public.clients for select
  using (id = auth.uid());

drop policy if exists "clients_select_admin" on public.clients;
create policy "clients_select_admin"
  on public.clients for select
  using (public.is_admin());

drop policy if exists "clients_update_coach" on public.clients;
create policy "clients_update_coach"
  on public.clients for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

drop policy if exists "clients_update_admin" on public.clients;
create policy "clients_update_admin"
  on public.clients for update
  using (public.is_admin());

-- Deliberately NO client self-INSERT: clients rows are created only by
-- accept_client_invite() (SECURITY DEFINER) below, so a client can never forge
-- a row pointing at an arbitrary coach.

-- ============================================================================
-- 2. profiles RLS (Issues 1 + 2: coach<->client can read each other's profile)
-- ============================================================================
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_select_coach_of_client" on public.profiles;
create policy "profiles_select_coach_of_client"
  on public.profiles for select
  using (exists (
    select 1 from public.clients c
    where c.id = profiles.id and c.coach_id = auth.uid()
  ));

drop policy if exists "profiles_select_client_of_coach" on public.profiles;
create policy "profiles_select_client_of_coach"
  on public.profiles for select
  using (exists (
    select 1 from public.clients c
    where c.id = auth.uid() and c.coach_id = profiles.id
  ));

-- admins_select_all_profiles / admins_update_all_profiles already exist
-- (20260615120000_account_status.sql); we re-assert them idempotently.
drop policy if exists "admins_select_all_profiles" on public.profiles;
create policy "admins_select_all_profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "admins_update_all_profiles" on public.profiles;
create policy "admins_update_all_profiles"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================================
-- 3. coaches RLS (Issue 2: client can read their coach's coaches row)
-- ============================================================================
drop policy if exists "coaches_select_self" on public.coaches;
create policy "coaches_select_self"
  on public.coaches for select
  using (id = auth.uid());

drop policy if exists "coaches_update_self" on public.coaches;
create policy "coaches_update_self"
  on public.coaches for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "coaches_select_client_of_coach" on public.coaches;
create policy "coaches_select_client_of_coach"
  on public.coaches for select
  using (exists (
    select 1 from public.clients c
    where c.id = auth.uid() and c.coach_id = coaches.id
  ));

drop policy if exists "coaches_select_admin" on public.coaches;
create policy "coaches_select_admin"
  on public.coaches for select
  using (public.is_admin());

-- ============================================================================
-- 4. accept_client_invite RPC (Issue 1: atomic invite acceptance)
-- ============================================================================
create or replace function public.accept_client_invite(invite_token text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite public.client_invites%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite
  from public.client_invites
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'invalid or expired invite token';
  end if;

  update public.client_invites
    set status = 'accepted', accepted_at = now()
    where id = v_invite.id;

  insert into public.clients (id, coach_id, status, start_date)
  values (v_uid, v_invite.coach_id, 'active', current_date)
  on conflict (id) do update
    set coach_id = excluded.coach_id, status = 'active';
end;
$$;

grant execute on function public.accept_client_invite(text) to authenticated;

-- ============================================================================
-- 5. admin_dashboard_stats RPC (Issue 5: richer dashboard)
-- ============================================================================
create or replace function public.admin_dashboard_stats()
returns table (
  total_users       bigint,
  pending_approvals bigint,
  active_users      bigint,
  suspended_users   bigint,
  total_coaches     bigint,
  active_coaches    bigint,
  total_clients     bigint,
  recent_signups    bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where status = 'pending'),
    (select count(*) from public.profiles where status = 'active'),
    (select count(*) from public.profiles where status = 'suspended'),
    (select count(*) from public.profiles where role = 'coach'),
    (select count(*) from public.profiles where role = 'coach' and status = 'active'),
    (select count(*) from public.profiles where role = 'client'),
    (select count(*) from public.profiles where created_at > now() - interval '7 days');
end;
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- ============================================================================
-- 6. admin_list_users RPC (Issue 5: add coach_id for client grouping)
-- ============================================================================
create or replace function public.admin_list_users()
returns table (
  id            uuid,
  full_name     text,
  email         text,
  role          text,
  status        text,
  locale        text,
  created_at    timestamptz,
  last_sign_in  timestamptz,
  client_count  bigint,
  coach_id      uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
    select
      p.id,
      p.full_name,
      u.email::text,
      p.role,
      p.status,
      p.locale,
      p.created_at,
      u.last_sign_in_at,
      (select count(*) from public.clients c where c.coach_id = p.id) as client_count,
      (select cl.coach_id from public.clients cl where cl.id = p.id)   as coach_id
    from public.profiles p
    join auth.users u on u.id = p.id
    order by
      case when p.status = 'pending' then 0 else 1 end,
      p.created_at desc;
end;
$$;

-- ============================================================================
-- 7. exercises admin RLS (Issue 6: admin manages global library)
-- ============================================================================
-- Admins may write any exercise row, including globals (coach_id IS NULL).
-- The existing coach policies (exercises_insert_own / _update_own / _delete_own,
-- scoped to coach_id = auth.uid()) remain unchanged.
drop policy if exists "exercises_insert_admin" on public.exercises;
create policy "exercises_insert_admin"
  on public.exercises for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "exercises_update_admin" on public.exercises;
create policy "exercises_update_admin"
  on public.exercises for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "exercises_delete_admin" on public.exercises;
create policy "exercises_delete_admin"
  on public.exercises for delete
  to authenticated
  using (public.is_admin());
