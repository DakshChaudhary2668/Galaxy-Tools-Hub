# Sprint 4A — Razorpay Trust and Binding Report

**Date:** September 20, 2026
**Scope:** Authoritative checkout pricing, inventory precheck, internal-order/Razorpay-order binding, verification facts, and basic replay protection.

## Confirmed root causes

- Checkout claimed to calculate on the server but multiplied browser-supplied `price` values.
- Order-item snapshots also persisted browser-supplied name, SKU, HSN fallback, price, and tax values.
- Inventory was not checked before payment initiation.
- The Razorpay order ID was returned to the browser but never stored against the internal order.
- Verification selected the internal order using browser-supplied `orderId`.
- HMAC comparison used ordinary string comparison and signature success alone could mark an order paid.
- Successful payment rows were inserted with `amount = 0`; insert/update results were not checked.
- Repeating verification could insert another successful row and invoke inventory mutation again.

## Files changed

- `apps/server/src/controllers/payment.controller.ts`
- `apps/server/src/services/payment.service.ts`
- `apps/server/src/services/order.service.ts`
- `apps/server/src/test_sprint4a.ts`
- `apps/server/package.json`
- `apps/web/src/app/checkout/page.tsx`
- `apps/web/src/services/payment.service.ts`
- `packages/types/index.ts`
- `Docs/schema.sql`
- `supabase/migrations/20260920005804_razorpay_payment_binding_constraints.sql`
- `Docs/FINAL_AUDIT.md`
- `Docs/SPRINT_4A_RAZORPAY_BINDING_REPORT.md`

## Schema changes

The official Supabase CLI generated the versioned migration. It adds partial unique indexes for non-null external identifiers:

- `payments.gateway_reference` — one Razorpay order ID can map to only one payment row.
- `payments.transaction_id` — one Razorpay payment ID can be recorded only once.

The migration performs explicit duplicate checks and aborts with the conflicting external IDs instead of deleting or reconciling data automatically. A read-only live preflight found zero payment rows and no conflicts. The migration file is committed code only; it was not applied to the live database in this sprint.

## Authoritative pricing behavior

The browser checkout contract now sends only `productId` and `quantity` for each item. Extra legacy display fields are stripped by the shared Zod request schema and are not used.

The server batch-loads trusted product rows and validates:

- product existence;
- active and purchasable status;
- fixed, positive selling price;
- positive integer quantity;
- minimum order quantity when configured.

Line totals and subtotal are calculated in paise from database prices. GST is calculated from each product's database tax rate as the included-tax component. Shipping remains the existing trusted rule: ₹500 below ₹50,000 and free at or above ₹50,000. The returned Razorpay amount comes from this server calculation.

## Inventory precheck

Inventory rows are loaded by product ID before an internal or Razorpay order is created. Checkout rejects a missing inventory row and checks `available = quantity - reserved_quantity`. Clearly insufficient stock is rejected. No reservation was introduced because reservation/finalization atomicity belongs to Sprint 4B.

## Razorpay/internal-order mapping

After creating the internal order, its item/address snapshots, and the Razorpay order, the server inserts one pending `payments` row containing:

- internal `order_id`;
- `payment_method = GATEWAY`;
- `gateway_reference = Razorpay order ID`;
- authoritative non-zero amount;
- `currency = INR`;
- `status = PENDING`.

Every database result that affects this flow is checked. A failed binding insert returns an error rather than reporting checkout success.

## Verification logic

Verification resolves the pending payment and internal order through the stored Razorpay order ID. The optional browser `orderId` is correlation only; a mismatch is rejected.

The server then:

1. verifies the Razorpay signature with HMAC-SHA256 and `timingSafeEqual`;
2. fetches the payment from Razorpay's server API;
3. confirms payment ID, Razorpay order ID, amount in paise, and currency;
4. requires `status = captured` and `captured = true`;
5. updates the existing pending payment row rather than inserting another payment row;
6. marks the mapped internal order paid.

Signature mismatch no longer mutates an arbitrary browser-selected order.

## Replay behavior

The payment transaction ID is checked before mutation. An already-paid payment bound to the same payment/order mapping returns the existing success result and calls the now-idempotent `markPaid`, which exits before inventory mutation when the order is already paid. A payment ID bound elsewhere or already in a conflicting state is rejected.

The unique transaction-ID index is the database backstop for duplicate payment identities. Full transactional concurrency and webhook idempotency remain Sprint 4B work.

## Frontend contract and UX

The checkout layout and interaction design were intentionally not redesigned. Existing loading, inline error, failure callback, and Razorpay states remain. The only frontend behavior change is the smaller trust-safe request payload; Razorpay Checkout continues to receive the server-returned amount, currency, public key ID, and Razorpay order ID.

## Tests

Focused deterministic tests use database/Razorpay-shaped fixtures and no real money. All 16 requested cases are covered:

1. lower fake browser price ignored;
2. higher fake browser price ignored;
3. unknown product rejected;
4. zero, negative, and fractional quantities rejected;
5. missing inventory rejected;
6. insufficient available stock rejected;
7. Razorpay order mapping targets the correct internal order;
8. pending payment amount is authoritative and non-zero;
9. unknown Razorpay order rejected;
10. conflicting browser order correlation rejected;
11. amount mismatch rejected;
12. currency mismatch rejected;
13. payment/order mismatch rejected;
14. authorized/uncaptured payment rejected;
15. successful payment replay classified without another insert path;
16. client checkout response contains no secret.

Verification results:

- focused Sprint 4A tests: pass, 16/16;
- shared constants typecheck: pass;
- shared types typecheck: pass;
- server typecheck: pass;
- web typecheck: pass;
- server production build: pass;
- web production build: pass after allowing the existing `next/font` Google Fonts fetch;
- root `pnpm type-check`: blocked by the known Node 25/pnpm no-output stall; direct workspace binaries passed;
- root `pnpm build`: blocked by the same stall; direct server and web production builds passed.

## Remaining work for Sprint 4B

- Razorpay webhook signature processing and source-of-truth reconciliation.
- One database transaction for payment finalization, order status, inventory mutation, and idempotency.
- Reservation creation, ownership, expiry, and release.
- Recovery/reconciliation for a captured payment when later internal persistence fails.
- Refund and chargeback reconciliation.
- Removal of the fixed guest profile contract when customer checkout identity is finalized.

## Git diff summary

Sprint 4A adds a shared validated checkout/verification contract, a focused payment-domain service, a rewritten payment controller flow, idempotent paid-order guard, a smaller browser request, two uniqueness indexes, one versioned migration, and one 16-case test script. Existing dirty-worktree changes from Sprints 1–3 were preserved and unrelated features were not modified.
