
-- ============================================================
-- Scuba Review Platform
-- Initial database schema
-- ============================================================

-- ------------------------------------------------------------
-- 1. Updated-at timestamp function
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ------------------------------------------------------------
-- 2. User profiles and roles
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

comment on table public.user_roles is
  'Application roles. Role changes must be performed through trusted administrative operations.';


-- ------------------------------------------------------------
-- 3. Membership plans and memberships
-- ------------------------------------------------------------

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_minor_units integer not null check (price_minor_units >= 0),
  currency text not null default 'ZAR'
    check (currency = 'ZAR'),
  duration_months integer not null default 12
    check (duration_months = 12),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'expired', 'suspended')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_dates_valid check (
    expires_at is null
    or starts_at is null
    or expires_at > starts_at
  )
);

create index memberships_user_id_idx
  on public.memberships(user_id);

create index memberships_status_expiry_idx
  on public.memberships(status, expires_at);

-- The single annual membership plan.
insert into public.membership_plans (
  code,
  name,
  description,
  price_minor_units,
  currency,
  duration_months,
  is_active
)
values (
  'annual',
  'Annual Membership',
  '12 months of access to the scuba equipment review platform.',
  8000,
  'ZAR',
  12,
  true
);


-- ------------------------------------------------------------
-- 4. Brands
-- ------------------------------------------------------------

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_path text,
  logo_alt_text text,
  logo_mime_type text,
  logo_size_bytes bigint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 5. Categories and subcategories
-- ------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_not_own_parent
    check (parent_id is null or parent_id <> id),

  -- Required for the composite product subcategory foreign key.
  constraint categories_id_parent_unique
    unique (id, parent_id)
);

create index categories_parent_id_idx
  on public.categories(parent_id);

-- Restrict the hierarchy to one parent and one subcategory level.
create or replace function public.validate_category_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_parent_id uuid;
begin
  if new.parent_id is not null then
    select parent_id
    into parent_parent_id
    from public.categories
    where id = new.parent_id;

    if not found then
      raise exception 'Parent category does not exist.';
    end if;

    if parent_parent_id is not null then
      raise exception 'Subcategories cannot have their own subcategories.';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_category_parent_trigger
before insert or update of parent_id
on public.categories
for each row
execute function public.validate_category_parent();


-- ------------------------------------------------------------
-- 6. Products
-- ------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  subcategory_id uuid,
  name text not null,
  slug text not null unique,
  model_number text,
  description text,
  is_active boolean not null default true,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_subcategory_parent_fk
    foreign key (subcategory_id, category_id)
    references public.categories(id, parent_id)
    on delete restrict
);

create index products_brand_id_idx
  on public.products(brand_id);

create index products_category_id_idx
  on public.products(category_id);

create index products_subcategory_id_idx
  on public.products(subcategory_id);

create index products_published_idx
  on public.products(is_published, is_active);


-- ------------------------------------------------------------
-- 7. Flexible product specifications
-- ------------------------------------------------------------

create table public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  value jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint product_specifications_unique_name
    unique (product_id, name)
);

create index product_specifications_product_id_idx
  on public.product_specifications(product_id);


-- ------------------------------------------------------------
-- 8. Product image metadata
-- ------------------------------------------------------------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  image_type text not null default 'gallery'
    check (image_type in ('main', 'gallery')),
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_images_product_id_idx
  on public.product_images(product_id);

create unique index product_images_one_primary_per_product
  on public.product_images(product_id)
  where is_primary = true;


-- ------------------------------------------------------------
-- 9. Audit logs
-- ------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx
  on public.audit_logs(created_at desc);

create index audit_logs_actor_user_id_idx
  on public.audit_logs(actor_user_id);


-- ------------------------------------------------------------
-- 10. Authentication and authorization helper functions
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
      and role = checked_role
  );
$$;

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
      and status = 'active'
      and starts_at <= now()
      and expires_at > now()
  );
$$;

revoke all on function public.has_role(uuid, text) from public;
revoke all on function public.has_active_membership(uuid) from public;

grant execute on function public.has_role(uuid, text) to authenticated;
grant execute on function public.has_active_membership(uuid) to authenticated;


-- ------------------------------------------------------------
-- 11. Automatically create profiles and member roles
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'member');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ------------------------------------------------------------
-- 12. Updated-at triggers
-- ------------------------------------------------------------

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger membership_plans_updated_at
before update on public.membership_plans
for each row execute function public.set_updated_at();

create trigger memberships_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

create trigger brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create trigger categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_specifications_updated_at
before update on public.product_specifications
for each row execute function public.set_updated_at();

create trigger product_images_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 13. Enable Row Level Security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_specifications enable row level security;
alter table public.product_images enable row level security;
alter table public.audit_logs enable row level security;


-- ------------------------------------------------------------
-- 14. Profile policies
-- ------------------------------------------------------------

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'));

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));


-- ------------------------------------------------------------
-- 15. User role policies
-- ------------------------------------------------------------

create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Admins can read all roles"
on public.user_roles
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'));

-- Deliberately no authenticated INSERT, UPDATE or DELETE policy.
-- Role changes must use trusted administrative operations.


-- ------------------------------------------------------------
-- 16. Membership plan policies
-- ------------------------------------------------------------

create policy "Anyone can view active membership plans"
on public.membership_plans
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage membership plans"
on public.membership_plans
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));


-- ------------------------------------------------------------
-- 17. Membership policies
-- ------------------------------------------------------------

create policy "Users can view their own memberships"
on public.memberships
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Admins can manage memberships"
on public.memberships
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));

-- Members cannot directly activate or extend their memberships.


-- ------------------------------------------------------------
-- 18. Brand policies
-- ------------------------------------------------------------

create policy "Active members can view active brands"
on public.brands
for select
to authenticated
using (
  is_active = true
  and (
    public.has_active_membership((select auth.uid()))
    or public.has_role((select auth.uid()), 'admin')
  )
);

create policy "Admins can manage brands"
on public.brands
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));


-- ------------------------------------------------------------
-- 19. Category policies
-- ------------------------------------------------------------

create policy "Active members can view active categories"
on public.categories
for select
to authenticated
using (
  is_active = true
  and (
    public.has_active_membership((select auth.uid()))
    or public.has_role((select auth.uid()), 'admin')
  )
);

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));


-- ------------------------------------------------------------
-- 20. Product policies
-- ------------------------------------------------------------

create policy "Active members can view published products"
on public.products
for select
to authenticated
using (
  is_active = true
  and is_published = true
  and (
    public.has_active_membership((select auth.uid()))
    or public.has_role((select auth.uid()), 'admin')
  )
);

create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));


-- ------------------------------------------------------------
-- 21. Product specification policies
-- ------------------------------------------------------------

create policy "Members can view specifications of accessible products"
on public.product_specifications
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.is_active = true
      and p.is_published = true
      and (
        public.has_active_membership((select auth.uid()))
        or public.has_role((select auth.uid()), 'admin')
      )
  )
);

create policy "Admins can manage product specifications"
on public.product_specifications
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));


-- ------------------------------------------------------------
-- 22. Product image metadata policies
-- ------------------------------------------------------------

create policy "Members can view images of accessible products"
on public.product_images
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.is_active = true
      and p.is_published = true
      and (
        public.has_active_membership((select auth.uid()))
        or public.has_role((select auth.uid()), 'admin')
      )
  )
);

create policy "Admins can manage product image metadata"
on public.product_images
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));


-- ------------------------------------------------------------
-- 23. Audit log policies
-- ------------------------------------------------------------

create policy "Admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'));

-- No authenticated INSERT, UPDATE or DELETE policies.
-- Trusted server-side operations will write audit events.


-- ------------------------------------------------------------
-- 24. Private Supabase Storage buckets
-- ------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'brand-logos',
    'brand-logos',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'product-images',
    'product-images',
    false,
    15728640,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ------------------------------------------------------------
-- 25. Storage access policies
-- ------------------------------------------------------------

create policy "Members can view brand logos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'brand-logos'
  and (
    public.has_active_membership((select auth.uid()))
    or public.has_role((select auth.uid()), 'admin')
  )
);

create policy "Members can view product images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and (
    public.has_active_membership((select auth.uid()))
    or public.has_role((select auth.uid()), 'admin')
  )
);

create policy "Admins can upload brand logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'brand-logos'
  and public.has_role((select auth.uid()), 'admin')
);

create policy "Admins can update brand logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'brand-logos'
  and public.has_role((select auth.uid()), 'admin')
)
with check (
  bucket_id = 'brand-logos'
  and public.has_role((select auth.uid()), 'admin')
);

create policy "Admins can delete brand logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'brand-logos'
  and public.has_role((select auth.uid()), 'admin')
);

create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.has_role((select auth.uid()), 'admin')
);

create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.has_role((select auth.uid()), 'admin')
)
with check (
  bucket_id = 'product-images'
  and public.has_role((select auth.uid()), 'admin')
);

create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.has_role((select auth.uid()), 'admin')
);
