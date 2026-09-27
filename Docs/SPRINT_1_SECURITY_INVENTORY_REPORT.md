# Sprint 1 — Security + Inventory Report

**Date:** September 16, 2026
**Scope:** GTH-P0-001, GTH-P0-002, GTH-P1-001, GTH-P1-002, GTH-P1-003, GTH-P1-006, GTH-P1-009

## 1. Confirmed findings

All seven scoped findings were confirmed against the current implementation and actual schema. The initial inspection note that GTH-P1-003 might already have dropped `variant_id` was corrected after the complete stock block was inspected: the active query still used `product_id OR variant_id` and still ignored lookup/update/insert errors.

The schema contract is:

- `admin_users.user_id -> auth.users.id`, with `role` and `status` authorization fields.
- `inventory.product_id` is unique; `inventory` has no `variant_id`.
- `products.brand_id -> brands.id`; `products` has no `brand` text column.

## 2. Root causes

- Admin authorization was a legacy Clerk/dev placeholder that assigned `OWNER` without validating a token or database permission.
- Active inventory code mixed an obsolete variant model with the current flat, one-row-per-product model.
- Several Supabase results were treated as empty data or success without checking `{ error }`.
- The dashboard layout treated any Supabase session as an admin session.
- The signed-upload route had no authentication and accepted arbitrary bucket/path strings.

## 3. Files changed

- `apps/server/src/middlewares/auth.middleware.ts`
- `apps/server/src/controllers/auth.controller.ts`
- `apps/server/src/services/inventory.service.ts`
- `apps/server/src/services/order.service.ts`
- `apps/server/src/controllers/inventory.controller.ts`
- `apps/server/src/controllers/analytics.controller.ts`
- `apps/server/src/controllers/product.controller.ts`
- `apps/server/src/routes/storage.routes.ts`
- `apps/web/src/app/admin/(dashboard)/layout.tsx`
- `packages/types/index.ts`
- `Docs/FINAL_AUDIT.md`
- `Docs/SPRINT_1_SECURITY_INVENTORY_REPORT.md`

The worktree already contained extensive unrelated edits before this sprint. Those changes were preserved.

## 4. Exact fixes

### Authentication and RBAC

- Require a well-formed Bearer token in every environment.
- Verify it with `supabaseAdmin.auth.getUser(token)`.
- Query `admin_users` by the verified Supabase user ID.
- Return 401 for missing/invalid authentication and 403 for missing/inactive admin permission.
- Populate `req.user` from the real admin row; there is no default role.
- Return the already verified request identity from `/auth/admin/me` instead of making a second unchecked lookup.
- Require `isAdmin` before rendering the frontend dashboard layout.

### Inventory contract

- Replace active inventory `variant_id`/fallback queries with exact `product_id` lookups.
- Add a reusable `getInventory(productId)` method.
- Validate positive integer stock movements.
- Preserve `quantity >= 0`, `reserved_quantity >= 0`, and `reserved_quantity <= quantity` for application writes.
- Use optimistic predicates on current quantity/reservation values so concurrent writes surface as 409 conflicts instead of silently overwriting each other.
- Surface Supabase failures instead of returning false success.
- Stop writing to the nonexistent `inventory_reservations` table.
- Stop `OrderService` from converting order-item query failures into an empty item list.

### Inventory views and product edits

- Load real brand names through the verified products-to-brands foreign key.
- Return real product name, SKU, brand, price, and stock quantities; database failures no longer produce fabricated display records.
- Load dashboard low-stock product names/SKUs through the inventory-to-products relationship.
- Check every dashboard query result that affects the summary.
- Product stock edits update by `product_id`, preserve the existing reorder level when omitted, reject stock below reserved stock, insert only if absent, and handle unique-insert races.
- Existing `product_images(public_url, storage_path, is_primary, sort_order)` behavior was left intact.

### Signed uploads

- Require active admin auth plus existing RBAC on `POST /api/v1/storage/signed-url`.
- Restrict buckets to the application `StorageBuckets` constants.
- Reject absolute paths, traversal segments, empty path segments, backslashes, control characters, and oversized paths.

## 5. Tests executed

### Static/build verification

- Server TypeScript check: passed.
- Web TypeScript check: passed.
- All five shared package TypeScript checks: passed.
- Server TypeScript emit build: passed.
- Next.js production build: passed, including type validation and all admin routes.
- Regression searches for `inventory.variant_id`, inventory `.or(...variant_id...)`, `products.brand`, Clerk bypass markers, hard-coded admin IDs, fake tokens, and the signed-url route: no active scoped regressions remain.

The requested `pnpm` wrapper commands could not complete because the installed `/opt/homebrew/bin/pnpm` hangs even on `pnpm --version` under Node 25.8.2. Equivalent local workspace binaries were run directly. Turborepo replayed three cached package checks, then stalled when it invoked the same `pnpm` executable; direct checks for all seven workspaces passed.

Lint was not run. The pre-existing audit already records missing/non-interactive lint infrastructure as GTH-P1-010, outside this sprint.

### Runtime verification

- `GET /health`: 200.
- Protected inventory endpoint, no token: 401.
- Signed-upload endpoint, no token: 401.
- Protected inventory endpoint, invalid token: 401.
- Isolated middleware branch test: authenticated user without `admin_users` row -> 403.
- Isolated middleware branch test: active `MANAGER` row -> success with the database role.
- Isolated middleware branch test: suspended admin row -> 403.
- Live inventory controller: 200 with real QA product name, SKU, Bosch brand, price, quantity, reserved quantity, and available stock.
- Live dashboard controller: 200; low-stock count/items computed without a PostgreSQL 42703 error.
- Live inventory service: availability, reserve, release, decrement, increment, and insufficient-stock rejection all passed.
- Product stock controller: update succeeded and a fresh inventory read matched the requested values.
- The QA inventory row was restored to its original quantity, reservation, reorder level, and timestamp after mutation tests.
- Storage validation accepted a safe known bucket/path and rejected unknown buckets, traversal, absolute paths, and backslashes.

## 6. Runtime results

The inventory root-cause cluster is operational against the live database. No active inventory query references `inventory.variant_id`, and the controller responses contain real relational data.

The admin bypass is closed for missing and arbitrary tokens. Real positive-token end-to-end tests were not run because no test customer/admin credentials were provided; the post-verification authorization branches were exercised with isolated in-memory Supabase responses instead.

The signed-upload security control is active. Authorized upload success is currently blocked by environment provisioning: `storage.listBuckets()` returned an empty list, and a safe signed URL request returned `The related resource does not exist`. No bucket was created during this sprint.

## 7. Database inconsistencies discovered

The audit's reported coverage mismatch is confirmed: **5 products, 1 inventory row**.

Products missing inventory rows:

| Product ID | SKU |
|---|---|
| `55555555-5555-4555-a555-555555555551` | `GTH-BOS-GBH228` |
| `55555555-5555-4555-a555-555555555553` | `GTH-FLU-179` |
| `55555555-5555-4555-a555-555555555552` | `GTH-MAK-GA5030` |
| `55555555-5555-4555-a555-555555555554` | `GTH-TAP-S14H` |

No stock was fabricated. Use a controlled, reviewed backfill with authoritative quantities. The repaired product-edit path will naturally create a missing row when an admin explicitly supplies stock.

Supabase Storage currently has zero buckets. Provision only the required buckets and policies through the project's normal infrastructure workflow before expecting authorized signed uploads to succeed.

## 8. Remaining risks

- Multi-line order inventory operations are not a single PostgreSQL transaction. Per-row optimistic checks prevent silent lost updates, but a later item can still fail after an earlier item has reserved stock. A database transaction/RPC would be a later architecture change.
- The database schema checks `quantity >= 0` and `reserved_quantity >= 0` but does not itself constrain `reserved_quantity <= quantity`; application paths now enforce the invariant.
- No real positive customer/admin access token was available for full endpoint-level 403/200 authentication tests.
- The production server emits successfully, but starting `dist/index.js` directly under Node 25 fails on a pre-existing extensionless workspace ESM import. Runtime smoke tests used the existing `tsx` path.
- Existing out-of-scope active bugs found by regression search: the product-images endpoint still references `product_images.variant_id`, and the admin-team settings controller still substitutes fake team records on database failure. Neither was modified because Sprint 1 explicitly excludes unrelated image/settings work.

## 9. Findings not fixed

All seven scoped code findings were remediated. Two requested end-to-end assertions remain environmentally blocked rather than code-blocked:

- Valid real customer/admin token endpoint checks require non-secret test credentials or prepared test sessions.
- Valid-admin signed-upload success requires at least one configured Supabase Storage bucket and its policies.

## 10. Git diff summary

- Removed the hard-coded admin identity/role bypass and Clerk dependency from active middleware.
- Replaced the inventory service's obsolete variant contract with the flat product contract and explicit failure handling.
- Repaired live inventory/dashboard joins and product stock persistence.
- Protected and constrained signed uploads.
- Enforced admin identity in the dashboard layout.
- Updated only the seven scoped audit statuses and added this report.

No migration, stock backfill, storage bucket, auth user, catalog feature, cart behavior, filter/order state, or payment/UTR flow was added.

## Terminal summary

```text
SPRINT 1 — SECURITY + INVENTORY

P0 fixed: GTH-P0-001, GTH-P0-002
P1 fixed: GTH-P1-001, GTH-P1-002, GTH-P1-003, GTH-P1-006, GTH-P1-009
Tests passed: TypeScript (7/7 workspaces), server emit, web production build, auth rejection/authorization branches, inventory CRUD invariants, product stock persistence, inventory/dashboard reads
Tests failed: Authorized signed-upload generation (no Supabase Storage buckets)
Build: PASS (server tsc; Next.js production build)
Typecheck: PASS via direct workspace binaries; pnpm wrapper hangs under Node 25.8.2
Remaining blockers: 4 products need controlled inventory backfill; storage buckets/policies absent; real positive-token E2E credentials unavailable
```
