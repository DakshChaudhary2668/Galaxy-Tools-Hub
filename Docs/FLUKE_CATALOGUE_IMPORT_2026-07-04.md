# Fluke Catalogue Import - 4 July 2026

## Result

The verified catalogue manifest contains 76 sellable lines: 75 Fluke rows and one excluded Raytek MT4 review row. Six existing Fluke products were already commercially correct. The controlled bulk import created 53 of the remaining 69 Fluke products; 16 remain blocked because their HSN classification is unresolved.

No stock was invented. Every newly created product has quantity and reserved quantity set to zero, is active for catalogue visibility, and is not purchasable.

## Canonical records

- Brand: existing `Fluke` brand reused.
- Supplier: one `Fluke` vendor created with code `FLUKE`.
- Existing six supplier links: safely normalized to the canonical Fluke vendor.
- Raytek MT4: excluded; no Fluke brand or vendor assignment.

## Commercial rules

```text
website base price = PDF catalogue price x 0.75
GST = website base subtotal x 18%
freight = Rs 60 when total cart weight <= 1,000 g, otherwise Rs 120
payable total = website base subtotal + GST + freight
```

The 25% reduction is stored as the normal pre-GST selling price. No discount badge, strike-through catalogue price, coupon, per-product freight, free-shipping threshold, or GST-inclusive extraction is used. Checkout and Razorpay amounts remain server-authoritative.

## Enrichment summary for the 69 new rows

### Weights

| Classification | Count |
| --- | ---: |
| NET_PRODUCT | 30 |
| SELLABLE_KIT | 0 |
| PACKAGE_ONLY | 0 |
| UNRESOLVED | 39 |

Official Fluke product pages, manuals, and manufacturer-hosted documents are recorded in the manifest. Unresolved weights remain null; no estimate is used.

### HSN

| Status | Count |
| --- | ---: |
| Resolved | 53 |
| Unresolved / review required | 16 |

Resolved groups use the applicable CBIC heading recorded in the manifest. Thermal cameras/imagers and ambiguous accessories/fuses remain blocked rather than receiving a guessed classification.

### Images

| Status | Count |
| --- | ---: |
| Exact-match official Fluke asset | 13 |
| PDF fallback | 0 |
| Storefront fallback required | 56 |

Thirteen official images were uploaded to the `product-images` bucket and registered as primary images. Verification found 13 matching metadata rows, 13 matching Storage objects, and zero orphans. Missing images did not block otherwise safe catalogue rows.

### Product disposition

| Status | Count |
| --- | ---: |
| SAFE_TO_CREATE | 26 |
| SAFE_CATALOG_ONLY | 27 |
| HSN_BLOCKED | 16 |
| OTHER_BLOCKED | 0 |

The 27 catalogue-only rows have unresolved weight and remain non-purchasable. The 16 HSN-blocked rows were not inserted.

## Apply verification

- New products inserted: 53
- New inventory rows: 53
- New vendor rows: 1
- Official images uploaded: 13
- Existing products commercially changed: 0
- Existing supplier links corrected: 6
- Duplicate products/SKUs/slugs created: 0
- Price mismatches: 0
- Tax mismatches: 0
- New rows with quantity 0: 53
- New rows with reserved quantity 0: 53
- New rows purchasable: 0
- Total Fluke-brand rows after apply: 62 (53 catalogue imports plus 9 pre-existing rows)

The six verified catalogue matches retained their IDs, prices, tax rates, weights, inventory quantities, reservations, images, active flags, and purchasable flags. Only their source vendor changed to the client-confirmed canonical Fluke supplier.

Post-apply dry run:

- Imported rows unchanged: 53
- New rows proposed: 0
- Existing commercial drift: 0
- Supplier changes proposed: 0
- Conflicts: 0

## Admin and storefront verification

Live database/API checks verified all imported names, deterministic SKUs, prices, GST rates, weights, brand, supplier, categories, active state, non-purchasable state, and zero inventory.

Production catalogue search returned:

- `Fluke 115`: one result with Rs 11,700 base price, official 550 g weight, and official primary image.
- `Fluke 101 Kit`: one result with Rs 4,387.50 base price and normal image fallback.
- `Fluke 374 FC`: one result with Rs 28,125 base price and official primary image.
- `Fluke VT06`: zero results because HSN remains blocked.
- `Raytek MT4`: zero results because it remains excluded.

The storefront products route returned HTTP 200. The compiled admin Products and Inventory routes remain available; authenticated UI mutation was not needed for verification because the live database and production API expose the same persisted records.

## Checkout and payment regression

Passed:

- under 1 kg -> Rs 60 freight;
- exactly 1 kg -> Rs 60 freight;
- above 1 kg -> Rs 120 freight;
- combined products above 1 kg -> Rs 120 freight;
- quantity multiplication above 1 kg -> Rs 120 freight;
- missing weight -> controlled rejection;
- Fluke 101 -> Rs 3,577.50 base + Rs 643.95 GST + Rs 60 freight = Rs 4,281.45 / 428145 paise;
- browser-submitted price ignored;
- Razorpay signature, binding, amount, currency, captured-state, reservation, finalization, replay, and convergence regressions: 30/30 passed.

No Razorpay order or real payment was created.

## Build verification

- Server typecheck: passed
- Web typecheck: passed
- Server build: passed
- Web production build: passed (existing lint warnings only)
- Fluke pricing/freight regression: passed
- Payment trust regression: passed
- Payment finalization regression: 30/30 passed
- Live inventory invariants: passed
- Production catalogue/search smoke: passed

## Deployment

- Data apply: complete and live in Supabase.
- Main branch push: pending final commit.
- Frontend/API deployment verification: pending the main push.

## Remaining manual review

Sixteen rows remain `HSN_REVIEW_REQUIRED`: TC01A, TC01B, TC01C, TC03A, VT06, VT08, TL75, TL175, TPAK, i2500-18, i410, i1010, Fuse 315mA 1pc, Fuse 15B+/17B+ 1 unit, Fuse 179 combo 5 pack, and Fuse 115/15B+/17B+/179 combo 5 pack.

No HSN, weight, stock, duplicate brand/vendor, or Raytek-to-Fluke mapping was invented.
