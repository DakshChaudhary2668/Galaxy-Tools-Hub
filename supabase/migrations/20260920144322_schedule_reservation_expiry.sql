create extension if not exists pg_cron;

select cron.schedule(
  'expire-inventory-reservations-every-5-minutes',
  '*/5 * * * *',
  $$select public.expire_inventory_reservations();$$
);
