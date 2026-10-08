alter table public.products
  add column if not exists weight_grams integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_weight_grams_positive'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_weight_grams_positive
      check (weight_grams is null or weight_grams > 0);
  end if;
end
$$;

comment on column public.products.weight_grams is
  'Authoritative product or sellable-package weight in grams for freight calculation.';
