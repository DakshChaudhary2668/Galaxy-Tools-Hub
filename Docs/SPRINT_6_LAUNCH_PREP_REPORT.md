# Sprint 6 — Production launch preparation

**Checked:** September 22, 2026. No production deployment, payment mutation, inventory write, or customer-order change was performed. The live database checks below were read-only.

## Decision

The repository's MVP build, compiled API, core public catalog routes, and payment regression remain healthy. Deployment is **not authorized yet**: obtain the client's production Razorpay credentials and final domains, enter verified stock or deactivate non-selling listings, and resolve the two test-looking active listings. Then Sprint 7 can deploy and perform real-environment QA. Coupons and variants remain intentionally deferred; their routes are not mounted. The reservation-expiry migration is present and unchanged. No payment business logic was edited in Sprint 6.

## Live inventory launch gate — OPEN

Read-only Supabase query of all `is_active=true AND is_purchasable=true` products and **all** inventory rows: six sellable products, two inventory rows, four missing. All inventory rows had `quantity >= 0`, `reserved_quantity >= 0`, and `reserved_quantity <= quantity`; there were no orphan inventory rows. This confirms row integrity, **not** physical stock accuracy.

| Product ID | SKU | Product | Active / purchasable | Inventory row | Quantity | Reserved | Action required |
|---|---|---|---|---|---:|---:|---|
| `55555555-5555-4555-a555-555555555551` | `GTH-BOS-GBH228` | Bosch GBH 2-28 DV Professional Rotary Hammer Drill 850W | yes / yes | no | — | — | ENTER VERIFIED STOCK |
| `55555555-5555-4555-a555-555555555553` | `GTH-FLU-179` | Fluke 179 True-RMS Industrial Digital Multimeter with Temperature | yes / yes | no | — | — | ENTER VERIFIED STOCK |
| `55555555-5555-4555-a555-555555555552` | `GTH-MAK-GA5030` | Makita GA5030R 125mm Angle Grinder 720W with Soft Start | yes / yes | no | — | — | ENTER VERIFIED STOCK |
| `55555555-5555-4555-a555-555555555554` | `GTH-TAP-S14H` | Taparia 1/2 Inch Drive Socket Set (26 Pieces Forged Steel) | yes / yes | no | — | — | ENTER VERIFIED STOCK |
| `77777777-7777-4777-a777-777777777777` | `QA-2026-TEST` | New Product | yes / yes | yes | 10 | 0 | DEACTIVATE IF NOT SELLING |
| `3a5dbc3e-8b80-4180-b2cc-8ef8338b883e` | `TEST-IMG-1789587423108` | New Product | yes / yes | yes | 20 | 0 | DEACTIVATE IF NOT SELLING |

The final two SKUs appear test-related; `TEST-IMG-...` matches the Sprint 3 disposable test's SKU pattern. Their ownership/intent was not proven, so neither was deleted or deactivated. For the four missing rows, deactivation is also an option if not selling. **No row is marked READY on database quantity alone.** The client/admin must verify actual stock and whether these two listings belong in the live catalog. No quantity was invented.

## Canonical production environment contract

These are the current app's production variables, not values to commit. Hostinger must store server secrets only in the backend app. The example `.env` files contain local development values, not production defaults. The server's unused `SUPABASE_ANON_KEY` startup requirement was removed; the optional Sprint 4C live-test harness can still receive it separately.

| App | Variable | Production contract | Exposure |
|---|---|---|---|
| Both | `NODE_ENV` | `production` | Runtime/build setting |
| Backend | `PORT` | Hostinger-required listening port; their current build troubleshooting guidance says `3000` | Server runtime |
| Backend | `CORS_ORIGIN` | `https://<store-domain>`; exact HTTPS origin, no path/trailing slash | Server runtime |
| Backend | `SUPABASE_URL` | Project URL | Server runtime |
| Backend | `SUPABASE_SERVICE_ROLE_KEY` | Real service-role key | **Server secret** |
| Backend | `RAZORPAY_KEY_ID` | Client's live key ID | Server runtime |
| Backend | `RAZORPAY_KEY_SECRET` | Client's live key secret | **Server secret** |
| Backend | `RAZORPAY_WEBHOOK_SECRET` | Secret configured on Razorpay webhook | **Server secret** |
| Frontend | `NEXT_PUBLIC_API_URL` | `https://api.<store-domain>/api/v1` | Public, **baked in at build time** |
| Frontend | `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project URL | Public |
| Frontend | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project publishable/anon key | Public |
| Frontend | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Matching live public key ID; checkout can also use API-returned key ID | Public |

`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` must never use a `NEXT_PUBLIC_` prefix or be supplied to the frontend deployment. The web API client fails when `NEXT_PUBLIC_API_URL` is absent, rather than falling back to localhost. The production server schema rejects localhost/non-HTTPS CORS origins and requires all three Razorpay values. Rebuild the web app if the public API URL changes. A tracked-file pattern scan found no live-looking payment IDs or secret values; test code contains a clearly named placeholder key ID. This scan is not a substitute for secret scanning of deployment settings and Git history.

## Hostinger: two separate Node.js web apps

Hostinger's [current deployment guide](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) supports Next.js, Express, Node 22, GitHub/ZIP deployments and editable build settings. Its [plan limits](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/) list five Node.js sites for Unlimited, sufficient for two apps. Its [build troubleshooting guide](https://www.hostinger.com/support/fix-failed-to-build-application-error-hostinger-node-js/) calls for a correct project root, `package.json`, pnpm support, and port 3000. **The Hostinger account/dashboard and its custom-command behavior were not accessed in this sprint**; confirm each field and port there before deployment.

Use the **monorepo repository root** as the source/build root for *each* separately configured Hostinger app, not `apps/web` or `apps/server` alone. Both apps need `pnpm-workspace.yaml`, the root lockfile, and `packages/*`. Set Node.js **22 LTS** and pnpm **9.10.0** (root `packageManager`) on each. Commands below all assume the repo root as working directory; if Hostinger selects another directory, first change explicitly to the repository root. Do not assume it changes directories for you.

| Hostinger app | Install | Build | Start |
|---|---|---|---|
| Frontend / Next.js (`apps/web`) | `pnpm install --frozen-lockfile` | `pnpm exec turbo run build --filter=galaxy-web...` | `pnpm --filter galaxy-web start` (`next start`) |
| Backend / Express (`apps/server`) | `pnpm install --frozen-lockfile` | `pnpm exec turbo run build --filter=galaxy-server...` | `node apps/server/dist/index.js` |

The `...` dependency scope builds workspace packages before the target. The backend must start compiled JavaScript; no `tsx`, `ts-node`, or development watcher. For an “Other” framework field, the backend entry is `apps/server/dist/index.js`, not an invented root `index.js`; use the Express type if Hostinger detects it. If Hostinger cannot set distinct root-aware build/start commands for two apps, **stop and resolve that platform capability in Sprint 7** rather than deploy an incomplete app. Add frontend public variables **before** its build. Configure backend environment before starting it. Use the Hostinger-provided port if it differs from 3000, and confirm both apps actually listen/respond behind their assigned domains.

## Domain and Razorpay handoff

Do not replace placeholders until the client supplies the canonical domain. Expected pairing: storefront `https://<store-domain>`, API `https://api.<store-domain>`, backend `CORS_ORIGIN=https://<store-domain>`, frontend build-time `NEXT_PUBLIC_API_URL=https://api.<store-domain>/api/v1`. Configure `www` → canonical storefront redirect **if** `www` is used; SSL must cover the chosen storefront and API hostnames.

The exact public webhook route is `POST /api/v1/payments/webhook/razorpay`, so dashboard URL is `https://api.<store-domain>/api/v1/payments/webhook/razorpay`. The handler verifies the signature against raw request bytes. It handles `payment.captured` and `order.paid` as captured-payment completion, and `payment.failed` as failure; register **only these three events**. Obtain from the client: live Razorpay Key ID, live Key Secret, and Webhook Secret (or permission to create/configure the webhook and retrieve its secret). Put the Key ID in backend `RAZORPAY_KEY_ID` and public web `NEXT_PUBLIC_RAZORPAY_KEY_ID`; put Key Secret and Webhook Secret in the backend-only variables above. Do not send secret values in chat, source control, screenshots, or browser configuration. Production credentials were unavailable and no real payment was attempted.

## Cron — scheduler gate closed on supplied live verification

The repository migration `supabase/migrations/20260920144322_schedule_reservation_expiry.sql` defines one job named `expire-inventory-reservations-every-5-minutes`, schedule `*/5 * * * *`, command `select public.expire_inventory_reservations();`. The client reports the job is **live with multiple successful runs**. This sprint had read-only Data API access but no direct SQL access to `cron.job` / `cron.job_run_details`, so the report does **not** claim an independent SQL recheck. The scheduler gate is closed on the supplied live verification plus exact repository match; Sprint 7 should retain a dashboard/SQL capture in the launch record. **Do not rerun the scheduling migration solely to verify it.** The [Supabase Cron documentation](https://supabase.com/docs/guides/cron) identifies these tables for monitoring.

```sql
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'expire-inventory-reservations-every-5-minutes';
-- Require exactly one row: active=true, five-minute schedule, expected command.

select j.jobname, d.status, d.return_message, d.start_time, d.end_time
from cron.job_run_details d
join cron.job j on j.jobid = d.jobid
where j.jobname = 'expire-inventory-reservations-every-5-minutes'
order by d.start_time desc
limit 10;
-- Require recent successful completed runs.
```

## Production data hygiene

Read-only checks found zero `S5A-%` or `S4C-%` product SKUs, zero `S4C-%` order numbers, and zero Sprint 4C disposable auth users (seven auth users inspected by pattern, without printing identities). The two active `QA-%` / `TEST-%` SKUs above **are unresolved catalog hygiene**, not proven legitimate merchandise; one matches the Sprint 3 fixture pattern. No deletion was made. Payment fixture absence was inferred only from zero matching fixture orders; no unrestricted payment/customer record dump was performed. No hardcoded real payment ID or committed production secret was found by the tracked-file pattern scan. Final deployment settings and Git history still need the normal human secret review.

## Routes, checks, and regressions

Active customer routes exist for `/`, `/products` (search/filter), `/product/[id]`, `/cart`, `/checkout`, `/order-success`, `/sign-in`, and `/sign-up`. Compatibility `/checkout/payment`, `/checkout/confirmation/[orderId]`, and `/products/[slug]` redirect to live routes. Active admin navigation contains login, dashboard, products, categories, inventory, orders, customers, analytics, settings; no coupon, brand-admin, vendor-admin, or variant link remains. Route/source review found no active customer coupon or variant control, no localhost production fallback, and no broken MVP link needing a code change. The homepage's unlinked blog cards still point to `#`; that editorial teaser is not part of purchase/checkout and was not expanded into a new feature.

| Check | Sprint 6 result |
|---|---|
| Server lint / web lint | Pass; 0 errors, 34 + 11 existing warnings |
| Workspace package builds | Pass: config, constants, types, utils, ui |
| Server / web TypeScript typecheck | Pass |
| Server build | Pass; `dist/index.js` generated |
| Web production build | Pass, Next.js 15.5.23; no production URL was baked into a deployed artifact |
| Sprint 4B payment finalization regression | Pass, 30/30; no live mutation |
| Sprint 5B packaging regression | Pass, 11/11 |
| Sprint 5A search light regression | Read-only API smoke passed; fixture-creating suite deliberately not rerun |
| Compiled server | `node dist/index.js` started; `/health` and `/api/v1/health` each 200 |
| Public catalog smoke | Products 200 (6), `search=Bosch` 200 (1), `category=power-tools` 200 (2), `brand=bosch` 200 (3), product detail 200 |

These local checks used installed Node 25 because Node 22 was not available on this workstation. They do not prove Hostinger's clean Node 22 build or domain configuration. The root pnpm/Turborepo runner has previously stalled on this Node 25 host; direct workspace binaries supplied the local build evidence. Sprint 7 must verify the exact Hostinger commands on Node 22.

One complete web production build exited successfully. An optional repeat after the server-only environment-schema cleanup compiled but lingered during Next's lint/type stage on this Node 25 host; it was stopped rather than counted as a second passing build. The web typecheck and lint each passed separately after that cleanup.

## Ponytail review

Lean already. Ship. The only Sprint 6 code/config change removes an unused server-side anon-key startup requirement; no deploy wrapper, extra table, route, or payment abstraction was added.
