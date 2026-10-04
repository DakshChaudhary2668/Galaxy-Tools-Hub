# Sprint 7C — Pre-production staging audit

**Audit date:** October 3, 2026

**Baseline:** `fdab7bd853fbfa19f81328f6b52d62bebfa05e35` (`origin/main`)

**Frontend:** `https://darkgrey-pheasant-166088.hostingersite.com`

**Backend:** `https://seashell-dove-918536.hostingersite.com`

**Scope:** public temporary Hostinger staging; P0/P1 launch-critical defects only

## Verdict

The deployed storefront, admin commerce workflows, Razorpay Test integration, database invariants, security controls, and production builds passed. The reported Admin Orders dropdown defect did not reproduce: a valid transition persisted through the public API and database, while an invalid transition was rejected by the existing state machine.

No implementation change or staging redeployment was justified. One P1 operational blocker remains: a new customer sign-up attempt was rejected by Supabase with `email rate limit exceeded`. Confirmed disposable customer sign-in, profile provisioning, and logout passed, but public sign-up must be reverified after configuring production SMTP/rate limits. Sprint 7C is therefore not fully green yet.

## Order status dropdown investigation

The test used the clearly test-labelled order `ORD-1788392252686-539` (`29db3267-85ad-440a-821e-003192177833`). No customer order was modified.

| Check | Result |
|---|---|
| Starting database state | `PROCESSING`; `payment_status=PENDING` |
| Frontend request | `PATCH /api/v1/orders/29db3267-85ad-440a-821e-003192177833/status` |
| Authentication | Valid Supabase Bearer session for active `MANAGER` |
| Payload | `{"status":"PACKED"}` |
| Backend response | HTTP 200 |
| Persisted state | `PACKED`; `payment_status` remained `PENDING` |
| Database timestamp | `updated_at=2026-10-03T09:52:43.9+00:00` |
| UI behavior | Success toast, list refetch, and refreshed row all showed `PACKED` |
| Invalid transition | `PACKED -> CONFIRMED` returned HTTP 400 with `Invalid status transition from PACKED to CONFIRMED` |
| Duplicate/stale mutation | Not observed; one request produced one persisted transition and the UI used the refetched value |

Hostinger's Runtime Logs view showed no generated log entries during this investigation. The correlated browser request/response, API request ID, database before/after state, and UI refetch were available and agreed. This log-visibility gap is recorded below as P2 operational work.

## Admin verification

A disposable public-API admin fixture suite passed **21/21** and removed its product, inventory, image metadata, Storage object, category, and OWNER user afterward.

- RBAC: disposable OWNER passed; existing MANAGER passed; missing authentication returned 401; authenticated non-admin and inactive admin returned 403.
- Products: create, edit, price/SKU/category fields, activate/deactivate, and purchasable toggle passed.
- Images: signed upload, Storage write, metadata creation, public rendering, replacement, removal, and object cleanup passed.
- Inventory: initial quantity/reorder level, edit, and adjustment persisted; negative quantity was rejected; final invariants remained valid.
- Orders: list/detail, payment and shipping/customer data, valid transition, invalid transition, persistence, and UI refresh passed.
- Categories: list, create, storefront visibility, edit, delete, and cleanup passed.
- Coupons and variants were not exercised and remain deliberately disabled.

## Customer verification

- Homepage, catalog, active product images, and PDP passed on the public frontend.
- Search for `Fluke`, category filtering, brand filtering by UUID and slug, low-to-high sorting, and two-page API pagination passed.
- Cart add, quantity update, reload persistence, checkout navigation, and removal passed.
- Mobile-width navigation, mobile search, product cards, cart, and checkout rendered and remained operable at 390×844.
- Checkout displayed validated contact/address fields, Razorpay Test options, server-bound product identity/quantity flow, and the correct item/GST/shipping summary. No extra gateway transaction was created because Sprint 7A.1 already supplied a successful browser auto-capture transaction and no payment code changed.
- The public order-success route rendered the existing paid test order with `PAID (Razorpay)` and `PACKED` status.
- A confirmed disposable customer passed password sign-in, active profile provisioning, sign-out, and cleanup.
- A fresh public-style Supabase sign-up probe was blocked by the project email throttle: `email rate limit exceeded`. Invalid-address probes created no user. This must be cleared and retested before launch.

## Razorpay Test and security regression

| Suite/check | Result |
|---|---|
| Sprint 4A payment trust/binding | PASS — 16/16 |
| Sprint 4B payment finalization | PASS — 30/30 |
| Sprint 4C live integrity | PASS — 87/87 |
| Sprint 4C webhook/privacy HTTP | PASS — 16/16 |
| Sprint 5A search regression | PASS — 22/22 on isolated retry; the first parallel run hit a transient Supabase JWT clock error |
| Sprint 5B packaging regression | PASS — 11/11 |
| Public unsigned webhook | PASS — HTTP 400, invalid signature |
| Callback/webhook convergence | PASS — callback and handled webhook events share the restricted finalizer |
| Replay/inventory mutation | PASS — idempotent replay and exactly-once inventory mutation in the 87-check live suite |
| Public order privacy | PASS — minimal projection only; existing HTTP privacy suite passed |
| Admin mutation protection | PASS — 401/403 matrix above |
| Production CORS | PASS — exact storefront origin with credentials; no wildcard |
| Frontend secret scan | PASS — neither locally available server secret value occurred in web source or `.next`; all three server-only variable names are absent from `NEXT_PUBLIC_*` configuration |

The three handled webhook events remain `payment.captured`, `payment.failed`, and `order.paid`. Test Mode only was used. No manual capture, live key, payment architecture change, or new payment transaction was introduced in Sprint 7C.

## Database and scheduler

Final read-only state after all disposable-fixture cleanup:

| Invariant | Result |
|---|---|
| Inventory | 7 rows; 0 negative/over-reserved rows; 0 orphans |
| Active purchasable products without inventory | 0 |
| Product image metadata | 11 rows; 0 orphans |
| Payments | 0 duplicate gateway references; 0 duplicate transaction IDs |
| Reservations | 0 expired `ACTIVE` rows |
| Sprint audit fixtures | 0 Sprint 4C/5A/7C products or profiles |
| Cron definition | Exactly one active `expire-inventory-reservations-every-5-minutes`, schedule `*/5 * * * *`, command `select public.expire_inventory_reservations();` |
| Cron executions | Five latest inspected runs succeeded at 17:00, 17:05, 17:10, 17:15, and 17:20 UTC on October 3 |

The legacy inactive `QA-2026-TEST` row still exists despite an earlier report stating it was deleted. It is not active, is not storefront-visible, has no orphan metadata, and is not launch-critical. This documentation/data-hygiene discrepancy is recorded as P2 and was not mutated in this sprint.

## Build and static verification

- Server typecheck: PASS.
- Web typecheck: PASS.
- Server production build: PASS.
- Web production build: PASS. Next.js 15.5.23 produced all routes; 11 existing warnings remained non-blocking.
- Server lint: PASS with 0 errors and 34 existing warnings.
- Web lint: PASS with 0 errors and 11 existing warnings.

The sandboxed TypeScript runner initially could not create its local IPC socket; the same command passed normally when run with the required local worker permission. This is a workstation execution constraint, not an application defect.

## Findings

### GTH-S7C-001 — Reported Admin Orders dropdown persistence failure

- **Severity:** P1 report, closed as not reproduced
- **Area:** Admin orders
- **Reproduction:** Changed the public staging test order from `PROCESSING` to `PACKED`; separately attempted invalid `PACKED` to `CONFIRMED`.
- **Root cause:** No current defect was found on baseline `fdab7bd`. The frontend sent the correct authenticated PATCH, the backend state machine accepted/rejected the correct transitions, the database persisted one valid update, and the UI refetched it.
- **Fix:** None. A speculative patch and unnecessary redeploy were intentionally avoided.
- **Verification:** HTTP 200 and persisted `PACKED` for the valid transition; HTTP 400 and unchanged state for the invalid transition; payment status unchanged.
- **Status:** CLOSED / VERIFIED WORKING.

### GTH-S7C-002 — Customer sign-up blocked by Supabase email rate limit

- **Severity:** P1
- **Area:** Customer authentication / Supabase configuration
- **Reproduction:** Submitted one new disposable customer sign-up through the same Supabase Auth operation used by the storefront; Supabase returned `email rate limit exceeded`.
- **Root cause:** The live project's email delivery throttle/SMTP configuration, outside the application repository. Password sign-in, profile provisioning, session handling, and logout work for a confirmed disposable customer.
- **Fix:** Configure and verify production SMTP/rate limits (or wait for the provider window), then repeat a public disposable sign-up/sign-in/logout test.
- **Verification:** Current sign-up remains blocked; the fallback confirmed-user auth lifecycle passed and cleaned up completely.
- **Status:** OPEN — launch-critical operational gate.

### GTH-S7C-003 — Hostinger runtime logs unavailable during order mutation

- **Severity:** P2
- **Area:** Deployment observability
- **Reproduction:** Opened the backend Runtime Logs view after the public order-status request; Hostinger reported that logs had not been generated.
- **Root cause:** Hostinger log capture/visibility is not currently providing request entries.
- **Fix:** Enable/confirm runtime logging and retention before production cutover.
- **Verification:** Browser, API, request-ID, and database evidence covered this audit; runtime log evidence remains unavailable.
- **Status:** OPEN — post-P1 operational follow-up.

### GTH-S7C-004 — Inactive QA product conflicts with Sprint 6.5 documentation

- **Severity:** P2
- **Area:** Catalog hygiene/documentation
- **Reproduction:** Live read-only query found `QA-2026-TEST` inactive while the launch checklist said it was deleted.
- **Root cause:** Earlier cleanup documentation drifted from the live retained row.
- **Fix:** Reconcile/deactivate/delete only after rechecking historical dependencies; no Sprint 7C mutation was authorized because the row is already non-sellable.
- **Verification:** The row is inactive, not publicly sellable, and creates no inventory/image orphan.
- **Status:** OPEN — non-launch-critical hygiene.

## Scope and cleanup

No application, database schema, payment logic, coupon, variant, shared utility, middleware, dependency, or dead-code change was made. No redeployment was performed because no code changed. All Sprint 7C disposable database/Auth/Storage fixtures were removed. The pre-existing `.npmrc` working-tree edit was preserved untouched.
