# Sprint 2 — Core Commerce Repair Report

**Date:** September 16, 2026
**Scope:** GTH-P0-003, GTH-P0-004, GTH-P1-007, GTH-P1-008 only

## 1. Findings Confirmed

All four Sprint 2 findings were confirmed against the active code before editing. None was stale.

| Finding | Pre-fix result | Sprint 2 result |
|---|---|---|
| GTH-P0-003 — Admin order state machine | Admin used `Draft`/`PendingPayment`/`Paid`; real `PENDING` orders appeared terminal | Fixed |
| GTH-P0-004 — Catalog category/brand filters | Hyphen detection reversed UUID/slug behavior; missing lookup removed the filter | Fixed |
| GTH-P1-007 — ProductCard category UUID | Listing lacked category summary and customer UI rendered `category_id` | Fixed |
| GTH-P1-008 — Cart persistence | Store was memory-only | Fixed |

No Razorpay, image-upload, Storage, inventory-backfill, coupon, variant, or infrastructure work was performed.

## 2. Root Causes

### Order state

The database, shared DTO, and most server logic used canonical uppercase order states, but admin pages maintained a second PascalCase transition vocabulary. `Paid` was incorrectly modeled as an order state even though it belongs to `payment_status`. The admin status controller also special-cased obsolete PascalCase strings, so canonical cancellation/refund requests bypassed the intended handlers.

### Catalog filtering

Category and brand filtering used `.includes('-')` as UUID detection. UUIDs contain hyphens, while valid single-word slugs do not. Failed slug lookups were ignored, leaving the original unfiltered product query active. Vendor used a UUID regex but had the same missing-code/filter-drop behavior.

### Category display

The product listing query joined images but not category/brand summaries. ProductCard therefore only had `category_id` and rendered it. The cart page repeated the same customer-facing UUID display.

### Cart persistence

The Zustand store used `create` only. It had no storage adapter, compact persisted representation, restoration validation, or SSR-safe hydration boundary.

## 3. Files Changed

### Shared contracts

- `packages/constants/index.ts`
- `packages/types/index.ts`

### Server

- `apps/server/src/services/order.service.ts`
- `apps/server/src/controllers/order.controller.ts`
- `apps/server/src/controllers/analytics.controller.ts`
- `apps/server/src/repositories/product.repository.ts`

### Web

- `apps/web/src/app/admin/(dashboard)/orders/[id]/page.tsx`
- `apps/web/src/app/admin/(dashboard)/orders/page.tsx`
- `apps/web/src/services/order.service.ts`
- `apps/web/src/hooks/useOrders.ts`
- `apps/web/src/components/ProductCard/ProductCard.tsx`
- `apps/web/src/app/cart/page.tsx`
- `apps/web/src/store/useCartStore.ts`
- `apps/web/src/components/providers/Providers.tsx`

### Documentation

- `Docs/FINAL_AUDIT.md`
- `Docs/SPRINT_2_CORE_COMMERCE_REPORT.md`

## 4. Exact Fixes

### GTH-P0-003

- Added shared `OrderStatusTransitions`, `OrderStatusLabels`, and `isOrderStatus` exports beside the existing canonical `OrderStatus` values.
- Removed the frontend-only transition graph.
- Removed `Paid`, `Draft`, and `PendingPayment` from admin order mutation/filter values.
- Admin detail and list actions derive legal targets from the shared graph and display human-readable labels only.
- Admin detail refetches the order after a successful mutation.
- Backend rejects unknown status values with HTTP 400 before casting.
- Canonical `CANCELLED` and `REFUNDED` requests now use their intended service paths.
- Cancellation/refund validates the transition before inventory side effects.
- Same-state, backward, and terminal transitions are not legal transitions.
- Analytics fallbacks use canonical `OrderStatus.PENDING` instead of the legacy `Draft` string.

### GTH-P0-004

- Added one reusable Zod UUID check in `ProductRepository`.
- Category and brand accept either a valid UUID or a slug.
- Vendor accepts either a valid UUID or a case-normalized code through the same checked resolver.
- Slug/code lookup uses `maybeSingle()` and checks Supabase errors.
- Missing and malformed non-UUID lookup values return an empty paginated result instead of removing the filter or sending a bad UUID comparison.
- Search, pagination, sorting, featured, discounted, price, and combined query chaining remain intact.

### GTH-P1-007

- Product listings join category and brand summaries in the existing product query.
- Shared `ProductView` describes the embedded summaries.
- ProductCard renders `product.category.name` or `Uncategorized`.
- Cart renders the same human-readable category field.
- No per-card category requests were added.
- Existing product-image join and controller normalization were preserved.

### GTH-P1-008

- Added Zustand `persist` with stable key `galaxy-tools-cart`.
- Persisted state contains `items` only; functions and drawer-open UI state are not serialized.
- Each persisted product is reduced to cart/checkout fields: ID, name, slug, SKU, category ID/summary, prices, image URLs, and currency.
- Restore sanitization rejects invalid items, non-positive/non-integer quantities, non-finite prices, and duplicate product IDs.
- `skipHydration: true` plus one root-provider rehydrate effect keeps server and first client render aligned.

## 5. Status Contract Changes

Canonical order status values remain exactly those already defined by the database and shared package:

`PENDING`, `CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `RETURN_REQUESTED`, `RETURNED`, `REFUNDED`.

The shared transition graph is:

- `PENDING` → `CONFIRMED`, `CANCELLED`
- `CONFIRMED` → `PROCESSING`, `PACKED`, `CANCELLED`
- `PROCESSING` → `PACKED`, `CANCELLED`
- `PACKED` → `SHIPPED`, `CANCELLED`
- `SHIPPED` → `DELIVERED`, `CANCELLED`
- `DELIVERED` → `RETURN_REQUESTED`, `REFUNDED`
- `RETURN_REQUESTED` → `RETURNED`, `REFUNDED`
- `RETURNED` → `REFUNDED`
- `CANCELLED`, `REFUNDED` → terminal

`PAID` remains exclusively a payment status. No order-status schema change was made.

## 6. Catalog Filtering Contract

For `category`, `brand`, and `vendor`:

1. A valid UUID is applied directly to the corresponding foreign-key column.
2. A non-UUID is resolved through `categories.slug`, `brands.slug`, or `vendors.code`.
3. A missing lookup produces `{ products: [], total: 0, totalPages: 0 }`.
4. Lookup/database errors are thrown; they are not silently converted into an unfiltered catalog.
5. Malformed values do not reach PostgreSQL UUID comparisons.

The listing query includes category/brand summaries and image metadata in one request, so ProductCard rendering does not introduce N+1 calls.

## 7. Cart Persistence Implementation

The cart is local-only and remains intentionally independent of the database. Every cart mutation writes the compact item state to `localStorage`. On mount, the root provider explicitly rehydrates the store. Parsed persisted items are sanitized before being merged with live actions.

The browser still sends the same cart/product data expected by the current checkout. Authoritative server pricing remains deferred to the Razorpay sprint as instructed.

## 8. Tests Executed

### Type and build verification

- Server TypeScript: passed.
- Web TypeScript: passed.
- Shared packages (`constants`, `types`, `config`, `utils`, `ui`): passed.
- Server production TypeScript build: passed.
- Next.js production build: passed, including `/products`, `/cart`, `/checkout`, `/admin/orders`, and `/admin/orders/[id]`.

All commands used direct workspace binaries. `pnpm` and the system Node installation were not modified or troubleshot.

### Deterministic runtime suites

- Catalog: category UUID/slug parity, brand UUID/slug parity, missing slugs, malformed values, vendor UUID/code parity, missing vendor, unfiltered list, featured list, joined category name, and distinct product images.
- Order state: `PENDING` is non-terminal, `PENDING → CONFIRMED` persists, backward transition rejects with 400, and terminal `CANCELLED` rejects a new transition.
- Cart: clear, add A, quantity 2, add B, simulated refresh, quantity update, simulated refresh, remove B, simulated refresh, clear, simulated refresh, compact serialization, and malformed persisted-item rejection.

## 9. Runtime Evidence

```text
catalog: 12 filter/list assertions passed
categoryJoin: human-readable category present with no per-card request
images: 3 distinct listing images preserved
orderState: valid transition persisted; backward and terminal transitions rejected
persistence: add, quantity, remove, clear, and simulated refresh passed
compactShape: actions and specifications were not serialized
malformedState: invalid persisted item and invalid JSON failed safely
storageKey: galaxy-tools-cart
```

The catalog fixture uses the repository's checked-in seeded UUIDs/slugs and executes the real repository implementation against an in-memory Supabase query adapter. The order suite executes the real `OrderService` transition code against a disposable in-memory order record. The cart suite executes the real Zustand store with an in-memory `localStorage` implementation.

A live API process was also started on an isolated port. Health checks succeeded, but configured Supabase requests failed with `TypeError: fetch failed` at the environment network boundary. Because the sprint explicitly forbids unsafe production-data mutation, no real order was modified. This is recorded as an environment limitation, not hidden as a passing live integration test.

## 10. Regressions Checked

- Product image join and normalization remain present; the runtime fixture preserved distinct image URLs.
- Search, sorting, pagination, featured, discounted, category, brand, and vendor query paths remain composable.
- No per-card category fetch was added.
- No active `.includes('-')` UUID detection remains.
- Remaining `Paid` text is payment terminology, not an order state.
- Remaining “draft” text is descriptive route/copy terminology, not an API/database status value.
- `markPendingPayment` remains payment-flow terminology and was not expanded.
- Sprint 1 auth, inventory, storage-auth, admin-layout, and homepage architecture were not refactored. The only Sprint 1 file touched was `analytics.controller.ts`, where two legacy `Draft` fallbacks were replaced with `OrderStatus.PENDING`.
- Razorpay/payment hardening, image upload, Storage buckets, inventory backfill, coupons, and variants were not changed.

## 11. Remaining Risks

- Live Supabase-backed filter and disposable-order integration tests must be rerun when the local environment can reach the configured project.
- The previously identified Razorpay/payment and inventory-completeness P0 blockers remain outside Sprint 2.
- Four products still require the separately planned controlled inventory backfill.
- Cart product data can become commercially stale; authoritative checkout pricing is intentionally deferred to payment hardening.
- Existing cancellation/refund inventory operations are not transactional with order status updates; that broader consistency work belongs to GTH-P0-006.

## 12. Git Diff Summary

Sprint 2 changed 14 implementation files and 2 documentation files. The working tree already contained substantial Sprint 1 and user changes, so repository-wide `git diff --stat` line counts would incorrectly attribute earlier work to Sprint 2.

The Sprint 2 delta is limited to:

- one shared order vocabulary/transition graph;
- one typed product category/brand summary shape;
- backend order validation/dispatch and catalog lookup repair;
- two admin order screens plus service/hook typing;
- ProductCard/cart category rendering;
- Zustand persistence and root hydration;
- the four requested audit status updates and this report.

No database schema, Supabase infrastructure, package dependency, or environment file was changed.
