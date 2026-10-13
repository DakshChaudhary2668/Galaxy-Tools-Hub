# Production Data Cleanup Dry Run

Audit date: 2026-10-13

This records the pre-deletion inventory and the narrowly scoped cleanup performed afterward.

## Proposed cleanup

| Record | ID | Evidence | Dependencies | Decision |
| --- | --- | --- | --- | --- |
| Product `New Product` (`QA-2026-TEST`) | `fb2acfda-9983-4000-b7ee-8937bcc6f671` | Explicit QA/test SKU; inactive; prior `20260922083208_sprint65_catalog_cleanup.sql` names this fixture for cleanup. | Zero references in `inventory_transactions`, `product_documents`, `cart_items`, `wishlist_items`, `inventory_reservations`, `reviews`, `quote_request_items`, and `order_items`. One inventory row (60 quantity, 0 reserved); one product-image row and one matching storage object. | Backed up, rechecked, deleted, and verified. |

## Preserved

| Record | ID | Evidence | Decision |
| --- | --- | --- | --- |
| Product `New Product` (`TEST-IMG-1789587423108`) | `3a5dbc3e-8b80-4180-b2cc-8ef8338b883e` | One `order_items` row references real historical order `1e80b431-2bed-416a-9ada-8667a497f781`. | Preserve product and order history; test-looking name alone does not justify deleting linked commerce history. |

The live auth-user inventory contained three users and no addresses matching the known `@example.invalid` or `sprint4c` test patterns. No matching `S4C-%` / `S4C-HTTP-%` orders were found. No auth users or orders are proposed for deletion.

## Limits

`parent_products` does not exist in the live public schema (Supabase returned `PGRST205`, table absent from schema cache). All queried dependency tables that do exist returned zero references for the candidate above.

## Completed cleanup

Before deletion, the product row, associated image-row metadata, inventory row, and storage image bytes were backed up to `/private/tmp/gth-qa-cleanup-backup-20261013` (`product-row.json`, `image.png`). SHA-256 for the image: `0863c1e2557782cfc620dd05e977f65ca4818dd52e16dc7999cf8655d8a134d0`.

The final live recheck confirmed the expected product ID/SKU and zero dependency counts. Exactly that product was deleted; post-check showed zero product, product-image, and inventory rows. Its one storage object was removed and its folder then listed zero objects. The separate order-linked `TEST-IMG-1789587423108` product and historical order remain untouched.

No payment, customer, order, or inventory data is included in this report beyond the one test product's inventory count and dependency check.
