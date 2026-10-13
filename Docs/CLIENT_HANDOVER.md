# Galaxy Tools Hub — Client Handover

Audit snapshot: 13 October 2026. Final reviewed commit: `06864f5` (`fix: approve required pnpm build scripts`). Hostinger reports successful production builds/publishing for both apps from this commit. Payment mode, customer/admin journeys, and direct post-deployment API health checks remain unverified; this is not a declaration that payment is cleared for live charges.

## Overview and delivered scope

Galaxy Tools Hub is an industrial-tools storefront with a Next.js customer/admin interface, an Express API, and Supabase for Postgres, Auth, and product storage. Existing repository work includes customer authentication and recovery, catalogue/cart/checkout, order tracking, admin product and inventory workflows, Resend-backed enquiries, and customer-facing policy/SEO routes. The final commit also includes content cleanup, enquiry handling, category fallbacks, cart weight checks, and UI/error handling.

## Production URLs and architecture

- Storefront: <https://galaxytoolshub.com>
- API: <https://api.galaxytoolshub.com>
- Source: `DakshChaudhary2668/Galaxy-Tools-Hub`, branch `main`
- Host: Hostinger Node.js apps, Node 22, pnpm. Frontend is the configured Express entry `server.js` with output/root `.`, backend entry `apps/server/dist/index.js`. Keep these settings; this is not a generic Next.js-only deployment.
- Hostinger reports both production builds/publishes completed for commit `06864f5`. The frontend build used Node 22, Express, output `.`, and `server.js`; the backend used Node 22, Express, and `apps/server/dist/index.js`.
- A fresh direct post-deployment HTTP check could not be completed from this environment (outbound DNS resolution is unavailable; browser retrieval of API health URLs was also inaccessible). A cached storefront crawl is not treated as live verification. Customer/admin journeys remain untested.

## Local setup and checks

Use Node 22 and pnpm. Copy the example files to local `.env` files, fill only the required values securely, then run `pnpm install`, `pnpm dev`, `pnpm type-check`, `pnpm lint`, `pnpm build`, and `pnpm build:server`. Local ports are web `3000` and API `8000`.

Environment-variable names are documented in `.env.example`, `apps/web/.env.example`, and `apps/server/.env.example`; these files contain placeholders, not credentials. Never place service-role, payment-secret, webhook, or email-provider secrets in `NEXT_PUBLIC_*` variables or source control. Do not run database seed scripts against production.

## Deploy and rollback

Deploy through the existing Hostinger applications and their deployment history only after the full production build and critical checks pass. Preserve Node 22, the configured frontend `server.js` entry, backend `apps/server/dist/index.js`, and existing environment configuration. Confirm both application deployment records and run smoke tests after deploy. If the release fails, use Hostinger's deployment history to restore the last known-good deployment, then re-verify storefront and API health. Do not edit deployment settings to compensate for a failing build.

## Supabase and administration

Supabase provides Postgres, Auth, and product-image storage. Review and apply migrations deliberately; do not rerun seed data on the live project. Supabase Auth handles signup, confirmation, login, and password recovery; production Site URL/redirects must remain on the approved `galaxytoolshub.com` routes. Admin access is role-gated; only owner-approved accounts should receive admin roles. Product and inventory edits are made in the admin dashboard; preserve product IDs, orders, reservations, and stock history. Take a database/storage backup before any cleanup or bulk change.

## Checkout, payments, and email

Checkout pricing, GST, freight, payment verification, and inventory finalization are server-authoritative. Automated checks cover payment signature/webhook convergence and inventory behavior, but there has been no real-money test. Hostinger confirms the Razorpay key variables are configured but masks values; mode and matching credential/webhook configuration are **not verified**. No Razorpay credentials were changed. The account owner must sign in to Razorpay, first decide whether this is (a) rotation within the current mode or (b) a Test-to-Live switch, verify Live activation, then securely set the matching `NEXT_PUBLIC_RAZORPAY_KEY_ID` on the frontend and `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` on the backend. Configure the Live webhook URL as `https://api.galaxytoolshub.com/api/v1/payments/webhook/razorpay` and enable `payment.captured` and `order.paid`. Never use masked values as inputs or test by making a real charge.

The production custom-SMTP screen was shown enabled with Resend settings in the supplied screenshots; delivery, templates, and confirmation/reset journeys have not been independently exercised in this pass. Hostinger's backend variable list does not include `RESEND_API_KEY`, so newly added contact/dealer enquiry delivery will fail closed until that server-only key is securely configured. The earlier exposed Resend key remains a security follow-up; this handover does not disclose or claim it has been rotated.

## Data cleanup snapshot

See [PRODUCTION_DATA_CLEANUP_DRY_RUN.md](PRODUCTION_DATA_CLEANUP_DRY_RUN.md). The inactive, explicitly labeled `QA-2026-TEST` product had zero references in all checked dependency tables; `parent_products` does not exist in the live public schema. The product and its single image were backed up, then exactly that product, its image row/inventory row, and the orphaned storage object were removed and verified. Backup is at `/private/tmp/gth-qa-cleanup-backup-20261013`. A separate test-looking product is linked to historical order data and remains preserved. No auth users or orders were deleted.

## Backup and troubleshooting

Before data changes, export the affected rows and storage assets and verify that the backup can be read. Keep backups in access-controlled storage, not Git. For site/API errors, first inspect Hostinger deployment logs and health responses; for auth/email, inspect Supabase Auth settings and Resend delivery logs; for checkout, inspect API logs and Razorpay webhook delivery without exposing secret values or customer data. Restore only from a known-good backup and record the recovery action.

## Known limits and owner decisions

- Full production build passes locally and on Hostinger via `pnpm build` (Next.js 15.5.23, all seven Turbo packages). The earlier validation stall was caused by running the worker build inside the restricted sandbox: the child stayed idle at lint/type validation, while the same repository build completed outside it. A clean offline build also exposed `next/font/google` fetching Inter from Google Fonts; removing that build-time network dependency lets the build complete without external font access. Hostinger confirmed pnpm 11.24.0 and required explicit build-script approval for the four existing native/tooling packages (`@parcel/watcher`, `esbuild`, `sharp`, `unrs-resolver`); these are explicitly approved in `pnpm-workspace.yaml`. The project pin is aligned to Hostinger's pnpm 11.24.0, with the lockfile unchanged. Hostinger builds completed under Node 22.
- Standalone web typecheck and lint pass. Web lint/build report three existing `any` warnings. Backend TypeScript build passes; backend lint has 34 warnings and no errors. Focused payment, checkout/inventory, reservation/finalization, Fluke pricing, catalogue, commerce UI, and enquiry validation tests pass.
- Live Razorpay mode and webhook configuration need owner verification; do not claim live cutover.
- Resend auth-email delivery flows need controlled end-to-end verification. Enquiry email requires a backend-only `RESEND_API_KEY` in Hostinger.
- Final legal seller/GST/invoice, returns/refunds/cancellations, dispatch, warranty, support destinations, and related claims still require client approval; see [CLIENT_PRE_LAUNCH_APPROVALS.md](CLIENT_PRE_LAUNCH_APPROVALS.md) and [CLIENT_LAUNCH_INFORMATION_REQUIRED.md](CLIENT_LAUNCH_INFORMATION_REQUIRED.md).
- Hostinger reports deploy completion for `06864f5`, but direct post-deployment health checks and customer/admin flow smoke tests remain open.

## Handover checklist

- [x] Review and commit the changes; `.npmrc` remains `production=false`.
- [x] Complete the full production build and focused regression checks.
- [ ] Run post-deployment production health checks and customer/admin journey smoke tests.
- [ ] Account owner: verify payment mode and Live webhook settings without initiating a charge; update the matched credential variables only if cutover is approved.
- [ ] Securely configure the required server-only enquiry email key and test actual delivery.
- [ ] Complete signup/confirmation/reset email flows and production storefront/API smoke tests.
- [x] Remove only the approved unreferenced QA product and preserve linked historical records; evidence and backup are documented.
- [ ] Obtain client approvals listed in the pre-launch checklist.
- [x] Hostinger reports deployment completion for both apps using the existing configuration; direct smoke verification remains open.
