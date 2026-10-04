# Sprint 7C.5 — Storefront Merchandising, Product Media & Coupons Foundation

**Date:** October 4, 2026
**Status:** MIGRATION + LIVE SUPABASE VERIFICATION COMPLETE; STAGING REDEPLOYMENT PENDING

## Scope and safety boundary

This sprint changes catalog/admin behavior only. Razorpay, payment finalization, inventory reservation, and order state logic were not changed. No product, image, inventory quantity, coupon, redemption, or customer/order fixture was created by the implementation. The coupons migration contains no seed statements.

Checkout coupon redemption is intentionally not enabled. Correct overall/per-customer limit enforcement would need an atomic relationship with successful payment finalization; adding that now would violate the instruction not to alter payment architecture. The delivered foundation is therefore an empty, constrained coupons table plus authenticated OWNER/MANAGER administration. A later payment-scoped sprint must add redemption atomically before a coupon field appears at checkout.

## Category navigation

- Removed every legacy `http(s)://galaxytoolshub.com` URL from the active mega-menu.
- Mega-menu entries now use the current `/products` route with canonical live category slugs and a search term.
- Live canonical mappings are `testing-equipment`, `measuring-instruments`, and `electrical-tools`.
- The URL contract is refresh-safe and remains on the current Next.js deployment.

## Custom brands

Add Product and Edit Product now include **Other / Add new brand**. The server collapses repeated whitespace, trims the value, performs a case-insensitive normalized lookup, reuses a match, or creates an active brand with a validated slug. Products continue to store only `brand_id`.

The migration adds a normalized unique brand-name index, preventing casing/spacing races from creating duplicates. A distinct name that collides at the slug level receives a short unique suffix.

## Placement model

| Control | Meaning |
|---|---|
| `is_active` | Global storefront/catalog visibility |
| `is_purchasable` | Checkout eligibility; independent of visibility |
| `is_featured` | Featured Instruments homepage section |
| `show_on_homepage` | Eligibility for any homepage product section |

The homepage now sends the supported `active=true` filter and `homepage=true` for Featured, Trending, and Discounted queries. Disabling homepage placement does not remove a product from the catalog or change purchase eligibility.

## Multiple product images

- Existing `product_images`, signed uploads, and the `product-images` Storage bucket remain the source of truth.
- Add Product accepts up to six JPEG/PNG/WebP files, 5 MB each, then uploads them after product creation.
- Edit Product loads all current images, appends images without replacing existing metadata, allows an individual image to be removed, and allows a primary image to be selected.
- Individual deletion requires both product ID and image ID, deletes only a validated managed object path, then deletes metadata. Removing the primary promotes the next deterministic image.
- Primary selection uses a service-role-only transaction RPC and a partial unique index, so a product cannot retain multiple primary images.
- Completion failures clean the newly uploaded managed object. The six-image limit is enforced in both browser and server.
- Product cards use the primary image; PDP gallery ordering is primary, `sort_order`, then creation time, with up to six images.

Ordering is deterministic but manual drag/reorder is not part of this MVP.

## Coupons foundation

The migration creates `public.coupons` with normalized unique codes, `PERCENTAGE`/`FIXED` discounts, positive/value constraints, optional minimum order and percentage cap, optional overall usage limit, usage count bounds, optional time window, active state, timestamps, and an order foreign key. RLS is enabled; `anon` and `authenticated` receive no table privileges; the server service role is the only granted actor.

Admin `/admin/coupons` provides empty state, create, edit, activate/deactivate, usage display, and safe deletion of unused coupons. All coupon API routes require valid admin authentication and OWNER/MANAGER RBAC. No public coupon endpoint is mounted.

Per-customer limits are not represented because the current guest checkout uses a shared guest identity and cannot enforce such a limit safely. Coupon redemption/checkout validation is not active for the payment-safety reason above.

## Migration

Reviewed forward migration:

`supabase/migrations/20261004090000_sprint7c5_merchandising_coupons.sql`

Read-only preflight found no duplicate primary image rows and no case/spacing-equivalent brand duplicates. The reviewed migration was applied by the project owner through Supabase SQL Editor. Post-apply verification confirmed that `products.show_on_homepage`, the empty `coupons` table, and the restricted `set_primary_product_image` RPC are present in the live schema cache.

One authenticated disposable live suite then passed **14/14**: normalized custom-brand creation/reuse, homepage placement independence, two signed image uploads, primary reassignment, scoped individual removal, unauthenticated coupon rejection, admin coupon create/deactivate/delete, and complete database/Storage cleanup. The coupons table returned to zero rows.

## Verification completed

- Sprint 7C.5 focused tests: **11/11 passed**
- Sprint 4A payment trust regression: **passed**
- Sprint 4B payment finalization regression: **30/30 passed**
- Sprint 5B production packaging regression: **11/11 passed**
- Types package, server, and web direct TypeScript checks: **passed**
- Server lint: **0 errors** (pre-existing warnings remain)
- Web lint: **0 errors** (11 pre-existing warnings remain)
- Server production TypeScript build: **passed**
- Web Next.js production build: **passed**
- Live Sprint 5A search regression: **22/22 passed** on retry; all `S5A-*` fixtures were removed.
- Sprint 7C.5 live Supabase/admin/image regression: **14/14 passed**; all product, inventory, brand, coupon, image metadata, and Storage fixtures were removed.

## Pending live gate

1. Push/redeploy temporary Hostinger staging.
2. Verify public desktop/mobile category routing, admin workflow, PDP gallery, primary card image, and access control.
3. Confirm the public staging coupon endpoint is admin-only and the live coupons table remains empty.

Do not start final production deployment as part of this gate.
