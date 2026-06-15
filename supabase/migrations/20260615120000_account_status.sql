-- ============================================================================
-- Account approval layer
-- Adds a `status` column to profiles so that signing up / logging in does NOT
-- by itself grant coach/client access. New signups land in 'pending' and must
-- be approved by an admin, who assigns their real role.
-- ============================================================================

-- 1. Status column ----------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended'));

-- Backfill: everyone who already exists keeps working (they predate this gate).
update public.profiles set status = 'active' where status = 'pending';

create index if not exists profiles_status_idx on public.profiles(status);

-- 2. handle_new_user trigger -------------------------------------------------
-- New rows are created as 'pending'. We still read role/full_name/locale from
-- the signup metadata, but we DEFER creating the coaches row until an admin
-- approves the account (so trial clocks don't start for unapproved users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role   text := coalesce(new.raw_user_meta_data->>'role', 'coach');
  meta_name   text := coalesce(new.raw_user_meta_data->>'full_name', new.email);
  meta_locale text := coalesce(new.raw_user_meta_data->>'locale', 'ar');
begin
  if meta_role not in ('admin', 'coach', 'client') then
    meta_role := 'coach';
  end if;
  if meta_locale not in ('ar', 'en') then
    meta_locale := 'ar';
  end if;

  insert into public.profiles (id, role, full_name, locale, status)
  values (new.id, meta_role, meta_name, meta_locale, 'pending')
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 3. Admin RLS on profiles ---------------------------------------------------
-- Admins can read and update every profile (needed for the users-management
-- page). is_admin() already exists per the base schema.
drop policy if exists "admins_select_all_profiles" on public.profiles;
create policy "admins_select_all_profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "admins_update_all_profiles" on public.profiles;
create policy "admins_update_all_profiles"
  on public.profiles for update
  using (public.is_admin());

-- 4. approve_user RPC --------------------------------------------------------
-- Sets role + status='active' and, for coaches, creates the coaches row with a
-- fresh 14-day trial if it doesn't exist yet. Admin-only.
create or replace function public.approve_user(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_role not in ('admin', 'coach', 'client') then
    raise exception 'invalid role: %', new_role;
  end if;

  update public.profiles
    set role = new_role, status = 'active', updated_at = now()
    where id = target;

  if new_role = 'coach' then
    insert into public.coaches (id, trial_ends_at)
    values (target, now() + interval '14 days')
    on conflict (id) do nothing;
  end if;
end;
$$;

-- 5. set_user_status RPC -----------------------------------------------------
-- Suspend / reactivate without touching role. Admin-only.
create or replace function public.set_user_status(target uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if new_status not in ('pending', 'active', 'suspended') then
    raise exception 'invalid status: %', new_status;
  end if;

  update public.profiles
    set status = new_status, updated_at = now()
    where id = target;
end;
$$;

-- 6. admin_list_users RPC ----------------------------------------------------
-- Returns profile rows joined with auth.users email + last_sign_in_at and the
-- coach's client count. Admin-only; avoids needing the service-role client in
-- application code.
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
  client_count  bigint
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
      (select count(*) from public.clients c where c.coach_id = p.id) as client_count
    from public.profiles p
    join auth.users u on u.id = p.id
    order by
      case when p.status = 'pending' then 0 else 1 end,
      p.created_at desc;
end;
$$;
