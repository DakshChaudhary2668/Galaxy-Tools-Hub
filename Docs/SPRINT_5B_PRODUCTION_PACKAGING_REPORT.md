# Sprint 5B — Production Packaging + Infrastructure Hardening

**Verified:** September 21, 2026. Payment business logic was not changed. No customer order, real stock quantity, or product state was modified.

## Production packaging

`galaxy-server` compiled to CommonJS but its four runtime workspace dependencies (`@galaxy/config`, `@galaxy/constants`, `@galaxy/types`, `@galaxy/utils`) advertised TypeScript files as `main`. Node followed those links into uncompiled source and failed on an extensionless import. All five workspace packages, including web-only `@galaxy/ui`, now build to `dist` CommonJS JavaScript plus declarations and expose only those outputs through `main`, `types`, and `exports`. Turborepo's dependency build order handles the package graph; no production `tsx` or `ts-node` loader was added. The web build also resolves the compiled packages.

The first compiled-runtime proof used `node dist/index.js` and received HTTP 200 from `/health` and `/api/v1/health`. A second production-mode run used disposable payment placeholder values and an HTTPS CORS origin, then verified:

| Request | Result |
|---|---|
| `GET /health` | 200 |
| `GET /api/v1/health` | 200 |
| `GET /api/v1/products?limit=2` | 200, two products |
| `GET /api/v1/products?search=Fluke` | 200, one result |
| `GET /api/v1/products?category=<live category UUID>` | 200, two results |
| `GET /api/v1/products?brand=<live brand UUID>` | 200, three results |
| `GET /api/v1/products/<live product UUID>` | 200 |
| `GET /api/v1/products/<live product UUID>/images` | 200 |

The compiled Next.js build started with `next start`. With the API on the URL baked into this local build, `/`, `/products`, `/admin/products`, and `/checkout` all returned 200; removed `/admin/coupons` returned 404. The initial `/` request returned 500 only while the API was running on port 18000 instead of this local web build's configured port 8000; it returned 200 after the API was moved to 8000. Deployment must set `NEXT_PUBLIC_API_URL` to its actual public API base before building the web artifact.

## Clean build and verification sequence

Use Node.js 22 LTS and the pinned pnpm 9.10.0 for CI. From a clean checkout with environment variables configured:

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run type-check
pnpm run build
cd apps/server && pnpm start
cd apps/web && pnpm start
```

For this host's pnpm/Turborepo runner issue under Node 25, the clean build was verified with direct workspace binaries after clearing only generated `dist` and `.next` outputs: compile `config` and `constants`, then `types` and `ui`, then `utils`, then `apps/server`; run `apps/web/node_modules/.bin/next build`; start with `node apps/server/dist/index.js` and `apps/web/node_modules/.bin/next start`. All direct builds, application and package typechecks, and both lint jobs passed. The root Turborepo runner was attempted but its package-manager child stalled; it was stopped rather than claimed green. Lint had zero errors and 45 pre-existing/non-blocking warnings (34 server, 11 web). The Sprint 5B packaging self-check passed 11/11.

## Reservation expiry cron

`supabase/migrations/20260920144322_schedule_reservation_expiry.sql` uses the [documented Supabase Cron SQL form](https://supabase.com/docs/guides/cron/quickstart): one stable, case-sensitive job name, five-minute schedule, and a direct call to the existing `public.expire_inventory_reservations()` function. Supabase documents that scheduling the same name overwrites the existing job, so re-applying does not create a second named job. There is no public maintenance endpoint.

**Live status: NOT VERIFIED / NOT CLAIMED APPLIED.** This environment has neither a database connection string nor a Supabase access token or callable database SQL tool. Apply this exact existing migration through the normal database deployment path or Supabase SQL Editor:

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'expire-inventory-reservations-every-5-minutes',
  '*/5 * * * *',
  $$select public.expire_inventory_reservations();$$
);
```

Then run the two required live checks, allowing at least one five-minute interval for run history:

```sql
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'expire-inventory-reservations-every-5-minutes';

select status, return_message, start_time, end_time
from cron.job_run_details
where jobid = (
  select jobid
  from cron.job
  where jobname = 'expire-inventory-reservations-every-5-minutes'
)
order by start_time desc
limit 10;
```

The first query must show exactly one active five-minute job with the expected command. The second must show successful recent runs. Until then, reservation expiry is a launch blocker.

## Live inventory action list

Read-only live verification again found **6 active, purchasable products; 2 with inventory rows; 4 without**. All four missing listings are active, purchasable, and fixed-price, so each is classified **NEEDS REAL STOCK ENTRY** if it is to remain sellable. If physical stock is unavailable, an administrator should deactivate that listing instead. No quantity can be inferred from the current product state.

| SKU | Product | Manual action |
|---|---|---|
| `GTH-BOS-GBH228` | Bosch GBH 2-28 DV Professional Rotary Hammer Drill 850W | Enter verified physical stock or deactivate |
| `GTH-MAK-GA5030` | Makita GA5030R 125mm Angle Grinder 720W with Soft Start | Enter verified physical stock or deactivate |
| `GTH-FLU-179` | Fluke 179 True-RMS Industrial Digital Multimeter with Temperature | Enter verified physical stock or deactivate |
| `GTH-TAP-S14H` | Taparia 1/2 Inch Drive Socket Set (26 Pieces Forged Steel) | Enter verified physical stock or deactivate |

## Production environment and CORS

- The API reads `CORS_ORIGIN` from validated server environment, not a hardcoded production value. Production now rejects localhost, non-HTTPS, and non-origin values. A production-mode smoke emitted the configured `https://shop.example.com` allow-origin header.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` remain server-side; only `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anon key belong in web variables. The web Supabase client no longer silently falls back to a particular project URL.
- `NEXT_PUBLIC_API_URL` is required by the web API client and must be set to the public backend `/api/v1` URL at web build time. The local `.env` used for smoke still points to localhost; it is not a production deployment value.
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` remain server-only. The optional `NEXT_PUBLIC_RAZORPAY_KEY_ID` is a public identifier. Client live credentials are still pending; disposable smoke placeholders were never deployed.
- Updated both `.env.example` files to distinguish development URLs from production values and removed an unused JWKS example setting.

## Coupons and variants: MVP decision

Neither feature is required by the current customer purchase flow. The coupon admin page was actively linked despite the missing table; that link/page and the coupon API mount have been removed. Variant UI hooks/services were unused, and variant API mounts plus the incidental product-detail/image lookup were removed. There are no new tables. Existing order `coupon_id`/`discount_amount` fields remain for historical compatibility; payment behavior is unchanged. Former coupon and variant API routes now return 404, not database 500, and the old coupon admin page returns 404.

## Remaining launch blockers

1. Apply and observe the reservation-expiry cron job live.
2. Enter verified stock or deactivate the four sellable listings without inventory rows.
3. Configure actual production origins, Supabase keys, and client-provided Razorpay credentials/secrets before deployment and repeat the production smoke against those deployment values.
4. Run the root pnpm/Turborepo verification sequence on the intended Node 22 CI runner; this host's Node 25 package-manager child stalled, so only the equivalent direct workspace commands were proven here.

The existing Sprint 4B local payment regression suite also passed 30/30 after these packaging changes. No live payment mutation was part of Sprint 5B.

## Ponytail review

Lean already. Ship. Standard TypeScript compilation and package exports resolved the runtime issue without a bundler, runtime transpiler, extra database tables, or new maintenance service.
