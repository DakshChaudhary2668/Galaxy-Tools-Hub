# Sprint 4C — Live Payment Verification Report

**Date:** September 20, 2026
**Result:** PASS. The finalizer hotfix is live and the complete payment-integrity suite passed 87/87.

## Live schema verification

The service-role OpenAPI surface confirms the live `inventory_reservations` columns and all four RPC signatures. Observable live tests confirmed:

- `quantity > 0` rejects zero with `23514`;
- reservation status rejects an invalid value with `23514`;
- `reserved_quantity >= 0` rejects `-1` with `23514`;
- `reserved_quantity <= quantity` rejects `11 > 10` with `23514`;
- duplicate `(order_id, product_id)` reservation rejects with `23505`;
- duplicate payment gateway reference rejects with `23505`;
- duplicate payment transaction ID rejects with `23505`;
- `anon` and an authenticated disposable user receive `42501` for reservation RPC execution;
- `service_role` successfully executes reservation, release, and expiry RPCs.

This workspace has no database URL or authenticated Supabase CLI token. PostgreSQL catalog-only details—function source text and the exact active-expiry index name—could not be independently queried. The already-confirmed deployed object list was not recreated. Expiry-index behavior was exercised successfully.

## Disposable fixtures

The suite created only clearly prefixed, inactive, non-purchasable `S4C-*` products, dedicated inventory rows, a dedicated auth/profile fixture, disposable orders/items/payments, and reservations. Existing category, brand, and vendor IDs were referenced read-only. No legitimate product or customer stock was changed and no Razorpay charge was attempted.

## Live database results

The rerun passed all 87 live checks. Reservation coverage included:

- valid reservation changed `10 / 0` to `10 / 4`;
- insufficient second reservation was rejected without changing the first;
- genuinely concurrent requests for four units against quantity five produced exactly one success and final `reserved_quantity = 4`;
- a two-product order with one insufficient item rolled back the available item's reservation and inserted no reservation rows;
- reserving the same order twice returned replay without another increment;
- release decremented reserved stock once and replay changed nothing;
- stale active reservation expired and restored stock;
- a second expiry run changed nothing;
- reserved stock never became negative;
- anon/auth RPC execution was denied while service-role execution succeeded.

Before invoking global expiry, the suite queried all stale active reservations and confirmed every candidate belonged to this test run. It would have aborted rather than expire a legitimate reservation.

## Finalizer hotfix verification

The live function now scopes the reservation side of the parity `FULL JOIN` with `where order_id = v_order.id`. A valid reservation finalized successfully even while other test orders had reservation rows, proving the prior cross-order mismatch was removed.

## Corrective migration

Created with the official Supabase CLI:

- `supabase/migrations/20260920081651_fix_finalizer_reservation_scope.sql`

The minimal correction filters reservations to `v_order.id` in a subquery before the `FULL JOIN`. The original Sprint 4B migration was corrected as source of truth for fresh databases. The new migration replaces only the existing finalizer for the already-migrated live database; it does not recreate tables, indexes, constraints, or other RPCs.

The corrective migration was applied manually before this rerun and its behavior was verified live.

## Atomic finalization, replay, and rollback

- Successful finalization changed payment to `PAID`, recorded the expected transaction ID, changed order payment status to `PAID`, changed order status to `CONFIRMED`, consumed the reservation, changed inventory quantity from 10 to 6, and changed reserved quantity from 4 to 0.
- Exact replay returned `replay: true`; a complete before/after snapshot was identical.
- Two concurrent finalizations both returned safely: one effective mutation and one replay. Quantity and reserved quantity each changed exactly once and the reservation was consumed once.
- A controlled amount mismatch returned `23514`; payment, order, inventory, reserved quantity, and reservation snapshots were unchanged.

## Released reservation and captured-payment recovery

- A released reservation with sufficient unreserved stock finalized once, consumed the reservation, decremented quantity safely, and kept reserved quantity at zero.
- A released reservation whose stock was held by another order failed with `23514`; its complete state snapshot was unchanged.
- A simulated temporary captured-payment finalization error left payment pending. Retrying with correct facts succeeded once, and the next retry returned replay.

## Callback/webhook convergence

Both callback-first/webhook-later and webhook-first/callback-later sequences produced one effective finalization followed by safe replays. Across two four-unit orders, shared inventory moved from 20 to 12 and reserved quantity returned to zero. Duplicate arrivals did not repeat any side effect.

GTH-P0-005 and GTH-P0-006 are verified fixed.

## Webhook security

A separate disposable HTTP rehearsal passed 16 checks:

- a correctly signed raw body returned HTTP 200 without browser authentication;
- invalid signature returned HTTP 400;
- modified body with the old signature returned HTTP 400;
- missing signature returned HTTP 400;
- the webhook secret appeared in neither success responses nor captured server logs.

No real Razorpay API request or payment was made; an ignored test event exercised only the raw-body signature boundary.

## Order lookup privacy

The live-backed local endpoint was queried with a raw disposable order UUID. The fixture contained private order/profile/auth IDs, phone, full address, customer notes, product name, and SKU. None appeared in the response. The endpoint returned only the intended guest-safe order/status fields. GTH-P1-014 is verified fixed.

## Regression and builds

- Sprint 4A focused regression: pass
- Sprint 4B focused suite: 30/30 pass
- Sprint 4C complete live payment-integrity suite: 87/87 pass
- Sprint 4C webhook/privacy HTTP checks: 16/16 pass
- config/constants/types package typechecks: pass
- server typecheck: pass
- web typecheck: pass
- server production build: pass
- web production build: pass

## Cleanup

Cleanup ran after the complete live suite and after the independent HTTP rehearsal. Final read-only verification found:

- `S4C-*` products: 0
- `S4C-*` orders: 0
- `sprint4c-*@example.invalid` profiles: 0

Tracked payments, reservations, items, addresses, inventory rows, profiles, and auth users were deleted before their parent fixtures. No legitimate rows were targeted.

## Final status

- GTH-P0-005: FIXED
- GTH-P0-006: FIXED
- GTH-P1-014: FIXED

No payment-integrity launch blocker remains from Sprint 4C. Razorpay dashboard configuration and operational monitoring remain deployment operations, not failures in the verified finalization path.
