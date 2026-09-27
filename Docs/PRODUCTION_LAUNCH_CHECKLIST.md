# Production launch checklist — Galaxy Tools Hub

Status as of **September 27, 2026**. `- [x]` means supported by Sprint 4C–7A.1 evidence, **not** that production deployment or QA is complete. Follow the [Sprint 6 report](SPRINT_6_LAUNCH_PREP_REPORT.md) and [Sprint 7A report](SPRINT_7A_RAZORPAY_TEST_MODE_REPORT.md) for values, commands, and evidence. Do not deploy before the client/data/payment gates are resolved.

## CLIENT INPUT REQUIRED

- [ ] Receive the canonical storefront domain and decide whether `www` redirects to it.
- [ ] Receive live Razorpay Key ID and Key Secret securely; receive Webhook Secret or permission to create the webhook and retrieve its secret.
- [ ] Obtain verified physical stock values or an explicit decision to deactivate each non-selling product.
- [x] Sprint 6.5: QA-2026-TEST confirmed disposable (no order refs) — deleted. TEST-IMG-1789587423108 confirmed Sprint-3 test artifact — deactivated (order FK preserved).
- [ ] Confirm Hostinger account access and two Node.js Web App slots on the Unlimited plan.

## DATABASE

- [x] Read-only inventory audit: six active/purchasable, two stock rows, four missing; existing reserved values satisfy `0 <= reserved_quantity <= quantity`.
- [ ] Enter verified quantities for `GTH-BOS-GBH228`, `GTH-MAK-GA5030`, `GTH-FLU-179`, `GTH-TAP-S14H`, or deactivate listings not for sale.
- [x] Resolve the two active test-looking listings: TEST-IMG-1789587423108 deactivated (FK constraint); QA-2026-TEST deleted. Migration: 20260922083208_sprint65_catalog_cleanup.sql
- [ ] Recheck all active/purchasable rows and physical quantity accuracy immediately before go-live.

## HOSTINGER FRONTEND

- [x] Repository Next.js production build passed in Sprint 6; `next start` was proven in Sprint 5B. Neither is a Hostinger deployment.
- [ ] Create a separate Next.js Node.js Web App from the **monorepo root** on Node 22 / pnpm 9.10.0; verify Hostinger accepts root-aware commands.
- [ ] Install `pnpm install --frozen-lockfile`; build `pnpm exec turbo run build --filter=galaxy-web...`; start `pnpm --filter galaxy-web start` from repository root.
- [ ] Set `NEXT_PUBLIC_API_URL=https://api.<store-domain>/api/v1`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` **before building**; rebuild after any public URL/key change.
- [ ] Confirm deployed Next.js process and storefront HTTPS URL work on Hostinger.

## HOSTINGER BACKEND

- [x] Workspace-package and server builds pass locally; compiled `node dist/index.js` returned 200 on both health endpoints.
- [ ] Create a separate Express Node.js Web App from the **monorepo root** on Node 22 / pnpm 9.10.0; verify Hostinger accepts root-aware commands.
- [ ] Install `pnpm install --frozen-lockfile`; build `pnpm exec turbo run build --filter=galaxy-server...`; start `node apps/server/dist/index.js` from repository root.
- [ ] Set `NODE_ENV=production`, Hostinger-required `PORT`, `CORS_ORIGIN=https://<store-domain>`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and all three server Razorpay variables securely.
- [ ] Confirm Hostinger's assigned port (current guidance says 3000), compiled entry, runtime logs, and both deployed HTTPS health endpoints.

## SUPABASE

- [x] Reservation-expiry migration exists with the named five-minute job; client reports multiple successful live runs. Scheduler gate closed on client-provided verification and repository match.
- [ ] Retain a Sprint 7 SQL/dashboard record of exactly one active `expire-inventory-reservations-every-5-minutes` job and successful recent `cron.job_run_details` (queries in Sprint 6 report). Do **not** reschedule merely to inspect.
- [ ] Confirm production Auth redirect URLs and allowed origins for the final storefront domain.
- [ ] Confirm production Storage access and product image rendering after deployment.

## RAZORPAY

- [x] Source confirms public signed webhook route and three handled event types: `payment.captured`, `payment.failed`, `order.paid`.
- [x] Sprint 4C live payment-integrity verification and Sprint 6 local Sprint 4B regression passed; no Sprint 6 payment mutation.
- [x] Sprint 7A: Razorpay Test Key ID/Secret configured only in git-ignored local env files; matching public Test Key ID configured for the web app; post-build scan found no secret exposure.
- [x] Sprint 7A: real Test Mode order creation, server-authoritative INR amount, gateway mapping, callback signature, captured-payment recovery, atomic finalization, replay, hostile callback rejection, and fixture cleanup passed.
- [x] Sprint 7A.1: Test Mode Automatic Capture confirmed ON with a 12-minute timeout; one new disposable browser netbanking payment was `captured` on the first post-payment API observation without manual capture.
- [x] Sprint 7A.1: no premature PAID state or inventory consumption; signed finalization mutated payment/order/reservation/inventory exactly once; signed replay returned `replay: true` with no row, timestamp, or quantity change; all disposable rows were removed.
- [ ] Sprint 7B: deploy with the Test Mode Key ID/Secret in backend scope and only the matching public Key ID in frontend scope.
- [ ] Sprint 7B: after the backend has its final HTTPS URL, configure Test Mode webhook delivery for the three handled events and verify raw-body signatures plus callback/webhook convergence.
- [ ] Configure live dashboard webhook to `https://api.<store-domain>/api/v1/payments/webhook/razorpay` for only those three events, with matching backend-only `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Put live Key ID in backend and public web variables; put Key Secret **only** in backend. Do not print/commit any secret.
- [ ] Execute approved post-deploy payment/failed-payment/duplicate-webhook QA with real production credentials under a controlled plan.

## DNS / DOMAINS

- [ ] Point canonical main domain to the frontend app and `api` subdomain to the backend app; confirm Hostinger's records for this account.
- [ ] Enable and validate HTTPS certificates for both hostnames.
- [ ] If using `www`, redirect it to the chosen canonical storefront origin.
- [ ] Verify frontend API base URL, CORS exact origin, and webhook URL all use the final domains.

## SMOKE TEST

- [x] Compiled local API: `/health`, `/api/v1/health`, product listing/search/category/brand/detail returned 200.
- [ ] After deployment, verify those same routes via the **public** HTTPS API and verify no browser CORS or mixed-content errors.
- [ ] Verify production storefront homepage, catalog, product detail, checkout, admin login, images, and search against final URLs.
- [ ] Confirm coupon/variant routes remain unavailable and no active navigation points to them.

## CUSTOMER QA

- [x] Active MVP route/source review found homepage, catalog/search, product detail, cart, checkout, order success, sign-in, and sign-up routes; compatibility redirects remain intact.
- [ ] On deployed site, test sign-up/sign-in, cart persistence, search/filter, checkout success/failure, order-success visibility, and mobile navigation with safe disposable transactions only.
- [ ] Check public order-status privacy and absence of secrets in browser responses.

## ADMIN QA

- [x] Navigation source has dashboard, products, categories, inventory, orders, customers, analytics, and settings; removed coupon/brand/vendor/variant modules are not linked.
- [ ] On deployed site, verify admin login/RBAC, product/image operations, inventory, order transitions, customer and settings access using authorized admin accounts.
- [ ] Confirm admin stock edits do not exceed verified physical inventory and do not touch customer orders during smoke QA.

## POST-LAUNCH MONITORING

- [ ] Monitor Hostinger frontend/backend logs, health checks, and API error rates after go-live.
- [ ] Monitor Razorpay webhook delivery/retries, payment/order convergence, and failed captures.
- [ ] Monitor Supabase cron recent successes, expired reservations, and `reserved_quantity` invariants.
- [ ] Watch low stock, image failures, auth errors, and customer support reports; keep P2/P3 work outside this launch-prep sprint.
