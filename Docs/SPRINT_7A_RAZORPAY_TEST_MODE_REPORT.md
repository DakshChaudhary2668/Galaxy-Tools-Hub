# Sprint 7A — Razorpay Test Mode Integration Report

**Date:** September 27, 2026
**Scope:** Local Razorpay Test Mode configuration, end-to-end verification, and Sprint 7A.1 automatic-capture confirmation only.
**Constraints observed:** No deployment, no live keys, no public webhook configuration, no payment business-logic change.

## Result

The existing checkout, callback verification, payment-fact validation, atomic finalizer, and replay protection work with the received Razorpay Test Mode account. Sprint 7A.1 confirmed the corrected dashboard setting with one new browser Test Mode netbanking payment: the first post-payment Razorpay API observation reported `captured`, no manual capture was used, the database remained pending until the captured-payment callback path ran, finalization mutated inventory exactly once, and replay was idempotent.

The earlier Sprint 7A run remains useful negative-path evidence: while auto-capture was not active/effective, the callback correctly rejected an `authorized` payment and did not mark it paid. Its later manual Test API capture was limited to that historical run and was **not** repeated in Sprint 7A.1.

**TEST MODE configured:** YES, in local git-ignored environment files only.
**Ready for Sprint 7B:** YES. Sprint 7A.1 closed the Test Mode automatic-capture gate. No deployment was performed.

## Sprint 7A.1 — automatic-capture confirmation

| Check | Result |
|---|---|
| Browser payment | PASS — one new disposable ₹600 INR Test Mode netbanking payment |
| Dashboard configuration | Automatic Capture ON; 12-minute timeout; normal refund after timeout; Test Mode (client-confirmed) |
| Initial Razorpay state | `captured` on the first post-payment API observation |
| Automatic capture | PASS |
| Capture delay | At most 120 seconds by available API evidence: payment created at 17:44:42 IST and first observed captured at 17:46:42 IST; no exact gateway capture timestamp was exposed |
| Manual capture used | NO |
| Pre-finalization database state | Payment/order `PENDING`; reservation `ACTIVE`; inventory quantity 3 and reserved quantity 1 |
| Premature paid/consumption | None |
| Signed callback/finalization | PASS — HTTP 200, `replay: false` |
| Final state | Payment `PAID`; order `PAID` / `CONFIRMED`; reservation `CONSUMED` |
| Inventory mutation | Exactly once: quantity 3 → 2; reserved quantity 1 → 0 |
| Signed replay | PASS — HTTP 200, `replay: true`; rows, quantities, and timestamps unchanged |
| Duplicate mutation | None |
| Fixture cleanup | PASS — exact product, inventory, order, order item, address, reservation, and payment rows removed; zero image/document metadata existed |

The normal local storefront created the single internal order, payment mapping, and reservation. Because Razorpay's third-party iframe rendered blank in the Codex in-app browser, the same already-created Razorpay order was opened in Chrome through a disposable local harness. This did not create a second order and did not modify application or payment code. The user completed the visible Test Mode checkout and supplied callback-success evidence. The existing signed `/api/v1/payments/verify` path was then exercised after the gateway reported `captured`.

## Environment and credential exposure

| Check | Result |
|---|---|
| Backend `RAZORPAY_KEY_ID` present and Test Mode | PASS |
| Backend `RAZORPAY_KEY_SECRET` present | PASS |
| Frontend `NEXT_PUBLIC_RAZORPAY_KEY_ID` present and matches backend | PASS |
| Live key absent | PASS |
| Webhook secret | Not configured locally; not required for server startup, and no webhook request was accepted during this sprint |
| Backend secret in tracked source/docs | 0 matches |
| Backend secret in optimized browser bundle | 0 matches |
| `NEXT_PUBLIC_*SECRET*` variables | 0 |

No credential values were printed, documented, committed, or placed in browser configuration.

## Server and checkout verification

- Compiled Express server initialized with the Test Mode pair.
- `GET /health` returned 200.
- `GET /api/v1/health` returned 200.
- Actual payment routes:
  - `POST /api/v1/payments/checkout`
  - `POST /api/v1/payments/verify`
  - `POST /api/v1/payments/webhook/razorpay`
  - `GET /api/v1/payments/order-status/:id`
- A disposable active product with quantity 3 was used. The browser supplied only product ID, quantity, contact, and shipping data.
- The backend loaded the product and inventory, calculated ₹100 item value plus ₹500 shipping, returned 60,000 paise in INR, created a Razorpay `order_…`, persisted the matching `gateway_reference`, and reserved exactly one unit.
- The local storefront loaded Razorpay Checkout in visible Test Mode and displayed the server-generated ₹600 total.

## Callback, finalization, and replay

| Check | Result |
|---|---|
| Browser callback reached backend | PASS |
| Browser callback HMAC signature | PASS — execution reached captured-payment validation |
| Initial captured-state check | EXPECTED REJECTION — Razorpay still reported `authorized` |
| Test API capture | PASS; required because account auto-capture was not active/effective |
| Captured-payment callback recovery | PASS, HTTP 200 |
| Payment identity/order binding | PASS |
| Amount verification | PASS |
| Currency verification (`INR`) | PASS |
| `payments.status` | `PAID` |
| `orders.payment_status` / `orders.status` | `PAID` / `CONFIRMED` |
| Reservation state | `CONSUMED` |
| Inventory quantity delta | exactly -1 |
| Reserved quantity delta | exactly -1 |
| Same-callback replay | PASS; HTTP 200 with replay result |
| Replay inventory mutation | none |
| Different transaction ID after finalization | blocked |

The failed generic international-card attempt created no paid application state. The successful controlled transaction used Razorpay Test Mode netbanking; no real money moved.

## Failure paths

| Case | Result |
|---|---|
| Invalid callback signature | rejected, HTTP 400 |
| Unknown Razorpay order mapping | rejected, HTTP 404 |
| Wrong internal order correlation | rejected, HTTP 409 |
| Mismatched gateway order | rejected by focused regression |
| Mismatched amount | rejected by focused regression |
| Mismatched currency | rejected by focused regression |
| Authorized but not captured | rejected, HTTP 409 |
| Duplicate transaction with different ID | blocked by atomic finalizer |

## Webhook source readiness

- Exact route: `POST /api/v1/payments/webhook/razorpay`.
- Express preserves the exact raw request bytes before JSON parsing for this route.
- HMAC verification uses the backend-only `RAZORPAY_WEBHOOK_SECRET` and timing-safe comparison.
- Handled events: `payment.captured`, `payment.failed`, and `order.paid`.
- `payment.captured` and `order.paid` resolve the persisted gateway mapping, fetch and validate Razorpay payment facts, and call the same `finalizeRazorpayPayment` path as the callback.
- Actual webhook delivery remains deferred to Sprint 7B after the backend has its final Hostinger HTTPS URL and a real webhook secret.

## Fixture cleanup

Before cleanup: 1 disposable product, 1 inventory row, 2 orders, 2 order items, 2 reservations, 2 payment mappings, and 0 product-image rows. After cleanup, all listed row counts were 0 and no `S7A-%` product remained. No auth/profile fixture or storage object was created. Razorpay Test dashboard records were intentionally retained.

Sprint 7A.1 used a separate `S7A1-…` fixture containing exactly 1 product, 1 inventory row, 1 order, 1 order item, 1 address, 1 reservation, and 1 payment mapping. Cleanup removed every row. Post-cleanup counts for the exact product, SKU, inventory, order, order item, reservation, payment, product-image metadata, and product-document metadata were all zero. No storage object was created. The Razorpay Test dashboard record was intentionally retained.

## Regression and builds

| Check | Result |
|---|---|
| Sprint 4B payment regression | PASS — 30/30 |
| Payment controller/security checks | PASS — included in Sprint 4B plus live invalid-request checks |
| Server typecheck | PASS |
| Web typecheck | PASS |
| Server build | PASS |
| Web build | PASS; existing lint warnings only |

## Remaining deployment prerequisites

1. In Sprint 7B, deploy backend and frontend with Test Mode variables in their correct scopes.
2. After the backend has its final HTTPS URL, configure the Test Mode webhook and verify signed delivery for the three handled events.
