-- Scope the parity join to this payment's order. The original FULL JOIN
-- included reservations from every other order as unmatched rows.
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
