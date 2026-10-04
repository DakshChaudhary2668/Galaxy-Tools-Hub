-- Sprint 7C.5: minimal merchandising controls and an empty coupons foundation.

alter table public.products
  add column if not exists show_on_homepage boolean not null default true;

create index if not exists products_active_homepage_idx
  on public.products (is_active, show_on_homepage, created_at desc);

create unique index if not exists brands_normalized_name_unique
  on public.brands (lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

create unique index if not exists product_images_one_primary_per_product
  on public.product_images (product_id) where is_primary;

create or replace function public.set_primary_product_image(p_product_id uuid, p_image_id uuid)
returns public.product_images
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_image public.product_images;
begin
  select * into v_image
  from public.product_images
  where id = p_image_id and product_id = p_product_id
  for update;

  if not found then
    raise exception 'Product image not found';
  end if;

  update public.product_images set is_primary = false
  where product_id = p_product_id and is_primary;

  update public.product_images set is_primary = true
  where id = p_image_id and product_id = p_product_id
  returning * into v_image;

  return v_image;
end;
$$;

revoke all on function public.set_primary_product_image(uuid, uuid) from public, anon, authenticated;
grant execute on function public.set_primary_product_image(uuid, uuid) to service_role;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  discount_type text not null,
  discount_value numeric(12, 2) not null,
  minimum_order_amount numeric(12, 2),
  maximum_discount_amount numeric(12, 2),
  usage_limit integer,
  usage_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_normalized check (code = upper(btrim(code)) and code <> ''),
  constraint coupons_discount_type_check check (discount_type in ('PERCENTAGE', 'FIXED')),
  constraint coupons_discount_value_positive check (discount_value > 0),
  constraint coupons_percentage_max_check check (discount_type <> 'PERCENTAGE' or discount_value <= 100),
  constraint coupons_minimum_order_nonnegative check (minimum_order_amount is null or minimum_order_amount >= 0),
  constraint coupons_maximum_discount_nonnegative check (maximum_discount_amount is null or maximum_discount_amount >= 0),
  constraint coupons_maximum_discount_percentage_only check (maximum_discount_amount is null or discount_type = 'PERCENTAGE'),
  constraint coupons_usage_limit_positive check (usage_limit is null or usage_limit > 0),
  constraint coupons_usage_count_nonnegative check (usage_count >= 0),
  constraint coupons_usage_count_within_limit check (usage_limit is null or usage_count <= usage_limit),
  constraint coupons_date_range_valid check (starts_at is null or expires_at is null or starts_at < expires_at)
);

create unique index if not exists coupons_code_unique on public.coupons (code);
create index if not exists coupons_active_window_idx on public.coupons (is_active, starts_at, expires_at);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_coupon_id_fkey' and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_coupon_id_fkey foreign key (coupon_id) references public.coupons(id) on delete restrict;
  end if;
end;
$$;

alter table public.coupons enable row level security;
revoke all on table public.coupons from anon, authenticated;
grant all on table public.coupons to service_role;

comment on table public.coupons is
  'Admin-managed coupon definitions. Redemption remains disabled until it can be integrated atomically with payment finalization.';

comment on column public.products.show_on_homepage is
  'Controls homepage merchandising independently of global catalog visibility and purchase eligibility.';
