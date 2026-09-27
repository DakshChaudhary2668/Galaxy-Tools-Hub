-- Sprint 4B: durable stock reservations and one atomic payment finalizer.
-- Payment gateway/transaction uniqueness is intentionally owned by the prior migration.

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  status text not null default 'ACTIVE',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_reservations
  add column if not exists consumed_at timestamptz,
  add column if not exists released_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.inventory_reservations'::regclass
      and conname = 'inventory_reservations_quantity_positive'
  ) then
    alter table public.inventory_reservations
      add constraint inventory_reservations_quantity_positive check (quantity > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.inventory_reservations'::regclass
      and conname = 'inventory_reservations_status_valid'
  ) then
    alter table public.inventory_reservations
      add constraint inventory_reservations_status_valid
      check (status in ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.inventory'::regclass
      and conname = 'inventory_reserved_not_above_quantity'
  ) then
    alter table public.inventory
      add constraint inventory_reserved_not_above_quantity
      check (reserved_quantity <= quantity);
  end if;
end
$$;

create unique index if not exists uq_inventory_reservations_order_product
  on public.inventory_reservations(order_id, product_id);
create index if not exists idx_inventory_reservations_active_expiry
  on public.inventory_reservations(expires_at)
  where status = 'ACTIVE';

alter table public.inventory_reservations enable row level security;
revoke all on table public.inventory_reservations from anon, authenticated;
grant select, insert, update, delete on table public.inventory_reservations to service_role;

create or replace function public.reserve_order_inventory(p_order_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_inventory public.inventory%rowtype;
  v_count integer := 0;
begin
  -- Deliberately coarse for correctness and simplicity. Replace with ordered
  -- per-product advisory locks only if measured checkout throughput requires it.
  perform pg_advisory_xact_lock(hashtext('gth_inventory_reservations'));

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found';
  end if;
  if v_order.status <> 'PENDING' or v_order.payment_status <> 'PENDING' then
    raise exception using errcode = '23514', message = 'Only pending unpaid orders can reserve inventory';
  end if;
  if exists (
    select 1 from public.inventory_reservations where order_id = p_order_id
  ) then
    if not exists (
      select 1 from public.inventory_reservations
      where order_id = p_order_id and status <> 'ACTIVE'
    ) then
      return jsonb_build_object('orderId', p_order_id, 'reserved', 0, 'replay', true);
    end if;
    raise exception using errcode = '23514', message = 'Order inventory reservation is no longer active';
  end if;

  if not exists (select 1 from public.order_items where order_id = p_order_id) then
    raise exception using errcode = '23514', message = 'Order has no items';
  end if;
  if exists (
    select 1 from public.order_items where order_id = p_order_id and product_id is null
  ) then
    raise exception using errcode = '23514', message = 'Order contains an item without a product';
  end if;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id
    group by product_id
    order by product_id
  loop
    select * into v_inventory
    from public.inventory
    where product_id = v_item.product_id
    for update;

    if not found then
      raise exception using errcode = '23514', message = 'Inventory row is missing for an order item';
    end if;
    if v_inventory.quantity - v_inventory.reserved_quantity < v_item.quantity then
      raise exception using errcode = '23514', message = 'Insufficient inventory for reservation';
    end if;

    update public.inventory
    set reserved_quantity = reserved_quantity + v_item.quantity,
        updated_at = now()
    where id = v_inventory.id;

    insert into public.inventory_reservations (
      order_id, product_id, quantity, status, expires_at
    ) values (
      p_order_id, v_item.product_id, v_item.quantity, 'ACTIVE', now() + interval '30 minutes'
    );
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('orderId', p_order_id, 'reserved', v_count, 'replay', false);
end;
$$;

create or replace function public.release_order_inventory(
  p_order_id uuid,
  p_release_status text default 'RELEASED'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_reservation record;
  v_count integer := 0;
begin
  if p_release_status not in ('RELEASED', 'EXPIRED') then
    raise exception using errcode = '22023', message = 'Invalid reservation release status';
  end if;

  perform pg_advisory_xact_lock(hashtext('gth_inventory_reservations'));

  for v_reservation in
    select *
    from public.inventory_reservations
    where order_id = p_order_id and status = 'ACTIVE'
    order by product_id
    for update
  loop
    update public.inventory
    set reserved_quantity = reserved_quantity - v_reservation.quantity,
        updated_at = now()
    where product_id = v_reservation.product_id
      and reserved_quantity >= v_reservation.quantity;

    if not found then
      raise exception using errcode = '23514', message = 'Reserved inventory invariant was violated';
    end if;

    update public.inventory_reservations
    set status = p_release_status,
        released_at = now(),
        updated_at = now()
    where id = v_reservation.id;
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('orderId', p_order_id, 'released', v_count);
end;
$$;

create or replace function public.expire_inventory_reservations()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_count integer := 0;
  v_result jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('gth_inventory_reservations'));

  for v_order_id in
    select distinct order_id
    from public.inventory_reservations
    where status = 'ACTIVE' and expires_at <= now()
    order by order_id
  loop
    v_result := public.release_order_inventory(v_order_id, 'EXPIRED');
    v_count := v_count + coalesce((v_result ->> 'released')::integer, 0);
  end loop;

  return v_count;
end;
$$;

create or replace function public.finalize_razorpay_payment(
  p_gateway_reference text,
  p_transaction_id text,
  p_amount numeric,
  p_currency text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_item record;
  v_inventory public.inventory%rowtype;
  v_reservation public.inventory_reservations%rowtype;
begin
  if coalesce(p_gateway_reference, '') = '' or coalesce(p_transaction_id, '') = '' then
    raise exception using errcode = '22023', message = 'Payment identifiers are required';
  end if;

  perform pg_advisory_xact_lock(hashtext('gth_inventory_reservations'));

  select * into v_payment
  from public.payments
  where gateway_reference = p_gateway_reference
    and payment_method = 'GATEWAY'
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Payment mapping not found';
  end if;
  if v_payment.amount <> p_amount or upper(v_payment.currency) <> upper(p_currency) then
    raise exception using errcode = '23514', message = 'Payment amount or currency mismatch';
  end if;
  if v_payment.status = 'PAID' then
    if v_payment.transaction_id = p_transaction_id then
      return jsonb_build_object(
        'orderId', v_payment.order_id,
        'paymentId', p_transaction_id,
        'status', 'paid',
        'replay', true
      );
    end if;
    raise exception using errcode = '23505', message = 'Payment mapping is already paid by another transaction';
  end if;
  if v_payment.status not in ('PENDING', 'UNDER_REVIEW') then
    raise exception using errcode = '23514', message = 'Payment cannot transition to paid';
  end if;
  if v_payment.transaction_id is not null and v_payment.transaction_id <> p_transaction_id then
    raise exception using errcode = '23505', message = 'Payment mapping has another transaction';
  end if;

  select * into v_order
  from public.orders
  where id = v_payment.order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Payment order not found';
  end if;
  if v_order.payment_status <> 'PENDING' or v_order.status <> 'PENDING' then
    raise exception using errcode = '23514', message = 'Order cannot transition to confirmed and paid';
  end if;

  if exists (
    select 1
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order.id
      group by product_id
    ) items
    full join (
      select product_id, quantity, status
      from public.inventory_reservations
      where order_id = v_order.id
    ) reservations on reservations.product_id = items.product_id
    where items.product_id is null
       or reservations.product_id is null
       or items.quantity <> reservations.quantity
       or reservations.status = 'CONSUMED'
  ) then
    raise exception using errcode = '23514', message = 'Order items and inventory reservations do not match';
  end if;

  for v_item in
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = v_order.id
    group by product_id
    order by product_id
  loop
    select * into v_reservation
    from public.inventory_reservations
    where order_id = v_order.id and product_id = v_item.product_id
    for update;

    if not found then
      raise exception using errcode = '23514', message = 'Inventory reservation is missing';
    end if;

    select * into v_inventory
    from public.inventory
    where product_id = v_item.product_id
    for update;

    if not found or v_inventory.quantity < v_item.quantity then
      raise exception using errcode = '23514', message = 'Insufficient inventory to finalize captured payment';
    end if;

    if v_reservation.status = 'ACTIVE' then
      if v_inventory.reserved_quantity < v_item.quantity then
        raise exception using errcode = '23514', message = 'Reserved inventory invariant was violated';
      end if;
      update public.inventory
      set quantity = quantity - v_item.quantity,
          reserved_quantity = reserved_quantity - v_item.quantity,
          updated_at = now()
      where id = v_inventory.id;
    elsif v_reservation.status in ('RELEASED', 'EXPIRED') then
      if v_inventory.quantity - v_inventory.reserved_quantity < v_item.quantity then
        raise exception using errcode = '23514', message = 'Released inventory is no longer available for captured payment';
      end if;
      update public.inventory
      set quantity = quantity - v_item.quantity,
          updated_at = now()
      where id = v_inventory.id;
    else
      raise exception using errcode = '23514', message = 'Inventory reservation cannot be consumed';
    end if;

    update public.inventory_reservations
    set status = 'CONSUMED', consumed_at = now(), updated_at = now()
    where id = v_reservation.id;
  end loop;

  update public.payments
  set status = 'PAID',
      transaction_id = p_transaction_id,
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
  where id = v_payment.id;

  update public.orders
  set payment_status = 'PAID', status = 'CONFIRMED', updated_at = now()
  where id = v_order.id;

  return jsonb_build_object(
    'orderId', v_order.id,
    'paymentId', p_transaction_id,
    'status', 'paid',
    'replay', false
  );
end;
$$;

revoke execute on function public.reserve_order_inventory(uuid) from public, anon, authenticated;
revoke execute on function public.release_order_inventory(uuid, text) from public, anon, authenticated;
revoke execute on function public.expire_inventory_reservations() from public, anon, authenticated;
revoke execute on function public.finalize_razorpay_payment(text, text, numeric, text) from public, anon, authenticated;

grant execute on function public.reserve_order_inventory(uuid) to service_role;
grant execute on function public.release_order_inventory(uuid, text) to service_role;
grant execute on function public.expire_inventory_reservations() to service_role;
grant execute on function public.finalize_razorpay_payment(text, text, numeric, text) to service_role;
