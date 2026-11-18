-- ------------------------------------------------------------
-- Harden authentication and authorization helper functions
-- ------------------------------------------------------------

-- Users may only check their own role.
create or replace function public.has_role(
  checked_user_id uuid,
  checked_role text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = checked_user_id
      and user_id = (select auth.uid())
      and role = checked_role
  );
$$;


-- Users may only check their own membership status.
create or replace function public.has_active_membership(
  checked_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships
    where user_id = checked_user_id
      and user_id = (select auth.uid())
      and status = 'active'
      and starts_at <= now()
      and expires_at > now()
  );
$$;


-- Remove execution permissions from all API roles and PUBLIC.
revoke all on function public.has_role(uuid, text)
  from public, anon, authenticated, service_role;

revoke all on function public.has_active_membership(uuid)
  from public, anon, authenticated, service_role;


-- Restore execution only for authenticated users.
grant execute on function public.has_role(uuid, text)
  to authenticated;

grant execute on function public.has_active_membership(uuid)
  to authenticated;