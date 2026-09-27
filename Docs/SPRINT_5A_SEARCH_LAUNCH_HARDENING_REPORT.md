# Sprint 5A — Storefront Search + Launch Hardening Report

**Verification date:** September 21, 2026
**Scope:** Storefront search, reachable stubs, lint/CI, live inventory reporting, and reservation-expiry scheduler readiness.
**Payment constraint:** No Razorpay or payment implementation was modified.

## Outcome

Storefront search now has one stable `search` URL contract from the desktop and mobile header through the catalog API. The live focused API suite passed 22/22, desktop and mobile browser checks passed, disposable fixtures were removed, both typechecks and production builds passed, and lint runs non-interactively with no errors. Three deployment blockers remain: four sellable products have no inventory row, the new database cron migration has not yet been applied and observed in production, and the compiled server cannot currently start directly with `node dist/index.js` because workspace packages expose TypeScript source rather than production JavaScript.

## Phase 0 — Search Architecture

1. **Rendered input:** `SearchBar` is mounted in both desktop and mobile header layouts. The catalog page has a second search form for refining an active catalog query.
2. **Submit/change behavior:** Inputs keep a local draft only until explicit form submission. Submit trims leading/trailing whitespace, collapses repeated spaces, clears pagination, and navigates through Next.js routing. Typing no longer sends hidden product requests.
3. **URL contract:** `/products?search=<query>`. When submitted from the catalog, existing URL parameters are preserved and `page` is reset. The currently exposed category, brand, and sort controls remain composed with search; vendor and price controls are not active in this storefront UI.
4. **Backend interpretation:** `ProductQuerySchema` coerces and validates pagination, limits search to 100 characters, and normalizes whitespace. `ProductRepository` performs case-insensitive partial matching across name, description, SEO title, keywords, source model number, and SKU using the Supabase/PostgREST query builder.
5. **Previous behavior:** The header rendered correctly but submit did nothing, while input changes issued invisible debounced requests. The catalog implementation separately changed the URL on Enter and blur, creating inconsistent and potentially duplicate navigation.
6. **Current behavior:** Both forms submit explicitly to the same URL/API contract, and both inputs resynchronize from the current URL after navigation, back/forward, or refresh.

## Implemented Changes

- Connected the shared header search form to `/products?search=...` for button and Enter submission.
- Removed the invisible debounced header request.
- Preserved active catalog filters while changing or clearing search and reset only pagination.
- Replaced blur/keydown navigation with standard form submission on the catalog page.
- Fixed the storefront API request to send the backend's canonical `active` parameter.
- Added server-side query parsing and a stable 400 response for invalid/overlong input.
- Escaped PostgREST search metacharacters before composing the raw `.or()` filter.
- Redirected `/products/[slug]`, `/checkout/payment`, and `/checkout/confirmation/[orderId]` to active flows.
- Removed the unreachable `/admin/brands` and `/admin/vendors` placeholder pages.
- Added non-interactive ESLint flat configurations for server and web.
- Added a Supabase migration that schedules `expire_inventory_reservations()` every five minutes with `pg_cron`.

## Search Verification

The focused suite created three non-purchasable disposable products, exercised the real HTTP product endpoint against live Supabase, and deleted every fixture in a `finally`-equivalent cleanup path.

| Check | Result |
|---|---|
| Exact product name and expected SKU | PASS |
| Partial product name | PASS |
| Lowercase query against uppercase name | PASS |
| Case-insensitive SKU | PASS |
| Product keyword/meta keyword | PASS |
| Nonexistent query | PASS |
| Blank and whitespace-only query | PASS |
| Reserved characters and malicious-looking PostgREST input | PASS |
| Quoted input | PASS |
| Leading/trailing/repeated-space normalization | PASS |
| Search + category + brand | PASS |
| Search + sorting | PASS |
| Search + pagination | PASS |
| Overlong input rejected with 400 | PASS |
| Fixture cleanup (`S5A-%` count = 0) | PASS |

**Focused API total:** 22 passed, 0 failed.

Browser verification confirmed:

- desktop header Enter submission and catalog icon submission;
- live exact result rendering;
- refresh, back, and forward URL persistence;
- header and catalog inputs reflecting the URL after navigation;
- search + brand composition and clearing search without clearing brand;
- product-detail navigation through the active `/product/[id]` route;
- mobile search at 390×844, including query normalization, navigation, synchronized inputs, and live result rendering;
- explicit loading, friendly connection-error, and no-results states without raw backend details.

## Route Classification

| Route | Classification | Verified outcome |
|---|---|---|
| `/products/[slug]` | REACHABLE compatibility route | 307 redirect to `/product/[slug]` |
| `/checkout/payment` | REACHABLE compatibility route | 307 redirect to `/checkout` |
| `/checkout/confirmation/[orderId]` | REACHABLE compatibility route | 307 redirect to `/order-success?orderId=...` |
| `/admin/brands` | UNREACHABLE / DEAD | Placeholder removed; production response 404 |
| `/admin/vendors` | UNREACHABLE / DEAD | Placeholder removed; production response 404 |

## Lint, Typecheck, and Builds

| Verification | Result |
|---|---|
| Server lint | PASS — 0 errors, 35 legacy warnings |
| Web lint | PASS — 0 errors, 11 legacy warnings |
| Server typecheck | PASS |
| Web typecheck | PASS |
| Server TypeScript build | PASS |
| Web production build | PASS |

The 46 warnings are existing `any`, unused-variable, and unused-expression debt. They are visible and non-blocking; Sprint 5A did not expand into a broad style/type rewrite.

## Live Inventory Completeness

This was a read-only live check. No product, stock quantity, or customer order was changed.

- Sellable products: **6**
- Sellable products with inventory rows: **2**
- Sellable products missing inventory rows: **4**

Products requiring an administrator to enter real stock or deactivate the listing:

| SKU | Product |
|---|---|
| `GTH-BOS-GBH228` | Bosch GBH 2-28 DV Professional Rotary Hammer Drill 850W |
| `GTH-MAK-GA5030` | Makita GA5030R 125mm Angle Grinder 720W with Soft Start |
| `GTH-FLU-179` | Fluke 179 True-RMS Industrial Digital Multimeter with Temperature |
| `GTH-TAP-S14H` | Taparia 1/2 Inch Drive Socket Set (26 Pieces Forged Steel) |

No quantities were inferred or invented.

## Reservation-Expiry Scheduler

The code-ready migration is `supabase/migrations/20260920144322_schedule_reservation_expiry.sql`. It enables `pg_cron` and schedules:

```sql
select public.expire_inventory_reservations();
```

on `*/5 * * * *` under the unique job name `expire-inventory-reservations-every-5-minutes`. It invokes the existing database function directly and does not expose an HTTP maintenance endpoint.

The migration was intentionally not claimed as live because this workspace has API credentials but no authorized database migration connection. Deployment must apply the migration through the normal Supabase migration pipeline, then verify:

```sql
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'expire-inventory-reservations-every-5-minutes';

select status, return_message, start_time, end_time
from cron.job_run_details
where jobid = (
  select jobid from cron.job
  where jobname = 'expire-inventory-reservations-every-5-minutes'
)
order by start_time desc
limit 10;
```

## Performance Decision

The live sellable catalog is six products, so the existing parameterized multi-column `ILIKE` search is proportionate. No search service or index was added. Sequential wildcard scans should be revisited only when catalog size or measured query latency justifies PostgreSQL full-text or trigram indexing.

## Remaining Launch Blockers

1. Enter real stock for the four sellable products missing inventory rows, or deactivate them.
2. Apply the scheduler migration and observe successful `cron.job_run_details` entries in the live project.
3. Fix production server packaging: `tsc` succeeds, but `node dist/index.js` resolves workspace packages whose `main` fields still point to TypeScript source and fails on extensionless source imports. Deployment must not assume the current `start` script is runnable until workspace packages are built/exported or the server is bundled.

## Ponytail Review

Lean already. Ship. The changes use standard forms, URL parameters, schema validation, existing Supabase queries, redirects, and native database cron; no speculative search service, fuzzy-search layer, or maintenance endpoint was introduced.
