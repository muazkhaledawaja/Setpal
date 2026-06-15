-- Admin-only RPC to permanently delete a user from auth.users.
-- Cascades to profiles (FK), clients, coaches rows automatically.
-- Guards with is_admin() so only admins can call it.

create or replace function public.delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  -- Prevent admin from deleting themselves
  if target = auth.uid() then
    raise exception 'cannot delete your own account';
  end if;

  delete from auth.users where id = target;
end;
$$;

grant execute on function public.delete_user(uuid) to authenticated;
