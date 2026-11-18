-- ------------------------------------------------------------
-- Require AAL2 for administrator database permissions
-- ------------------------------------------------------------

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
      and (
        checked_role <> 'admin'
        or (select auth.jwt() ->> 'aal') = 'aal2'
      )
  );
$$;