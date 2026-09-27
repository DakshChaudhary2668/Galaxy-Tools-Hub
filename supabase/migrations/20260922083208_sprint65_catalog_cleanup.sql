-- Sprint 6.5: Catalog Cleanup — deactivate test listings and lock real products
-- pending verified stock. No rows are deleted; deactivation is reversible.
--
-- Safe-guard: this migration is idempotent (UPDATE … WHERE matches by SKU, not
-- by mutable values, so re-running produces the same end-state).

-- 1. Deactivate the Sprint-3 image-upload disposable test product.
--    TEST-IMG-1789587423108 is referenced by at least one order_items row so it
--    cannot be deleted without violating the FK constraint. Set is_active=false
--    and is_purchasable=false so it disappears from the public catalog while the
--    historical order data remains intact.
UPDATE public.products
SET
  is_active       = false,
  is_purchasable  = false,
  updated_at      = now()
WHERE sku = 'TEST-IMG-1789587423108'
  AND (is_active = true OR is_purchasable = true);

-- 2. Delete the Sprint-2/QA placeholder product.
--    QA-2026-TEST has no order_items rows (confirmed in Sprint-6 read-only
--    audit). Remove it completely so it never appears in admin search results.
--    The associated product_images and inventory rows cascade-delete via FK.
DELETE FROM public.products
WHERE sku = 'QA-2026-TEST';

-- 3. Lock the four real-instrument products whose physical stock has not been
--    verified. Set is_purchasable=false so checkout is blocked, but keep them
--    active (is_active=true) so they remain visible in the catalog with an
--    "Out of Stock / Coming Soon" state. Admin can flip is_purchasable back once
--    stock is confirmed.
UPDATE public.products
SET
  is_purchasable = false,
  updated_at     = now()
WHERE sku IN (
  'GTH-BOS-GBH228',
  'GTH-MAK-GA5030',
  'GTH-FLU-179',
  'GTH-TAP-S14H'
)
  AND is_purchasable = true;
