# Sprint 4B — Payment Finalization Report

**Date:** September 20, 2026
**Scope:** Razorpay payment finalization, inventory reservation/release, webhook recovery, and guest order-status privacy.

## 1. Findings confirmed

- Callback finalization updated the payment before sequential inventory/order writes. A later failure could leave a paid payment with unchanged or partially changed inventory (GTH-P0-006).
- Inventory methods used optimistic per-item application updates and had no durable order-bound reservation ownership.
- `inventory_reservations` exists in the live API schema and had zero rows. It contains the required core columns but had no exposed reservation/finalization RPCs.
- The public order-status route returned address, phone, customer notes, item snapshots, and totals solely from an internal UUID (GTH-P1-014).
- Express parsed JSON globally before any webhook-specific raw-body handling existed.

Ponytail review also identified two removable layers in Sprint 4A: the identity-only checkout response builder and application-level replay/sequential finalization logic. Both were removed; replay and mutation ownership now live in the database finalizer.

## 2. Files changed

- `apps/server/src/controllers/payment.controller.ts`
- `apps/server/src/routes/payment.routes.ts`
- `apps/server/src/server.ts`
- `apps/server/src/services/payment.service.ts`
- `apps/server/src/services/payment-finalization.service.ts`
- `apps/server/src/services/order.service.ts`
- `apps/server/src/scripts/expire-reservations.ts`
- `apps/server/src/test_sprint4a.ts`
- `apps/server/src/test_sprint4b.ts`
- `apps/server/package.json`
- `apps/server/.env.example`
- `.env.example`
- `apps/web/src/app/order-success/page.tsx`
- `apps/web/src/services/payment.service.ts`
- `packages/config/env-schema.ts`
- `Docs/schema.sql`
- `Docs/FINAL_AUDIT.md`
- `Docs/SPRINT_4B_PAYMENT_FINALIZATION_REPORT.md`
- `supabase/migrations/20260920011714_payment_reservations_and_finalization.sql`

## 3. Migration files

Created with the official Supabase CLI:

- `supabase/migrations/20260920011714_payment_reservations_and_finalization.sql`

It intentionally does not recreate `uq_payments_gateway_reference` or `uq_payments_transaction_id`; those verified live indexes remain owned by Sprint 4A.

The repository has no `supabase/config.toml`, link metadata, database password, or normal migration deployment configuration. The migration was therefore created but not applied. A human must apply it through the project's normal reviewed Supabase deployment workflow before deploying the server changes.

## 4. Live inventory status

Read-only service-role check:

- active and sellable products: **6**
- inventory rows: **2**
- active/sellable products missing inventory: **4**

Missing rows:

| Product ID | SKU |
|---|---|
| `55555555-5555-4555-a555-555555555551` | `GTH-BOS-GBH228` |
| `55555555-5555-4555-a555-555555555552` | `GTH-MAK-GA5030` |
| `55555555-5555-4555-a555-555555555553` | `GTH-FLU-179` |
| `55555555-5555-4555-a555-555555555554` | `GTH-TAP-S14H` |

No stock rows were fabricated. Checkout continues to reject those products until an admin supplies legitimate stock.

## 5. Reservation model

One row represents one order/product aggregate. It records order, product, positive quantity, expiry, timestamps, and one of `ACTIVE`, `CONSUMED`, `RELEASED`, or `EXPIRED`. A unique `(order_id, product_id)` index prevents duplicate ownership. An active-expiry partial index supports maintenance scans. RLS is enabled; table access and RPC execution are revoked from `public`, `anon`, and `authenticated`, then granted to `service_role` only.

`reserve_order_inventory(order_id)` takes a transaction-scoped advisory lock, locks the order and every inventory row in stable product order, validates the complete item set, increments `reserved_quantity`, and inserts all reservations. PostgreSQL rolls the entire function back if any item fails, so partial reservation sets cannot commit.

The global advisory lock is intentionally simple. If measured checkout throughput later proves it necessary, it can be replaced by ordered per-product locks without changing the public contract.

## 6. Reservation expiry and release

The TTL is **30 minutes**. `release_order_inventory` moves only `ACTIVE` rows to `RELEASED` or `EXPIRED` while atomically reducing `reserved_quantity`. Repeating it finds no active rows and changes nothing.

`expire_inventory_reservations()` releases all overdue active order reservations. Production should run `pnpm --filter galaxy-server reservations:expire` every five minutes from the platform scheduler/cron. There is no public maintenance endpoint.

Checkout calls release if Razorpay order creation or mandatory payment-binding persistence fails. A `payment.failed` webhook does not immediately release stock because another payment attempt against the same Razorpay order may still capture; TTL expiry is the terminal release mechanism.

## 7. Atomic finalization design

`finalize_razorpay_payment` is the only Razorpay success mutation boundary. In one PostgreSQL transaction it:

1. serializes inventory mutation and locks the stored gateway payment;
2. verifies gateway order, amount, currency, transaction identity, and allowed payment state;
3. returns the existing result for the same already-paid transaction;
4. locks the internal order, reservations, and inventory;
5. verifies reservation quantities match order-item aggregates;
6. decrements physical and reserved stock exactly once;
7. marks reservations `CONSUMED`;
8. marks the payment `PAID` with the Razorpay payment ID; and
9. sets `orders.payment_status = PAID` and canonical `orders.status = CONFIRMED`.

Any exception rolls back every mutation. `PAID` remains a payment status, never an order status.

## 8. RPC/transaction implementation

The migration supplies four service-role-only RPCs:

- `reserve_order_inventory(uuid)`
- `release_order_inventory(uuid, text)`
- `expire_inventory_reservations()`
- `finalize_razorpay_payment(text, text, numeric, text)`

Functions use `SECURITY INVOKER`, an empty search path, schema-qualified relations, deterministic lock ordering, check constraints, and the existing unique payment indexes as the conflict backstop.

## 9. Callback behavior

The callback retains Sprint 4A's timing-safe checkout signature, stored mapping lookup, authoritative Razorpay payment fetch, amount/currency/order checks, and captured-state requirement. It no longer writes payment/order/inventory itself; it calls the common finalizer.

If Razorpay confirms capture but the finalizer returns a temporary database error, the callback returns HTTP 202 with `status: processing` and `recoverable: true`. The customer is not told the captured payment failed, and the webhook can retry the same finalizer.

## 10. Webhook behavior

`POST /api/v1/payments/webhook/razorpay` is public by design and supports:

- `payment.captured` — fetch authoritative payment and finalize;
- `order.paid` — fetch authoritative payment and finalize;
- `payment.failed` — acknowledge without premature release;
- other events — acknowledge and ignore.

Success events never trust amount, currency, order ownership, or capture state from the payload alone. The payment ID is used to fetch Razorpay's current server-side payment before invoking the finalizer. A finalization error remains non-2xx so Razorpay retries.

## 11. Signature handling

The global JSON parser's `verify` callback retains the exact bytes only for the Razorpay webhook path. The handler computes HMAC-SHA256 over that raw buffer with server-only `RAZORPAY_WEBHOOK_SECRET` and compares fixed-length buffers with `timingSafeEqual` before using the parsed body. Invalid or malformed signatures are rejected.

Production environment validation now requires `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Only the public key ID can appear in the browser checkout response.

## 12. Idempotency strategy

All success arrivals—callback, callback retry, webhook, duplicate webhook, or later reconciliation—use the same database function. Transaction serialization plus the existing unique gateway-reference and transaction-ID indexes ensure one payment success. The same paid transaction returns `replay: true` before stock mutation. A different transaction for an already-paid mapping is rejected, and any late uniqueness conflict rolls back stock and reservation changes.

## 13. Captured-payment recovery

Webhook delivery is the primary recovery mechanism after a lost callback or temporary finalization failure. The stored pending payment mapping retains the authoritative order/amount/currency facts. If a reservation expired before retry, the finalizer can reacquire and consume the order quantity only when unreserved stock is still available; otherwise it fails closed for manual reconciliation instead of overselling.

## 14. Order lookup privacy

Guest checkout remains intentional, so requiring customer authentication would break the current flow. The smallest safe fix is a minimal public status projection: order number, order status, payment status, and placement time. Phone, address, notes, private IDs, line items, and totals are no longer queried or returned. The order-success page was reduced to that contract without redesigning checkout.

## 15. Test matrix and results

`apps/server/src/test_sprint4b.ts` contains 30 deterministic Razorpay-test/mocked and structural transaction checks covering signature tampering, gateway facts, mapping conflicts, missing/reserved stock, raw-body retention, public-route registration, privacy projection, production secret failure, reservation constraints, serialization/row locks, atomic mutation ownership, replay behavior, restricted RPC permissions, expiry idempotency, and released-reservation recovery. Result: **30/30 passed**.

The Sprint 4A trust regression also passed. No real payment and no real customer-order mutation occurred.

A disposable PostgreSQL/Supabase database integration run was not possible because the repository has no local Supabase configuration and no linked migration workflow. This remains a deployment verification gate; the test suite does not claim that static SQL checks replace a migrated-database concurrency test.

## 16. Builds and typechecks

- server TypeScript typecheck: pass
- web TypeScript typecheck: pass
- server production build: pass
- web production build: pass
- Sprint 4A payment regression: pass
- Sprint 4B focused suite: pass, 30/30
- root `pnpm type-check` / `pnpm build`: the known Node 25/pnpm no-output stall recurred; direct workspace binaries completed successfully

## 17. Remaining launch blockers

1. Apply `20260920011714_payment_reservations_and_finalization.sql` through the reviewed Supabase migration workflow.
2. Run disposable-database rollback/concurrency tests after migration, then Razorpay Test Mode callback/webhook race tests.
3. Configure `RAZORPAY_WEBHOOK_SECRET` and register `payment.captured`, `payment.failed`, and `order.paid` in the Razorpay dashboard.
4. Schedule reservation expiry every five minutes.
5. Enter legitimate inventory for the four missing sellable products or make them non-purchasable.

Until items 1–2 are complete, GTH-P0-005 and GTH-P0-006 remain partially fixed rather than being overstated as production-verified.

## 18. Git diff summary

Sprint 4B adds one additive migration, four restricted database RPCs, one thin server RPC adapter, one signed webhook route, raw-body capture, checkout reservation/release, callback/webhook convergence, recoverable captured-payment semantics, an expiry script, a minimal public order projection, and a 30-case test suite. It deletes the identity response wrapper and application-level Razorpay replay/sequential finalization logic. Existing dirty-worktree changes from earlier sprints were preserved; coupons, variants, UTR, and unrelated P2/P3 work were not touched.
