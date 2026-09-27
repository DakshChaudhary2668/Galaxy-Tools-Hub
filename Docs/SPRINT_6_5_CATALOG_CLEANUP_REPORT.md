# Sprint 6.5 — Catalog Cleanup & Admin Readiness Report

**Date:** 2026-09-22
**Scope:** Catalog hygiene, test-data removal, admin is_purchasable toggle, checklist update.
**Constraint:** No real products created, no stock invented, no payment logic touched, no deployment.

---

## Summary

All Sprint 6.5 objectives are complete.

---

## 1. Catalog Cleanup — Migration

**File:** `supabase/migrations/20260922083208_sprint65_catalog_cleanup.sql`

| Action | SKU | Reason |
|--------|-----|--------|
| `is_active=false, is_purchasable=false` | `TEST-IMG-1789587423108` | Sprint-3 test artifact; referenced by active `order_items` row — FK prevents deletion. Deactivated, disappears from public catalog, order history intact. |
| `DELETE` | `QA-2026-TEST` | Sprint-2 QA placeholder; zero order references confirmed in Sprint-6 audit. Cascade deletes its `product_images` and `inventory` rows. |
| `is_purchasable=false` (active kept) | `GTH-BOS-GBH228`, `GTH-MAK-GA5030`, `GTH-FLU-179`, `GTH-TAP-S14H` | Real instruments with unverified physical stock. Visible in catalog ("Out of Stock / Coming Soon"), checkout blocked. Admin flips `is_purchasable=true` once stock confirmed. |

Migration is idempotent — re-running produces the same end-state.

---

## 2. Admin Portal — is_purchasable Toggle

**File:** `apps/web/src/app/admin/(dashboard)/products/[id]/edit/page.tsx`

Added `is_purchasable` checkbox to the **Status & Visibility** card. Admin can now:
- See current purchasable state when loading a product.
- Uncheck to block checkout (e.g., pending stock).
- Recheck once physical stock is verified and entered.

No server-side changes required — `UpdateProductSchema` already accepts `is_purchasable` (it's in `ProductSchema` and inherited via `.partial()`). The base repository passes all fields straight to Supabase `.update()`.

---

## 3. Type-Check

```
pnpm --filter galaxy-web exec tsc --noEmit   → 0 errors
```

---

## 4. Production Readiness Gate

After applying this migration on the production Supabase project:

- Public catalog shows 0 test listings.
- The 4 real-instrument products are visible but not purchasable (safe for display).
- Admin can enable each product individually after verifying physical stock.

**Remaining gates (Sprint 7 / deployment):**
- Enter real stock quantities for the 4 locked products via Admin Inventory.
- Confirm Razorpay live credentials and storefront domain.
- Deploy and smoke-test per `PRODUCTION_LAUNCH_CHECKLIST.md`.
