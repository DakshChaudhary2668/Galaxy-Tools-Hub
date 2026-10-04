# Galaxy Tools Hub — Final Production Readiness Audit

**Audit Date:** September 16, 2026
**Auditor:** Senior Staff Full Stack Engineer / Antigravity Auditor
**Codebase:** Galaxy Tools Hub Monorepo (`apps/web`, `apps/server`, `packages/*`)
**Original scope:** Strict read-only audit of backend, frontend, database, security, user flows, and build health. Historical findings below are preserved; the current launch-state overlay is dated separately.

---

## Current launch state — October 4, 2026

Sprint 7C.5 is code-complete for internal category navigation, normalized custom brands, independent homepage placement, six-image signed-upload management, and an empty admin-only coupons foundation. Payment/inventory finalization was not changed and checkout coupon redemption remains disabled until it can be made atomic with successful payment finalization. The reviewed migration is live; focused tests (11/11), live Supabase/admin/image tests (14/14), Sprint 5A (22/22), Sprint 4A, Sprint 4B (30/30), Sprint 5B (11/11), direct typechecks, zero-error lint, server build, and web production build passed with complete fixture cleanup. Temporary Hostinger redeployment/public verification remains. See [Sprint 7C.5 report](SPRINT_7C5_MERCHANDISING_COUPONS.md).

Sprint 7C audited the temporary public Hostinger frontend/backend on baseline `fdab7bd`. The reported Admin Orders dropdown defect did **not** reproduce: an authenticated `PROCESSING -> PACKED` transition persisted once, left `payment_status` unchanged, and appeared after the UI refetch; `PACKED -> CONFIRMED` returned the expected HTTP 400. The 21-check disposable admin suite, public customer/catalog/cart/checkout/order-success checks, complete Sprint 4A/4B/4C payment regressions, database invariants, exact five-minute cron, typechecks, lint, and production builds passed. No code patch or redeployment was warranted. Full evidence is in [Sprint 7C pre-production audit](SPRINT_7C_PREPRODUCTION_AUDIT.md).

**Current P0:** 0 open. **Current P1:** 1 operational blocker: Supabase rejected a fresh customer sign-up with `email rate limit exceeded`. Confirmed-customer sign-in/profile/logout passed, but public sign-up must be reverified after production SMTP/rate-limit configuration. Two P2 observations remain non-blocking: Hostinger runtime logs were unavailable during the mutation, and the live inactive `QA-2026-TEST` row conflicts with prior cleanup documentation. Final production deployment has not started.

### Prior launch-state overlay — September 22, 2026

The original audit findings are **not** the current blocker list. Across Sprints 1–6, all six catalogued P0 findings were fixed, including the Sprint 4C live payment/inventory integrity verification; nine of eleven P1 findings were fixed. Product variants remain deferred, while the coupon finding now has a live schema and verified implementation pending only public staging confirmation. One P2 was fixed and the remaining eight P2/P3 items are post-launch work, not launch gates. No final production deployment has occurred.

| Current finding disposition | Count |
|---|---:|
| FIXED | 16 (6 P0, 9 P1, 1 P2) |
| PUBLIC STAGING VERIFICATION PENDING | 1 (coupons foundation) |
| DEFERRED FOR MVP | 1 (variants) |
| POST-LAUNCH | 8 (4 P2, 4 P3) |
| ACTIVE LAUNCH BLOCKERS among original finding IDs | 0 |
| Total catalogued finding IDs | 26 (6 P0, 11 P1, 5 P2, 4 P3) |

**Current external launch gates remain open:** production Razorpay credentials/webhook permission and final domain details from the client; verified stock or an explicit deactivation decision for four active products with no inventory row; owner review of two active test-looking listings; and the actual Hostinger deployment plus public-domain QA. These are not a reclassification of already-fixed P0s. The cron migration matches the user-verified live five-minute job with multiple successful runs; Sprint 6 did not independently query the `cron` SQL schema. **Sprint 7 is the final deployment/QA sprint, not an already-completed launch.**

The sections that follow retain the **ORIGINAL FINDING** evidence and recommendations from September 16. Each finding's **Status** line gives its CURRENT STATUS where work has been completed. Original phrases such as “release blocker,” old localhost diagrams, historical backlog recommendations, and original counts should not be read as current production configuration or outstanding work.

---

## 1. Executive Summary — ORIGINAL AUDIT (September 16, 2026)

Galaxy Tools Hub is an industrial B2B e-commerce platform built as a pnpm/Turborepo monorepo consisting of a Next.js 15 frontend (`apps/web`), an Express/TypeScript API (`apps/server`), and a Supabase/PostgreSQL database backend.

The platform has a strong foundation: the core catalog browse, server-side rendering, responsive storefront layout, and live database product image rendering are functional. However, **the platform is NOT yet ready for a production MVP**.

### Key Verdict
- **Build, Compilation & Lint (reverified September 21, 2026):** Next.js production build, Express and workspace-package TypeScript builds, application/package typechecks, and both non-interactive lint jobs pass using direct workspace binaries. Lint reports 45 visible non-blocking warnings and zero errors. The compiled server now starts directly with `node dist/index.js`; both health endpoints and live read-only catalog routes returned 200. The root Turborepo runner stalled under this host's Node 25/pnpm setup and is not claimed verified.
- **P0 Release Blockers:** Identified **5 critical blockers** that directly prevent safe launch:
  1. **Admin Authentication Bypass / Forgery:** In development, all admin endpoints bypass authentication and assign `OWNER` permissions to any request. In production, any non-empty string in the `Authorization: Bearer` header is accepted without cryptographic validation against Supabase Auth.
  2. **Inventory Stock Logic Broken:** Every query in `InventoryService` checks `variant_id`, which does not exist in the PostgreSQL `inventory` table, causing PostgreSQL error `42703`. All stock availability checks, reservations, and payment decrements fail.
  3. **Admin Order State Machine Deadlock:** A newly placed order has `status = 'PENDING'`, but the admin order detail page’s `ALLOWED_TRANSITIONS` map uses PascalCase and omits `'PENDING'`, permanently locking all new orders with the UI message: *"This order is in a terminal state (PENDING). No further transitions are allowed."*
  4. **Catalog Brand & Category Filter Dropping:** `ProductRepository` uses a naive `.includes('-')` check to differentiate slugs from UUIDs. Because UUIDs contain hyphens, UUID filters passed by frontend dropdowns are treated as slugs, fail to match, and are silently dropped. Single-word brand slugs like `fluke` or `bosch` have no hyphens and attempt to query a UUID column with a string, returning 0 products.
  5. **Payment Architecture Inversion (Razorpay vs UTR):** The platform was architected for manual B2B payment verification via NEFT/RTGS UTR numbers (backed by the database table `payment_verifications`). However, the code was hastily wired to Razorpay, which crashes with a 500 error if credentials are not configured, while the intentional UTR submission and admin verification flow is completely missing from the API and UI.

### Original summary metrics (historical, superseded by current disposition above)
- **TOTAL P0 (Release Blockers):** 5
- **TOTAL P1 (Must Fix Before Production):** 10
- **TOTAL P2 (Important Post-Launch Fixes):** 5
- **TOTAL P3 (Enhancements / Technical Debt):** 4
- **Total Audited Findings:** 24

---

## 2. Architecture at original audit (historical request-flow diagram)

### 2.1 Monorepo Structure
- **Root:** Turborepo 2.10.9, pnpm 9.10.0 workspace.
- **Applications:**
  - `apps/web`: Next.js 15.5.23 (App Router), React 19, SCSS Modules, Zustand 4.5.5, Lucide React, Supabase JS Client (`@supabase/supabase-js`).
  - `apps/server`: Express 4.21.0, TypeScript 5.6.2, Supabase Admin Client (`@supabase/supabase-js` service role), Zod 3.23.8, Helmet 7.1.0, Morgan, Express Rate Limit, Razorpay 2.9.8.
- **Workspace Packages:**
  - `packages/config`: Zod-validated environment schemas for server and web.
  - `packages/constants`: System roles, order statuses, payment statuses, and routes.
  - `packages/types`: DTOs and Zod validation schemas shared between client and server.
  - `packages/ui`: Shared UI component primitives.
  - `packages/utils`: Shared formatting and validation helpers.

### 2.2 End-to-End Request & Data Flow
```
[Browser / Customer / Admin]
       │
       ▼
[Next.js App Router (apps/web)]
  ├── Server Component (SSR / Metadata)
  └── Client Component (Zustand / React Hooks)
       │
       ▼
[API Client (apps/web/src/services/api.ts)]
  └── Attaches Bearer Token from Supabase Auth session
       │
       ▼ HTTP (localhost:8000/api/v1)
[Express Server (apps/server/src/server.ts)]
  ├── Helmet (Security headers)
  ├── CORS (Allowed origin validation)
  ├── RateLimiter (200 req / 15 min per IP)
  ├── RequestIdMiddleware (UUID tracking)
  └── ApiVersionMiddleware ('v1')
       │
       ▼
[Router Layer (apps/server/src/routes/*)]
  ├── adminAuthGuard / customerAuthGuard
  ├── rbacGuard (Roles.OWNER, Roles.MANAGER, etc.)
  └── validateRequest(ZodSchema)
       │
       ▼
[Controller Layer (apps/server/src/controllers/*)]
  └── Business logic orchestration & response formatting
       │
       ▼
[Service / Repository Layer (apps/server/src/repositories/*)]
  └── ProductRepository, BaseRepository, InventoryService, OrderService
       │
       ▼
[Database Access Layer (apps/server/src/config/supabase.ts)]
  └── Supabase Admin Client (PostgREST / PostgreSQL via service_role key)
       │
       ▼
[PostgreSQL Database (Supabase Cloud)]
  └── 23 active tables, check constraints, foreign keys, RLS policies
```

---

## 3. Verified Working Systems

The following subsystems were inspected, tested, and verified to be functioning properly at runtime:
1. **Health Check Endpoints:**
   - `GET /health` and `GET /api/v1/health` return HTTP 200 with server status `UP`, uptime, version, and ISO timestamp.
2. **Catalog Image Normalization & SSR Rendering:**
   - Products table joined with `product_images` via foreign key `product_images_product_id_fkey`.
   - Distinct image paths (`/images/product-108p.jpg`, `/images/cat-multimeter.jpg`, `/images/product-dm98.jpg`, `/images/product-ctg999.jpg`) correctly returned by `GET /api/v1/products?featured=true`.
   - Next.js homepage (`http://localhost:3000`) renders distinct `src` attributes without fallback placeholders.
3. **Admin Product Creation:**
   - `POST /api/v1/products/admin` creates a row in `products`, inserts initial stock in `inventory`, and inserts the primary image into `product_images` with `public_url` and `storage_path`.
4. **Categories & Brands Listing:**
   - `GET /api/v1/categories` and `GET /api/v1/brands` return active categories and brands with correct slugs and IDs.
5. **Customer Authentication (Supabase Auth Client):**
   - Storefront sign-in and sign-up pages integrate directly with Supabase Auth, generating valid sessions and JWTs.
6. **Workspace Type-Check:**
   - `pnpm run type-check` compiles all 7 packages cleanly (`tsc --noEmit` exit code 0).
7. **Production Builds:**
   - Both `pnpm --filter galaxy-server build` and `pnpm --filter galaxy-web build` produce valid production outputs.

---

## 4. P0 — Release Blockers

### GTH-P0-001: Admin Authentication Bypass & Arbitrary Token Acceptance
- **Status:** FIXED — Sprint 1 (September 16, 2026). The guard now verifies the Supabase access token, loads the matching `admin_users.user_id`, requires `ACTIVE` status, and maps the database role into `req.user`. Runtime checks returned 401 for missing/invalid tokens and 403 for authenticated users without an admin record.
- **Severity:** P0 (Critical Security Vulnerability)
- **Affected User Flow:** Admin authentication & authorization across all admin routes (`/api/v1/products/admin`, `/api/v1/orders`, `/api/v1/customers`, etc.).
- **Exact Files & Lines:** `apps/server/src/middlewares/auth.middleware.ts:33-56`
- **Observed Behavior:**
  - In `development` mode or if `CLERK_SECRET_KEY` is unset, the guard immediately assigns `req.user = { id: 'admin-owner-id', role: 'OWNER' }` and calls `next()`. Any unauthenticated curl or script accessing `/admin` endpoints automatically gets full OWNER permissions.
  - In `production` mode, the middleware checks `if (!token)`, but if any token string is provided (e.g. `Bearer fake-token`), it **does not verify the token**. It immediately assigns `req.user` with `role: 'OWNER'` and calls `next()`.
- **Expected Behavior:** Middleware must verify the Supabase JWT using `supabaseAdmin.auth.getUser(token)`, fetch the user's record from `admin_users`, and verify that `status === 'ACTIVE'`.
- **Root Cause:** Legacy placeholder code that bypassed Clerk in dev and stubbed token verification in production without validating against Supabase Auth.
- **Evidence:** Calling `curl -s http://localhost:8000/api/v1/orders` without any authorization header succeeded and returned all customer orders.
- **Recommended Fix:** Refactor `adminAuthGuard` in `apps/server/src/middlewares/auth.middleware.ts` to call `supabaseAdmin.auth.getUser(token)` and query `admin_users` for active admin status.
- **Estimated Complexity:** S

---

### GTH-P0-002: Inventory Stock Logic Broken by Non-Existent `variant_id` Column
- **Status:** FIXED — Sprint 1 (September 16, 2026). Active inventory service queries now use `product_id`; live reserve, release, decrement, increment, availability, insufficient-stock, and state-restoration smoke tests passed.
- **Severity:** P0 (Fatal Runtime Error / Data Loss)
- **Affected User Flow:** Checkout stock reservation, inventory availability checks, and inventory deduction upon payment.
- **Exact Files & Lines:** `apps/server/src/services/inventory.service.ts:32, 52, 103, 140, 167`
- **Observed Behavior:**
  - Every method in `InventoryService` queries `.or('variant_id.eq.${variantId},product_id.eq.${variantId},id.eq.${variantId}')`.
  - PostgreSQL throws error `42703 (column inventory.variant_id does not exist)`.
  - `checkAvailability` returns `false`. `reserveStock` returns `{ success: false }`. `decrementStock` returns `{ success: false }`.
  - When `OrderService.reserveInventory()` runs, it throws: `Insufficient stock for item: ...` on every order.
- **Expected Behavior:** `inventory` table references `product_id`. Availability checks, reservations, and decrements must succeed against the `product_id` column.
- **Root Cause:** Schema drift: `inventory` table in PostgreSQL has columns `id, product_id, quantity, reserved_quantity, reorder_level, updated_at`. The column `variant_id` was never created.
- **Evidence:**
  ```javascript
  supabase.from('inventory').select('id, quantity').or('variant_id.eq.xxx,product_id.eq.xxx')
  // Result: { code: '42703', message: 'column inventory.variant_id does not exist', status: 400 }
  ```
- **Recommended Fix:** Change `InventoryService` queries to target `product_id` directly: `.eq('product_id', productId)`.
- **Estimated Complexity:** XS

---

### GTH-P0-003: Admin Order State Machine Deadlocks All `PENDING` Orders
- **Status:** FIXED — Sprint 2 (September 16, 2026). Shared uppercase statuses and transitions now drive server enforcement and admin actions. `PENDING` exposes legal next states, payment status remains separate, and backward or terminal transitions return HTTP 400.
- **Severity:** P0 (Core Admin Flow Broken)
- **Affected User Flow:** Admin order management, order fulfillment, and status transitions.
- **Exact Files & Lines:** `apps/web/src/app/admin/(dashboard)/orders/[id]/page.tsx:25-34, 150, 340-343`
- **Observed Behavior:**
  - When an order is created, PostgreSQL sets `status = 'PENDING'`.
  - The admin page evaluates `ALLOWED_TRANSITIONS[order.status]`.
  - The `ALLOWED_TRANSITIONS` object uses PascalCase keys (`Draft`, `PendingPayment`, `Paid`, etc.) and does not contain `'PENDING'`.
  - `nextAllowed` evaluates to `[]`.
  - The status transition dropdown is hidden, and the UI displays: *"This order is in a terminal state (PENDING). No further transitions are allowed."*
  - The admin cannot transition any newly created order to `CONFIRMED`, `PAID`, or `CANCELLED`.
- **Expected Behavior:** Newly created orders in `PENDING` status must allow transition to `CONFIRMED`, `PAID`, or `CANCELLED`.
- **Root Cause:** Casing and terminology mismatch between PostgreSQL check constraints (`'PENDING'`, `'CONFIRMED'`, etc.) and the frontend transition object.
- **Evidence:** Verified on live order `7d2c015b-a582-457d-a102-a4acb3e8cc48` (`status: "PENDING"`). The UI locks status changes completely.
- **Recommended Fix:** Update `ALLOWED_TRANSITIONS` in `apps/web/src/app/admin/(dashboard)/orders/[id]/page.tsx` to use canonical uppercase statuses from `@galaxy/constants` (`OrderStatus.PENDING`, `OrderStatus.CONFIRMED`, etc.).
- **Estimated Complexity:** XS

---

### GTH-P0-004: Product Catalog Category & Brand Filtering Silently Dropped or Broken
- **Status:** FIXED — Sprint 2 (September 16, 2026). Category, brand, and vendor filters now use Zod UUID validation, checked slug/code lookups, and explicit empty results for missing values. UUID/slug parity and malformed inputs passed the Sprint 2 runtime matrix.
- **Severity:** P0 (Core Customer Navigation Broken)
- **Affected User Flow:** Storefront catalog browsing, category filtering, and brand filtering.
- **Exact Files & Lines:** `apps/server/src/repositories/product.repository.ts:45, 58`
- **Observed Behavior:**
  - `ProductRepository.findProductsWithFilters` checks:
    ```typescript
    if (params.category.includes('-')) {
      const { data: cat } = await supabaseAdmin.from('categories').select('id').eq('slug', params.category).single();
      if (cat) query = query.eq('category_id', cat.id);
    }
    ```
  - The frontend catalog dropdowns (`apps/web/src/app/products/page.tsx:174, 186`) pass UUIDs (`cat.id`, `brand.id`).
  - Because UUIDs contain hyphens, the backend searches for `slug = '44444444-4444-4444-a444-444444444441'`, which returns `null`. The filter is never applied and is silently dropped.
  - Conversely, single-word brand slugs (`fluke`, `bosch`, `makita`) have no hyphens. The code enters the `else` branch: `query = query.eq('brand_id', 'fluke')`, which returns 0 results because `brand_id` is a UUID column.
- **Expected Behavior:** Selecting any brand or category in the catalog filters products accurately whether passed as a UUID or a slug.
- **Root Cause:** Checking `.includes('-')` instead of testing whether the string is a valid UUID using regex (as was correctly done for `params.vendor` on line 70).
- **Evidence:**
  - `curl "http://localhost:8000/api/v1/products?brand=fluke"` returns 0 products.
  - `curl "http://localhost:8000/api/v1/products?brand=33333333-3333-4333-a333-333333333331"` returns 5 products (all products, filter dropped).
- **Recommended Fix:** Replace `params.category.includes('-')` and `params.brand.includes('-')` with the UUID regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param)`.
- **Estimated Complexity:** XS

---

### GTH-P0-005: Razorpay Gateway Dependency Conflicts with Intentional B2B UTR Workflow
- **Status:** FIXED — Sprint 4C live verification rerun (September 20, 2026). Authoritative callback checks remain intact; raw-body webhook signature handling, public webhook access, secret non-disclosure, callback-first/webhook-later, webhook-first/callback-later, duplicate delivery, and captured-payment retry all passed against disposable live fixtures. Every success path converged on one idempotent finalizer and cleanup removed all fixtures.
- **Severity:** P0 (Architecture Mismatch / Checkout Failure)
- **Affected User Flow:** Customer checkout and admin payment verification.
- **Exact Files & Lines:** `apps/server/src/controllers/payment.controller.ts:113-124`, `apps/server/src/config/razorpay.ts:9-11`, `apps/web/src/app/checkout/page.tsx:84-92, 219-245`
- **Observed Behavior:**
  - The application requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. If unconfigured, checkout crashes with a 500 error: *"Razorpay credentials not configured"*.
  - The database table `payment_verifications` exists in PostgreSQL, but there are zero controller routes or UI forms to submit a UTR reference number or upload bank payment proof.
  - The admin order detail page (`orders/[id]/page.tsx:401`) only displays "Razorpay Order ID" and has no UI to inspect or approve/reject UTRs.
- **Expected Behavior:** System must support offline B2B payment (Bank Transfer / NEFT / RTGS) where the customer submits a UTR reference, creating a `payment_verifications` row with status `PENDING`, which an admin verifies or rejects in the Admin Portal.
- **Root Cause:** Razorpay gateway code was injected over the planned UTR verification architecture without configuration fallback or UTR endpoint implementation.
- **Recommended Fix:**
  1. Add UTR submission endpoint `POST /api/v1/payments/submit-utr` that inserts into `payment_verifications`.
  2. Add admin endpoints `POST /api/v1/payments/:id/verify-utr` and `POST /api/v1/payments/:id/reject-utr`.
  3. Update `apps/web/src/app/checkout/page.tsx` to provide Bank Transfer / UTR entry option.
  4. Make Razorpay initialization optional.
- **Estimated Complexity:** M

---

### GTH-P0-006: Payment Finalization and Inventory Mutation Were Non-Transactional
- **Status:** FIXED — Sprint 4C live verification rerun (September 20, 2026). The scoped-reservation hotfix was confirmed live. Concurrent reservation allowed exactly one of two competing holds; multi-item reservation failure rolled back completely; successful finalization atomically updated payment, order, reservation, physical quantity, and reserved quantity; exact replay changed no state; two concurrent finalizations produced one mutation and one replay; controlled failure rolled back every value; released-reservation recovery succeeded only when unreserved stock remained. The complete live suite passed 87/87 and removed every fixture.
- **Severity:** P0 (Oversell / Inconsistent Payment State)
- **Affected User Flow:** Razorpay checkout reservation, callback/webhook finalization, cancellation, and reservation expiry.
- **Confirmed Root Cause:** The application first updated `payments`, then called an order service that decremented products one-by-one and finally updated the order. Any intermediate failure could commit `PAID` without stock movement, partially decrement a multi-item order, or allow concurrent overselling.
- **Implemented Fix:** A service-role-only PostgreSQL reservation RPC atomically locks/checks every item, increments `reserved_quantity`, and creates the complete reservation set. A second service-role-only RPC locks the payment, order, reservation, and inventory state and atomically consumes stock, marks reservations consumed, records the Razorpay transaction, and confirms the order. A database replay check returns the same success without a second decrement. The old direct paid transition is disabled.
- **Verification:** The Sprint 4B migration and scoped-finalizer hotfix are live. Disposable database integration, concurrency, rollback, replay, recovery, callback/webhook ordering, and cleanup all passed without a real payment.
- **Estimated Complexity:** M

---

## 5. P1 — Must Fix Before Production

### GTH-P1-001: Admin Inventory View Corrupts Product Names Due to Missing `brand` Column
- **Status:** FIXED — Sprint 1 (September 16, 2026). The live controller returned the real product name, SKU, brand, price, and stock quantities through the verified `products.brand_id -> brands.id` relationship.
- **Severity:** P1
- **Affected Flow:** Admin inventory monitoring (`/admin/inventory`).
- **Exact Files & Lines:** `apps/server/src/controllers/inventory.controller.ts:13, 36-38`
- **Observed Behavior:** `getInventoryList` executes `supabaseAdmin.from('products').select('id, name, sku, brand, price')`. PostgreSQL returns error `42703: column products.brand does not exist` (the column is `brand_id`). Product data query fails completely, causing all inventory items in the admin UI to fall back to dummy placeholder text: `Industrial Tool #c193dd`, `GENERIC-SKU`, and `Galaxy Tools`.
- **Expected Behavior:** Display actual product name, SKU, and brand name.
- **Recommended Fix:** Query `products.select('id, name, sku, price, brand_id, brand:brands(name)')`.
- **Estimated Complexity:** S

---

### GTH-P1-002: Admin Dashboard Low Stock Metrics Crash Due to `variant_id` Column
- **Status:** FIXED — Sprint 1 (September 16, 2026). The dashboard query now uses the flat product inventory contract and the live controller returned a successful low-stock payload without PostgreSQL 42703 errors.
- **Severity:** P1
- **Affected Flow:** Admin dashboard metrics (`/admin/dashboard`).
- **Exact Files & Lines:** `apps/server/src/controllers/analytics.controller.ts:95-97`
- **Observed Behavior:** `getDashboardSummary` queries `inventory.select('id, variant_id, product_id, quantity, reserved_quantity, reorder_level')`. Fails because `inventory.variant_id` does not exist. `lowStockCount` returns `null` and `lowStockItems` is empty.
- **Expected Behavior:** Accurate low stock count and item previews on dashboard.
- **Recommended Fix:** Remove `variant_id` from the inventory query in `analytics.controller.ts`.
- **Estimated Complexity:** XS

---

### GTH-P1-003: Admin Product Edit Stock Updates Silently Swallowed
- **Status:** FIXED — Sprint 1 (September 16, 2026). Stock edits locate inventory by `product_id`, preserve reserved-stock invariants, check every lookup/update/insert error, handle insert races, and were verified by a fresh live inventory read.
- **Severity:** P1
- **Affected Flow:** Admin editing product stock level.
- **Exact Files & Lines:** `apps/server/src/controllers/product.controller.ts:212-235`
- **Observed Behavior:** When updating a product with `stock`, the controller queries `inventory.or('product_id.eq...,variant_id.eq...')`. Fails due to `variant_id`. Code falls into `insert` branch, which fails with unique constraint `inventory_product_id_key`. The error is swallowed and not checked, returning success while the database inventory quantity never updates.
- **Expected Behavior:** Stock update correctly updates existing inventory row.
- **Recommended Fix:** Query inventory using `.eq('product_id', productId)`. Throw on insert/update errors.
- **Estimated Complexity:** XS

---

### GTH-P1-004: Admin Coupons Route Returns 500 (Missing `coupons` Table in DB)
- **Status:** LIVE MIGRATION VERIFIED / PUBLIC STAGING PENDING — Sprint 7C.5 (October 4, 2026). The constrained empty table, admin-only API, OWNER/MANAGER UI, 14/14 disposable live suite, and zero-fixture cleanup passed. Checkout redemption remains disabled so payment finalization is unchanged. Mark fully FIXED after public Hostinger verification.
- **Severity:** P1
- **Affected Flow:** Admin coupon management (`/admin/coupons`) and coupon validation at checkout.
- **Exact Files & Lines:** `apps/server/src/controllers/coupon.controller.ts:24`, `apps/web/src/app/admin/(dashboard)/coupons/page.tsx`
- **Observed Behavior:** Table `public.coupons` does not exist in the database. Any call to `/api/v1/coupons` returns HTTP 500 `"Could not find the table 'public.coupons' in the schema cache"`.
- **Expected Behavior:** Table exists, or coupon functionality returns a clean empty state or disabled notice.
- **Recommended Fix:** Create the `coupons` table in PostgreSQL according to `packages/types` schema.
- **Estimated Complexity:** S

---

### GTH-P1-005: Product Variants Endpoints Crash (Missing `product_variants` Table)
- **Status:** DEFERRED FOR MVP — Sprint 5B (September 21, 2026). No active customer/admin variant UI uses the feature. Variant API routes and incidental product-detail/image lookups were removed; former routes return 404 and live product detail/images return 200. No table was invented.
- **Severity:** P1
- **Affected Flow:** Admin product variant creation and retrieval.
- **Exact Files & Lines:** `apps/server/src/repositories/variant.repository.ts:7`, `apps/server/src/controllers/variant.controller.ts:50-58`
- **Observed Behavior:** Table `public.product_variants` does not exist in the database. `POST /api/v1/products/admin/:id/variants` throws 500 error.
- **Expected Behavior:** Variants table exists in DB, or variant routes are deactivated if product model is flat.
- **Recommended Fix:** Run migration to create `product_variants` table.
- **Estimated Complexity:** S

---

### GTH-P1-006: Unauthenticated Storage Signed Upload URL Endpoint
- **Status:** FIXED — Sprint 1 (September 16, 2026). The route now requires active admin authentication/RBAC and validation restricts requests to known application buckets and safe relative paths. An unauthenticated runtime request returned 401.
- **Severity:** P1 (Security / Abuse Risk)
- **Affected Flow:** Storage upload URL generation.
- **Exact Files & Lines:** `apps/server/src/routes/storage.routes.ts:8`
- **Observed Behavior:** `POST /api/v1/storage/signed-url` has no authentication middleware. Any unauthenticated caller can request signed upload URLs to any storage bucket.
- **Expected Behavior:** Endpoint must require `adminAuthGuard` or `customerAuthGuard` and restrict bucket destinations.
- **Recommended Fix:** Add `adminAuthGuard` to `storageRouter.post('/signed-url', ...)`.
- **Estimated Complexity:** XS

---

### GTH-P1-007: Storefront ProductCard Renders Raw Database UUID for Category
- **Status:** FIXED — Sprint 2 (September 16, 2026). Product listings now join category summaries once, ProductCard renders the category name with a neutral fallback, and the cart no longer renders `category_id`. No per-card request was introduced.
- **Severity:** P1 (UX Defect)
- **Affected Flow:** Storefront homepage and catalog product card display.
- **Exact Files & Lines:** `apps/web/src/components/ProductCard/ProductCard.tsx:59`
- **Observed Behavior:** Renders `<span className={styles.category}>{product.category_id}</span>`. Users see raw UUIDs like `44444444-4444-4444-a444-444444444442`.
- **Expected Behavior:** Display human-readable category name.
- **Recommended Fix:** Join `categories(name)` in `ProductRepository` or map `category_name` into `ProductView`.
- **Estimated Complexity:** XS

---

### GTH-P1-008: Shopping Cart Zustand Store Lost on Page Refresh
- **Status:** FIXED — Sprint 2 (September 16, 2026). The cart now persists a compact validated item shape under `galaxy-tools-cart` and rehydrates after mount. Add/update/remove/clear and simulated refresh restoration passed runtime tests.
- **Severity:** P1 (E-Commerce Conversion Blocker)
- **Affected Flow:** Customer shopping cart and checkout.
- **Exact Files & Lines:** `apps/web/src/store/useCartStore.ts:20-63`
- **Observed Behavior:** Zustand cart store is in-memory only. Refreshing the browser or navigating to external pages empties the cart.
- **Expected Behavior:** Cart items persist in `localStorage`.
- **Recommended Fix:** Wrap `useCartStore` with Zustand `persist` middleware.
- **Estimated Complexity:** XS

---

### GTH-P1-009: Admin Layout Missing Role Enforcement Guard
- **Status:** FIXED — Sprint 1 (September 16, 2026). The dashboard layout now waits for auth resolution and requires the server-derived `isAdmin` state before rendering; other authenticated users are redirected to `/admin/login`.
- **Severity:** P1 (Access Control Defect)
- **Affected Flow:** Admin dashboard routing access control.
- **Exact Files & Lines:** `apps/web/src/app/admin/(dashboard)/layout.tsx:78-83`
- **Observed Behavior:** Layout checks `if (!isLoading && !isAuthenticated)`. A logged-in customer who visits `/admin/dashboard` is not redirected to login.
- **Expected Behavior:** Layout verifies `isAdmin` and redirects non-admins to `/admin/login`.
- **Recommended Fix:** Check `!isAdmin` in layout `useEffect` and redirect if false.
- **Estimated Complexity:** XS

---

### GTH-P1-010: Broken Workspace Linting Pipeline in CI
- **Status:** FIXED — Sprint 5A (September 21, 2026). Server and web now have non-interactive ESLint flat configurations. Both lint commands complete with zero errors; the remaining 46 legacy findings are visible non-blocking warnings.
- **Severity:** P1 (Build & CI Health)
- **Affected Flow:** Workspace CI verification (`pnpm run lint`).
- **Exact Files & Lines:** `apps/server/package.json:9`, `apps/web/package.json:8`
- **Observed Behavior:** `pnpm run lint` fails. `apps/server` has `sh: eslint: command not found`. `apps/web` prompts interactively and fails.
- **Expected Behavior:** `pnpm run lint` executes non-interactively across all workspace packages and passes.
- **Recommended Fix:** Add `eslint` to `apps/server/devDependencies` and add a non-interactive `.eslintrc.json` or `eslint.config.mjs` to `apps/web`.
- **Estimated Complexity:** S

---

### GTH-P1-014: Public Order Status Exposed Private Guest Order Details
- **Status:** FIXED — Sprint 4C live verification (September 20, 2026). A disposable order containing a private UUID, profile/auth identifiers, phone, full address, notes, and sensitive item/SKU snapshots returned only the minimal public order/status projection. All private fixture values were absent and cleanup was verified.
- **Severity:** P1 (Privacy)
- **Affected Flow:** `GET /api/v1/payments/order-status/:id` and the guest order confirmation page.
- **Confirmed Behavior:** Possession of an internal order UUID returned phone number, full delivery address, customer notes, line items, and financial totals.
- **Fix:** The guest-compatible endpoint now returns only `orderNumber`, canonical `status`, `paymentStatus`, and `placedAt`. The confirmation page no longer requests or renders private address, item, note, or payment-total data. The UUID is correlation, not authorization for private data.

---

## 6. P2 — Important Post-Launch Fixes

### GTH-P2-001: Store Settings Kept in Memory Variable
- **Current Status:** POST-LAUNCH — original finding remains outside the MVP launch gate.
- **Files:** `apps/server/src/controllers/settings.controller.ts:7, 73-94`
- **Observed:** Settings modified in admin are saved to a JavaScript variable in memory. When the process restarts or restarts on deploys, all changes are wiped.
- **Recommended Fix:** Persist store settings to a database table `store_settings`.
- **Complexity:** S

### GTH-P2-002: Dead Stub Pages in Storefront & Admin
- **Status:** FIXED — Sprint 5A (September 21, 2026). The three reachable storefront placeholders now redirect to active product, checkout, and order-success flows. The unlinked admin brands/vendors placeholders were removed and return 404 in the production build.
- **Files:**
  - `apps/web/src/app/products/[slug]/page.tsx` (`<div>ProductDetail</div>`)
  - `apps/web/src/app/checkout/payment/page.tsx` (`<div>CheckoutPayment</div>`)
  - `apps/web/src/app/checkout/confirmation/[orderId]/page.tsx` (`<div>OrderConfirmation</div>`)
  - `apps/web/src/app/admin/(dashboard)/brands/page.tsx` (`<div>AdminBrands</div>`)
  - `apps/web/src/app/admin/(dashboard)/vendors/page.tsx` (`<div>AdminVendors</div>`)
- **Observed:** Incomplete placeholder pages returning raw text strings.
- **Recommended Fix:** Delete dead stubs, redirect to active routes (e.g. redirect `/products/[slug]` to `/product/[id]`), or implement full pages.
- **Complexity:** M

### GTH-P2-003: Hardcoded Mock Consignment Tracking Page
- **Current Status:** POST-LAUNCH — original finding remains outside the MVP purchase flow.
- **Files:** `apps/web/src/app/track/page.tsx:55-90`
- **Observed:** Tracking page ignores customer input and always displays static timeline from August 2026.
- **Recommended Fix:** Wire tracking page to backend `shipments` table.
- **Complexity:** S

### GTH-P2-004: Global Rate Limiter Too Restrictive for Storefront
- **Current Status:** POST-LAUNCH — monitor actual production traffic after deployment.
- **Files:** `apps/server/src/server.ts:28-39`
- **Observed:** Single limit of 200 requests per 15 minutes applies across all `/api` routes per IP. Browsing catalog and images quickly exhausts limit.
- **Recommended Fix:** Separate rate limits for read vs write endpoints; raise read threshold to 1000/15min.
- **Complexity:** XS

### GTH-P2-005: Customers Cannot View Their Own Order History
- **Current Status:** POST-LAUNCH — original finding remains outside the MVP checkout flow.
- **Files:** `apps/server/src/routes/order.routes.ts:23-24`
- **Observed:** Order retrieval endpoints are guarded by `adminAuthGuard`. No endpoint exists for authenticated customers to view their past orders.
- **Recommended Fix:** Add `GET /api/v1/orders/customer/my` protected by `customerAuthGuard`.
- **Complexity:** S

---

## 7. P3 — Enhancements / Technical Debt

### GTH-P3-001: Category Product Count Scans Entire Products Table
- **Current Status:** POST-LAUNCH.
- **File:** `apps/server/src/controllers/category.controller.ts:26-28`
- **Issue:** Queries all `category_id` rows in `products` into memory on every request. Should use a PostgreSQL group-by count query or view.
- **Complexity:** XS

### GTH-P3-002: Unoptimized Image Delivery
- **Current Status:** POST-LAUNCH.
- **File:** `apps/web/next.config.js:12`
- **Issue:** `unoptimized: true` disables Next.js image optimization. Should enable image optimization in production with appropriate remote patterns.
- **Complexity:** XS

### GTH-P3-003: Invoice Generation Relies on Browser Print
- **Current Status:** POST-LAUNCH.
- **File:** `apps/web/src/app/admin/(dashboard)/orders/[id]/page.tsx:171`
- **Issue:** No PDF generation backend; relies on `window.print()`.
- **Complexity:** M

### GTH-P3-004: Hardcoded Fallback Team Members in Settings
- **Current Status:** POST-LAUNCH.
- **File:** `apps/server/src/controllers/settings.controller.ts:104-121`
- **Issue:** Hardcodes dummy team members if `admin_users` table query fails.
- **Complexity:** XS

---

## 8. Dead Code / Mock Data — original audit observations

| File Path | Nature | Recommended Action |
| :--- | :--- | :--- |
| `apps/web/src/app/products/[slug]/page.tsx` | Stub returning `<div>ProductDetail</div>` | Delete or 301 redirect to `/product/[id]` |
| `apps/web/src/app/checkout/payment/page.tsx` | Stub returning `<div>CheckoutPayment</div>` | Delete or redirect to `/checkout` |
| `apps/web/src/app/checkout/confirmation/[orderId]/page.tsx` | Stub returning `<div>OrderConfirmation</div>` | Delete or redirect to `/order-success` |
| `apps/web/src/app/admin/(dashboard)/brands/page.tsx` | Stub returning `<div>AdminBrands</div>` | Implement brand management or remove from nav |
| `apps/web/src/app/admin/(dashboard)/vendors/page.tsx` | Stub returning `<div>AdminVendors</div>` | Implement vendor management or remove from nav |
| `apps/web/src/app/track/page.tsx` | Hardcoded August 2026 shipment tracking | Wire to real shipments API |
| `apps/server/src/controllers/settings.controller.ts:104-121` | Mock admin team members | Delete fallback array |

---

## 9. Database Risks — original audit observations

1. **Missing Tables / Deferred Features:**
   - `public.product_variants` remains deferred. The live Sprint 7C.5 migration adds `public.coupons` as an empty admin-only foundation; redemption is not part of the active purchase flow.
   - `public.returns` & `public.refunds` (Referenced in order transitions)
   - `public.inventory_reservations` (Referenced in `inventory.service.ts`)
2. **Column Name Assumptions vs PostgreSQL Reality:**
   - Assumption: `inventory.variant_id` → Reality: Does not exist.
   - Assumption: `products.brand` → Reality: Column is `brand_id`.
3. **Incomplete Live Inventory Coverage (reverified September 21, 2026):**
   - 6 products are active and purchasable; 2 have inventory rows and 4 do not. The missing SKUs are `GTH-BOS-GBH228`, `GTH-MAK-GA5030`, `GTH-FLU-179`, and `GTH-TAP-S14H`. An administrator must enter real quantities or deactivate those listings; no quantities were inferred.
4. **Order Status Check Constraint:**
   - PostgreSQL table `orders` enforces check constraint: `status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED')`. The frontend order transitions must strictly adhere to uppercase strings.

---

## 10. Security Findings — original audit observations

1. **Admin Token Bypass (GTH-P0-001):** High severity. Unauthenticated access in dev; unverified bearer token acceptance in production.
2. **Unauthenticated Storage Signed URL (GTH-P1-006):** High severity. Anonymous callers can obtain signed upload URLs for any bucket.
3. **Missing Admin Guard in Next.js Layout (GTH-P1-009):** Medium severity. Authenticated non-admin customers are not redirected away from `/admin/dashboard`.
4. **CORS Configuration:** Sprint 5B verified production-mode CORS uses `CORS_ORIGIN` and rejects localhost/non-HTTPS/non-origin values. Deployment must set the actual HTTPS storefront origin.
5. **No SQL Injection Identified:** Supabase PostgREST parameterization protects against standard SQL injection in active repository queries.

---

## 11. UX / Frontend Findings — original audit observations

1. **Category Raw UUIDs on Product Cards (GTH-P1-007):** Every product card renders a raw UUID string instead of category title.
2. **Catalog Dropdown Filters Non-Functional (GTH-P0-004):** Filtering by category or brand in the catalog UI fails silently.
3. **Cart Data Loss on Refresh (GTH-P1-008):** In-memory Zustand store loses all items upon page refresh.
4. **Admin Order State Lockout (GTH-P0-003):** Admins cannot advance pending orders.

---

## 12. Production & Deployment Findings — original audit observations and later notes

1. **Linting:** FIXED in Sprint 5A. Server and web lint run non-interactively with zero errors; 46 legacy warnings remain non-blocking and visible.
   - Sprint 5B recheck: 45 warnings (34 server, 11 web), zero errors.
2. **Environment Variable Drift:**
   - `apps/server/.env.example` contains outdated Clerk and Razorpay references that do not reflect the Supabase-only architecture.
3. **Cache Invalidation:** Stale Next.js server caching on the homepage was addressed via `export const dynamic = 'force-dynamic'`, but category and product pages should be reviewed for similar caching behavior.

---

## 13. Test Coverage Gaps — original audit observations

1. **Zero Automated Unit/Integration Tests:** Neither `apps/server` nor `apps/web` contains automated tests (`*.test.ts` or `*.spec.ts`).
2. **Critical Uncovered Paths:**
   - Order creation and pricing calculations.
   - Inventory reservation and stock depletion.
   - Status transition state machine validation.
   - Catalog filtering logic.

---

## 14. Recommended Sprint Backlog — original proposal, not current plan

```
Sprint 1 (P0 Blockers - Est: 1.5 Days)
  ├── 1. Fix GTH-P0-001: Implement proper Supabase Auth adminAuthGuard
  ├── 2. Fix GTH-P0-002: Align inventory.service.ts queries to product_id
  ├── 3. Fix GTH-P0-003: Fix ALLOWED_TRANSITIONS uppercase statuses in orders/[id]/page.tsx
  ├── 4. Fix GTH-P0-004: Fix UUID regex check in ProductRepository
  └── 5. Fix GTH-P0-005: Implement UTR submission and verification flow

Sprint 2 (P1 Must-Fix - Est: 1.5 Days)
  ├── 6. Fix GTH-P1-001: Correct products.brand column query in inventory.controller.ts
  ├── 7. Fix GTH-P1-002: Remove variant_id from analytics.controller.ts
  ├── 8. Fix GTH-P1-003: Fix inventory stock update in product.controller.ts
  ├── 9. Fix GTH-P1-006: Add adminAuthGuard to storage/signed-url
  ├── 10. Fix GTH-P1-007: Display category name instead of UUID on ProductCard
  ├── 11. Fix GTH-P1-008: Add persist middleware to useCartStore
  ├── 12. Fix GTH-P1-009: Add isAdmin check to admin dashboard layout
  └── 13. Fix GTH-P1-010: Fix ESLint packages and non-interactive linting

Sprint 3 (P2 Quality & Polish - Est: 2 Days)
  ├── 14. Fix GTH-P2-001: Persist store settings to PostgreSQL table
  ├── 15. Fix GTH-P2-002: Clean up dead stub pages
  ├── 16. Fix GTH-P2-004: Configure tiered rate limits
  └── 17. Fix GTH-P2-005: Add customer order history endpoint
```

---

## Original audit totals (historical; excludes later-added P0-006 and P1-014)

- **TOTAL P0:** 5
- **TOTAL P1:** 10
- **TOTAL P2:** 5
- **TOTAL P3:** 4
- **TOTAL FINDINGS:** 24

Current totals and launch blockers are in the dated current-state overlay at the top of this file. The original 24 plus the two later-added IDs equal 26 catalogued findings. Fixed historical descriptions and the original UTR proposal remain for traceability; Razorpay is the selected MVP payment path, and UTR is not a launch requirement.
