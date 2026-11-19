-- Restore administrator role authorization without MFA enforcement.

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

-- Preserve the original restricted execution permissions.
revoke all on function public.has_role(uuid, text)
  from public, anon, authenticated, service_role;

grant execute on function public.has_role(uuid, text)
  to authenticated;
