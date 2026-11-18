
begin;

select plan(35);

-- ============================================================
-- 1. Test fixtures
-- ============================================================

-- Fixed UUIDs identify only the records created by this test.
-- The Auth trigger creates profiles and member roles.

insert into auth.users (
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'member-one@example.com',
  now(),
  '{"display_name":"Test Member One"}'::jsonb,
  now(),
  now()
),
(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'authenticated',
  'authenticated',
  'member-two@example.com',
  now(),
  '{"display_name":"Test Member Two"}'::jsonb,
  now(),
  now()
),
(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'authenticated',
  'authenticated',
  'admin@example.com',
  now(),
  '{"display_name":"Test Administrator"}'::jsonb,
  now(),
  now()
);

-- Promote the third test account using a trusted database operation.
update public.user_roles
set role = 'admin'
where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

-- Create membership fixtures using the existing annual plan.
-- Member one has a valid active membership.
-- Member two has pending, expired and suspended memberships.

insert into public.memberships (
  user_id,
  plan_id,
  status,
  starts_at,
  expires_at
)
values
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  (select id from public.membership_plans where code = 'annual'),
  'active',
  now() - interval '1 day',
  now() + interval '11 months'
),
(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  (select id from public.membership_plans where code = 'annual'),
  'pending',
  null,
  null
),
(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  (select id from public.membership_plans where code = 'annual'),
  'expired',
  now() - interval '13 months',
  now() - interval '1 month'
),
(
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  (select id from public.membership_plans where code = 'annual'),
  'suspended',
  now() - interval '1 day',
  now() + interval '11 months'
);


-- ============================================================
-- 2. Function execution permissions
-- ============================================================

select ok(
  not has_function_privilege(
    'anon',
    'public.has_role(uuid,text)',
    'EXECUTE'
  ),
  'Anonymous users cannot execute has_role'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.has_role(uuid,text)',
    'EXECUTE'
  ),
  'Authenticated users can execute has_role'
);

select ok(
  not has_function_privilege(
    'service_role',
    'public.has_role(uuid,text)',
    'EXECUTE'
  ),
  'Service role cannot directly execute has_role'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.has_active_membership(uuid)',
    'EXECUTE'
  ),
  'Anonymous users cannot execute has_active_membership'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.has_active_membership(uuid)',
    'EXECUTE'
  ),
  'Authenticated users can execute has_active_membership'
);

select ok(
  not has_function_privilege(
    'service_role',
    'public.has_active_membership(uuid)',
    'EXECUTE'
  ),
  'Service role cannot directly execute has_active_membership'
);


-- ============================================================
-- 3. Anonymous access restrictions
-- ============================================================

set local role anon;

select set_config('request.jwt.claim.sub', '', true);

select is(
  (
    select count(*)
    from public.profiles
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'Anonymous users cannot read member profiles'
);

select is(
  (
    select count(*)
    from public.user_roles
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'Anonymous users cannot read member roles'
);

select is(
  (
    select count(*)
    from public.memberships
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  0::bigint,
  'Anonymous users cannot read member memberships'
);


-- ============================================================
-- 4. Member-one row-level security
-- ============================================================

reset role;

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  true
);

select is(
  (
    select count(*)
    from public.profiles
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  1::bigint,
  'A member can read their own profile'
);

select is(
  (
    select count(*)
    from public.profiles
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  0::bigint,
  'A member cannot read another member profile'
);

select is(
  (
    select count(*)
    from public.user_roles
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  1::bigint,
  'A member can read their own role'
);

select is(
  (
    select count(*)
    from public.user_roles
    where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  0::bigint,
  'A member cannot read another users role'
);

select is(
  (
    select count(*)
    from public.memberships
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  1::bigint,
  'A member can read their own membership'
);

select is(
  (
    select count(*)
    from public.memberships
    where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  0::bigint,
  'A member cannot read another members memberships'
);


-- ============================================================
-- 5. Authorization helper behaviour
-- ============================================================

select ok(
  public.has_role(auth.uid(), 'member'),
  'A member can verify their own member role'
);

select ok(
  not public.has_role(auth.uid(), 'admin'),
  'A member cannot claim their own role is admin'
);

select ok(
  not public.has_role(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'admin'
  ),
  'A member cannot use has_role to verify another users admin role'
);

select ok(
  public.has_active_membership(auth.uid()),
  'A member with a valid active membership passes the membership check'
);

select ok(
  not public.has_active_membership(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  'A member cannot use the helper to verify another users membership'
);

-- ============================================================
-- 6. Member write restrictions
-- ============================================================

-- Members may update their own profile.

with updated as (
  update public.profiles
  set display_name = 'Updated by member test'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  returning id
)
select is(
  (select count(*) from updated),
  1::bigint,
  'A member can update their own profile'
);

-- Members cannot update another users profile.

with updated as (
  update public.profiles
  set display_name = 'Unauthorized update'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  returning id
)
select is(
  (select count(*) from updated),
  0::bigint,
  'A member cannot update another users profile'
);

-- Members cannot promote themselves or another user.

with updated as (
  update public.user_roles
  set role = 'admin'
  where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  returning user_id
)
select is(
  (select count(*) from updated),
  0::bigint,
  'A member cannot promote themselves to administrator'
);

with updated as (
  update public.user_roles
  set role = 'member'
  where user_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  returning user_id
)
select is(
  (select count(*) from updated),
  0::bigint,
  'A member cannot modify another users role'
);

-- Members cannot change membership records directly.

with updated as (
  update public.memberships
  set status = 'suspended'
  where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  returning id
)
select is(
  (select count(*) from updated),
  0::bigint,
  'A member cannot modify their own membership'
);

with updated as (
  update public.memberships
  set status = 'active'
  where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  returning id
)
select is(
  (select count(*) from updated),
  0::bigint,
  'A member cannot modify another users membership'
);

-- ============================================================
-- 7. Administrator row-level security
-- ============================================================

select set_config(
  'request.jwt.claim.sub',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  true
);

select ok(
  public.has_role(auth.uid(), 'admin'),
  'The administrator can verify their own admin role'
);

-- Count only the test fixtures, not unrelated local accounts.

select is(
  (
    select count(*)
    from public.profiles
    where id in (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )
  ),
  3::bigint,
  'The administrator can read all three test profiles'
);

select is(
  (
    select count(*)
    from public.user_roles
    where user_id in (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )
  ),
  3::bigint,
  'The administrator can read all three test user roles'
);

select is(
  (
    select count(*)
    from public.memberships
    where user_id in (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    )
  ),
  4::bigint,
  'The administrator can read all four test memberships'
);



-- ============================================================
-- 8. Administrator write permissions
-- ============================================================

-- Administrators can manage profiles.

with updated as (
  update public.profiles
  set display_name = 'Admin updated profile'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  returning id
)
select is(
  (select count(*) from updated),
  1::bigint,
  'An administrator can update another users profile'
);

-- Administrators can manage memberships.

with updated as (
  update public.memberships
  set status = 'suspended'
  where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    and status = 'pending'
  returning id
)
select is(
  (select count(*) from updated),
  1::bigint,
  'An administrator can update a membership'
);

-- Role changes remain restricted to trusted database operations.

with updated as (
  update public.user_roles
  set role = 'member'
  where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  returning user_id
)
select is(
  (select count(*) from updated),
  0::bigint,
  'An administrator cannot directly modify user roles through the API'
);


-- ============================================================
-- 9. Security properties
-- ============================================================

reset role;

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.has_role(uuid,text)'::regprocedure
  ),
  'has_role is a SECURITY DEFINER function'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.has_active_membership(uuid)'::regprocedure
  ),
  'has_active_membership is a SECURITY DEFINER function'
);


-- ============================================================
-- 10. Finish and clean up
-- ============================================================

select * from finish();

rollback;
