# Fluke Catalogue Import — 4 July 2026

## Current status

The catalogue is fully represented in a deterministic manifest and the application changes are locally verified. Live database apply and deployment are pending because the workspace has no Supabase CLI access token or database password. No unsafe or partial database mutation was attempted.

## Source audit

- Source: `Fluke Retail Price List - 4 July 2026.pdf`
- Effective date: 4 July 2026
- Pages visually reviewed: 4 (product pages 2–4)
- Sellable lines: 76
- Fluke lines: 75
- Non-Fluke review line: 1 (`Raytek MT4`)
- Manifest: `scripts/data/fluke-retail-price-list-2026-07-04.json`

The manifest generator asserts both source counts, so a missing or accidental extra row fails immediately.

## Implemented commercial rules

```text
website base price = PDF catalogue price × 0.75
GST = website base subtotal × 18%
freight = ₹60 when total order weight <= 1,000 g, otherwise ₹120
payable total = website base subtotal + GST + freight
```

- The 25% reduction is stored directly in `products.price`; it is not presented as a coupon or strike-through discount.
- GST is added after the base price and rounded once at order level.
- Freight is applied once per order with no free-shipping threshold.
- Browser-submitted prices remain ignored.
- Razorpay order amount and payment verification remain backend-authoritative.
- Any product without a positive authoritative `weight_grams` is rejected before an order is created.

Verified Fluke 101 example:

| Component | Amount |
| --- | ---: |
| PDF catalogue price | ₹4,770.00 |
| Website base price (75%) | ₹3,577.50 |
| GST at 18% | ₹643.95 |
| Freight (160 g) | ₹60.00 |
| Payable total | ₹4,281.45 |
| Razorpay amount | 428145 paise |

## Manifest resolution

| Status | Count | Handling |
| --- | ---: | --- |
| Existing Fluke match ready for safe update | 6 | Update price, GST rate, and manufacturer weight only; preserve IDs, stock, reservations, images, and order history |
| Fluke row explicitly unresolved | 69 | Do not create or expose for purchase |
| Raytek review row | 1 | Excluded from the Fluke import |

Ready existing matches:

| Model | PDF price | Website base price | Official weight |
| --- | ---: | ---: | ---: |
| Fluke 101 | ₹4,770 | ₹3,577.50 | 160 g |
| Fluke 106 | ₹6,490 | ₹4,867.50 | 200 g |
| Fluke 107 | ₹8,350 | ₹6,262.50 | 200 g |
| Fluke 59 MAX+ | ₹8,350 | ₹6,262.50 | 220 g |
| Fluke 961C | ₹7,210 | ₹5,407.50 | 78 g |
| Fluke T+Pro | ₹17,800 | ₹13,350.00 | 280 g |

Official manufacturer weight sources are embedded per row in the manifest. Official product/net weights were found for 36 Fluke rows; 39 remain `UNRESOLVED` after official Fluke page/manual/datasheet searches. New products remain blocked independently by vendor review even when weight and HSN are resolved.

## HSN research

The manifest records category-level headings only where the official CBIC description clearly matches the product function:

| Product group | HSN | Basis |
| --- | --- | --- |
| Multimeters, clamp meters, insulation/electrical testers | 9030 | Measuring/checking electrical quantities |
| Infrared thermometers; temperature/humidity instruments | 9025 | Thermometers, pyrometers, hygrometers and combinations |
| Laser distance meters | 9015 | Rangefinders |
| Vane anemometer | 9026 | Measuring/checking flow or variables of gases |
| Tachometers | 9029 | Revolution counters, speed indicators and tachometers |
| Light/sound meters | 9027 | Measuring/checking quantities of sound or light |

- HSN resolved: 59 Fluke rows
- HSN unresolved: 16 Fluke rows (thermal cameras/imagers and accessories/fuses where a more specific classification decision is required)
- GST rate for all Fluke rows: 18%, matching the client rule and the applicable CBIC schedule rate for the resolved headings

## Why 69 Fluke rows remain unresolved

- New `products` rows require `source_vendor_id`, and the database audit found no dedicated Fluke vendor. The importer will not silently assign G-Tech, Meco, HTC, Galaxy, or another unrelated vendor.
- Sixteen new rows still require authoritative HSN classification. The importer does not reuse `9030` across thermal cameras, accessories, and fuses.
- Thirty-nine Fluke rows still lack a manufacturer-confirmed sellable/package weight. Product dimensions or guessed packaging are not accepted.
- New catalogue images require a verified manufacturer asset and storage import. Existing good product images are preserved.

Each row is marked with its exact unresolved state in the manifest rather than being silently omitted.

## Importer behavior

`pnpm import:fluke` performs a read-only dry run. `pnpm import:fluke -- --apply` is the only mutation mode.

The importer:

- reuses the existing Fluke brand and refuses to create a duplicate;
- discovers existing product IDs at runtime rather than hard-coding environment-specific UUIDs;
- requires exactly one match per eligible model;
- requires existing HSN, 18% GST, official positive weight, and calculated website price;
- updates only `price`, `tax_rate`, and `weight_grams` for safe existing matches;
- preserves inventory, reservations, images, product IDs, and historical order/payment rows;
- is idempotent and reports already-correct rows as unchanged;
- skips every unresolved and non-Fluke row.

## Schema and application changes

- Added nullable positive `products.weight_grams` with a database check constraint.
- Added weight entry to admin product create/edit screens.
- Persisted weight and tax fields in the cart snapshot.
- Replaced all ₹500/free-shipping calculations and storefront wording with the required weight bands.
- Replaced GST-inclusive calculations and labels with GST-added calculations.
- Updated admin order summaries and commerce settings to the same rules.

## Verification

Passed locally:

- Fluke catalogue pricing/freight test
- Sprint 4A payment trust test
- Sprint 4B payment finalization test (30 checks)
- Server TypeScript check
- Web TypeScript check
- Production web compilation
- Manifest count assertion: 76 total / 75 Fluke / 1 Raytek
- Weight enrichment: 36 official / 39 unresolved
- HSN research: 59 resolved / 16 unresolved

The freight test covers:

1. under 1 kg → ₹60;
2. exactly 1 kg → ₹60;
3. above 1 kg → ₹120;
4. combined cart weight above 1 kg → ₹120;
5. quantity multiplication above 1 kg → ₹120;
6. unknown weight → controlled checkout rejection;
7. exact Fluke 101 GST, freight, payable total, and Razorpay paise amount.

## Live apply / deployment status

- Database writes during this run: 0
- Existing products updated during this run: 0
- New products inserted during this run: 0
- Inventory/images/orders/payments changed: 0
- Read-only live connection: pass
- Dry-run result: stopped safely with `Apply the weight_grams migration before running the catalogue importer.`
- Migration/apply/deployment: pending Supabase migration credentials

Required live sequence once external access is available:

1. apply `supabase/migrations/20261008150957_add_product_weight_grams.sql`;
2. run `pnpm import:fluke` and confirm six unique existing matches;
3. run `pnpm import:fluke -- --apply`;
4. rerun the dry run and confirm six unchanged rows and zero conflicts;
5. deploy web and API services;
6. complete storefront/admin/checkout/Razorpay smoke checks.
