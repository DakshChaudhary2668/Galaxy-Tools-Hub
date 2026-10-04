# Production launch checklist — Galaxy Tools Hub

Status as of **October 4, 2026**. `- [x]` means supported by Sprint 4C–7C.5 evidence, **not** that final production deployment or QA is complete. Follow the [Sprint 6 report](SPRINT_6_LAUNCH_PREP_REPORT.md), [Sprint 7A report](SPRINT_7A_RAZORPAY_TEST_MODE_REPORT.md), [Sprint 7C audit](SPRINT_7C_PREPRODUCTION_AUDIT.md), and [Sprint 7C.5 report](SPRINT_7C5_MERCHANDISING_COUPONS.md) for evidence. Do not start final production deployment before the remaining gates are resolved.

## CLIENT INPUT REQUIRED

- [ ] Receive the canonical storefront domain and decide whether `www` redirects to it.
- [ ] Receive live Razorpay Key ID and Key Secret securely; receive Webhook Secret or permission to create the webhook and retrieve its secret.
- [x] Four products without verified stock are inactive/non-sellable; verified physical stock may be entered later through the Admin Portal before activation.
- [ ] Reconcile the live inactive `QA-2026-TEST` row with the Sprint 6.5 report, which said it was deleted. Keep it non-sellable until dependencies are rechecked. `TEST-IMG-1789587423108` remains deactivated.
- [x] Temporary staging proves frontend and backend Node.js Web Apps are available on the upgraded Hostinger plan.

## DATABASE

- [x] October 3 read-only audit: three active/purchasable products, all backed by inventory; all seven inventory rows satisfy `0 <= reserved_quantity <= quantity`.
- [x] `GTH-BOS-GBH228`, `GTH-MAK-GA5030`, `GTH-FLU-179`, and `GTH-TAP-S14H` remain non-sellable until verified stock is entered through the Admin Portal.
- [ ] Reconcile the two test-looking listings: both are inactive in the October 3 live audit, but `QA-2026-TEST` still exists despite the earlier deletion record. No launch-visible listing remains.
- [ ] Recheck all active/purchasable rows and physical quantity accuracy immediately before go-live.
- [x] Applied and verified `20261004090000_sprint7c5_merchandising_coupons.sql`; live disposable Sprint 7C.5 suite passed 14/14 with full cleanup.
- [x] Sprint 7C.5 read-only preflight found one primary image per product and no normalized duplicate brand names.

## HOSTINGER FRONTEND

- [x] Repository Next.js production build passed in Sprint 6; `next start` was proven in Sprint 5B. Neither is a Hostinger deployment.
- [x] Temporary Hostinger Next.js staging app is deployed from the monorepo and publicly reachable.
- [ ] Install `pnpm install --frozen-lockfile`; build `pnpm exec turbo run build --filter=galaxy-web...`; start `pnpm --filter galaxy-web start` from repository root.
- [ ] Set `NEXT_PUBLIC_API_URL=https://api.<store-domain>/api/v1`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` **before building**; rebuild after any public URL/key change.
- [x] Temporary deployed Next.js process and storefront HTTPS URL work on Hostinger; final canonical-domain deployment remains pending.

## HOSTINGER BACKEND

- [x] Workspace-package and server builds pass locally; compiled `node dist/index.js` returned 200 on both health endpoints.
- [x] Temporary Hostinger Express staging app is deployed from the monorepo and publicly reachable.
- [ ] Install `pnpm install --frozen-lockfile`; build `pnpm exec turbo run build --filter=galaxy-server...`; start `node apps/server/dist/index.js` from repository root.
- [ ] Set `NODE_ENV=production`, Hostinger-required `PORT`, `CORS_ORIGIN=https://<store-domain>`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and all three server Razorpay variables securely.
- [ ] Both temporary deployed HTTPS health/API endpoints pass, but Hostinger Runtime Logs showed no generated entries and must be made observable before final cutover.

## SUPABASE

- [x] Reservation-expiry migration exists with the named five-minute job; client reports multiple successful live runs. Scheduler gate closed on client-provided verification and repository match.
- [x] Sprint 7C SQL/dashboard check found exactly one active `expire-inventory-reservations-every-5-minutes` job and five consecutive successful recent runs. No reschedule was performed.
- [ ] Confirm production Auth redirect URLs and allowed origins for the final storefront domain.
- [ ] Confirm production Storage access and product image rendering after deployment.
- [x] Verified the restricted primary-image RPC, homepage column, empty coupons table, admin-only access path, and schema-cache visibility.

## RAZORPAY

- [x] Source confirms public signed webhook route and three handled event types: `payment.captured`, `payment.failed`, `order.paid`.
- [x] Sprint 4C live payment-integrity verification and Sprint 6 local Sprint 4B regression passed; no Sprint 6 payment mutation.
- [x] Sprint 7A: Razorpay Test Key ID/Secret configured only in git-ignored local env files; matching public Test Key ID configured for the web app; post-build scan found no secret exposure.
- [x] Sprint 7A: real Test Mode order creation, server-authoritative INR amount, gateway mapping, callback signature, captured-payment recovery, atomic finalization, replay, hostile callback rejection, and fixture cleanup passed.
- [x] Sprint 7A.1: Test Mode Automatic Capture confirmed ON with a 12-minute timeout; one new disposable browser netbanking payment was `captured` on the first post-payment API observation without manual capture.
- [x] Sprint 7A.1: no premature PAID state or inventory consumption; signed finalization mutated payment/order/reservation/inventory exactly once; signed replay returned `replay: true` with no row, timestamp, or quantity change; all disposable rows were removed.
- [x] Temporary staging uses Razorpay Test Mode; frontend bundles contain no server secret value. Sprint 7C payment regressions and the prior real browser payment remain green.
- [x] Temporary staging exposes the signed webhook route; invalid/unsigned public delivery returns 400, and callback/webhook convergence passed the live regression. Final-domain webhook configuration remains pending.
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
- [x] Temporary public HTTPS API/storefront routes passed and production CORS names the exact temporary storefront origin with no wildcard.
- [x] Temporary staging homepage, catalog, product detail, checkout, admin login, images, search/filter/sort, pagination, and mobile layout passed. Repeat against final canonical URLs.
- [x] Source/build verification confirms legacy category navigation no longer points to the old Galaxy storefront.
- [ ] Verify category filtering, custom-brand reuse, six-image CRUD/primary selection, and cleanup on public staging after the migration/redeploy.
- [ ] Confirm coupon admin is OWNER/MANAGER-only and the production coupons table remains empty; variants remain unavailable.

## CUSTOMER QA

- [x] Active MVP route/source review found homepage, catalog/search, product detail, cart, checkout, order success, sign-in, and sign-up routes; compatibility redirects remain intact.
- [ ] Sprint 7C passed confirmed-customer sign-in/logout, cart persistence, search/filter, checkout UI, existing paid order-success visibility, and mobile navigation. Fresh sign-up is blocked by Supabase `email rate limit exceeded`; configure SMTP/rate limits and retest.
- [x] Public order-status privacy and absence of server secret values in web source/build output passed.

## ADMIN QA

- [x] Navigation source has dashboard, products, categories, inventory, coupons, orders, customers, analytics, and settings; variant modules remain unlinked.
- [x] Sprint 7C.5 code/build checks cover normalized custom brands, independent homepage/catalog/purchase controls, additive signed multi-image management, and admin-only coupon CRUD.
- [x] Temporary staging passed OWNER/MANAGER/unauthorized/non-admin/inactive RBAC, disposable product/image/inventory/category operations, and valid/invalid order transitions. The reported order-dropdown issue did not reproduce.
- [ ] Confirm admin stock edits do not exceed verified physical inventory and do not touch customer orders during smoke QA.

## POST-LAUNCH MONITORING

- [ ] Monitor Hostinger frontend/backend logs, health checks, and API error rates after go-live.
- [ ] Monitor Razorpay webhook delivery/retries, payment/order convergence, and failed captures.
- [ ] Monitor Supabase cron recent successes, expired reservations, and `reserved_quantity` invariants.
- [ ] Watch low stock, image failures, auth errors, and customer support reports; keep P2/P3 work outside this launch-prep sprint.
