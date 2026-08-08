# Galaxy Tools Hub — Database Architecture Change Report

> **Date:** 2026-08-08
>
> **Author:** Development Team
>
> **Version:** 2.0
>
> **Scope:** Complete restructuring of database schema and architecture documentation

---

## Executive Summary

The Galaxy Tools Hub database architecture has been completely overhauled from a basic 15-table admin-focused schema into a comprehensive 28-table production-grade e-commerce database. This restructuring establishes a solid foundation for the platform's dealer/reseller business model, introduces customer-facing features (cart, wishlist, reviews), separates payment verification from order management, and ensures historical data integrity across all financial records.

### Key Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total tables | 15 | 28 | +13 new tables |
| Database indexes | 6 | 32 | +26 new indexes |
| Schema lines | 192 | 669 | +477 lines |
| Documentation lines | 33 | 1,945 | +1,912 lines |
| CHECK constraints | 8 | 35+ | Comprehensive coverage |
| Files updated | — | 2 | `DatabaseGuide.md`, `schema.sql` |

---

## Table of Contents

1. [Files Modified](#1-files-modified)
2. [Renamed Tables](#2-renamed-tables)
3. [Removed Tables](#3-removed-tables)
4. [New Tables Added](#4-new-tables-added)
5. [Expanded Existing Tables](#5-expanded-existing-tables)
6. [Replaced Tables](#6-replaced-tables)
7. [Why Each Change Was Made](#7-why-each-change-was-made)
8. [Business Benefits](#8-business-benefits)
9. [Technical Benefits](#9-technical-benefits)
10. [Security Improvements](#10-security-improvements)
11. [Enum / Status Value Changes](#11-enum--status-value-changes)
12. [Indexing Improvements](#12-indexing-improvements)
13. [Constraint Improvements](#13-constraint-improvements)
14. [Data Integrity Safeguards](#14-data-integrity-safeguards)
15. [Impact on Existing Code](#15-impact-on-existing-code)
16. [Migration Considerations](#16-migration-considerations)
17. [Risk Assessment](#17-risk-assessment)
18. [What Was NOT Changed](#18-what-was-not-changed)

---

## 1. Files Modified

| File | Type | Description |
|------|------|-------------|
| `Docs/DatabaseGuide.md` | Documentation | Rewritten from 33-line skeleton to 1,945-line comprehensive database architecture specification |
| `Docs/schema.sql` | SQL Schema | Rewritten from 192-line / 15-table schema to 669-line / 28-table production-grade schema |
| `Docs/ChangeReport.md` | Documentation | This report (new file) |

### Files NOT Modified

| File | Reason |
|------|--------|
| `apps/server/src/**` | No source code changes — this is a schema-only update |
| `apps/web/src/**` | No frontend changes |
| `packages/constants/index.ts` | Will need updates during implementation (documented) |
| `packages/types/index.ts` | Will need updates during implementation (documented) |
| `.env.example` | No environment variable changes |

---

## 2. Renamed Tables

### `users` → `admin_users`

| Aspect | Detail |
|--------|--------|
| **What changed** | Table renamed from `users` to `admin_users` |
| **Why** | The old name `users` was ambiguous. The system now has two types of users: customers (authenticated via Supabase Auth → `profiles` table) and admin/internal staff (authenticated via Clerk → `admin_users` table). Renaming eliminates confusion. |
| **Columns preserved** | All original columns (`id`, `clerk_user_id`, `name`, `email`, `role`, `status`, `created_at`) are preserved unchanged |
| **Impact** | `rbac.middleware.ts` and any queries referencing `users` will need to reference `admin_users` instead |

---

## 3. Removed Tables

### `product_variants` — Deferred to Phase 2

| Aspect | Detail |
|--------|--------|
| **What changed** | The `product_variants` table has been removed from the MVP schema |
| **Why** | The vendor PDF catalogs (G-Tech, Meco, HTC) contain products like the GT8000 Gas Detector with different model/specification/price/HSN combinations. These are distinct catalog items — not color or size variants of the same product. Forcing them into a parent-variant structure would be artificial and create unnecessary complexity. |
| **How products are handled now** | Each distinct model is a separate row in `products` with its own SKU, price, HSN code, and specifications |
| **Future extensibility** | The `products.parent_product_id` field provides a migration path if genuine SKU variants (e.g., same product, different color/size) are needed later |
| **Example** | GT8000 Model A → SKU `GTH-GTECH-GT8000A-001`, GT8000 Model B → SKU `GTH-GTECH-GT8000B-001` (separate products, not variants) |
| **Benefit** | Simpler catalog management for ~500 products; avoids overengineering for MVP |

### `customers` — Replaced by `profiles`

See [Replaced Tables](#6-replaced-tables) below.

### `addresses` — Replaced by `user_addresses`

See [Replaced Tables](#6-replaced-tables) below.

### `payment_proofs` — Replaced by `payments` + `payment_verifications`

See [Replaced Tables](#6-replaced-tables) below.

### `activity_logs` — Replaced by `audit_logs`

See [Replaced Tables](#6-replaced-tables) below.

---

## 4. New Tables Added

### 4.1 `vendors` — Supplier/Vendor Tracking (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Tracks the supplier/dealer source for each product |
| **Why it was missing** | The old schema conflated brand and vendor. Galaxy Tools Hub is a reseller — the source vendor who supplies the catalog is a critical business entity separate from the brand/manufacturer |
| **Business value** | Enables tracking which vendor supplies which products, vendor contact management, and future multi-vendor analytics |
| **Key distinction** | Brand = who manufactured it (G-Tech). Vendor = who sells it to Galaxy Tools Hub (G-Tech distributor) |

### 4.2 `tax_rates` — Configurable GST Rates (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Stores tax rate rules with effective date ranges |
| **Why** | The old schema hardcoded `gst_percentage DEFAULT 18.00` on the products table. GST rates can change, and different product categories may have different rates. A configurable table allows the business to update tax rates without code changes |
| **Business value** | GST compliance; when rates change, only the `tax_rates` table needs updating — no product-by-product edits |

### 4.3 `inventory_transactions` — Stock Movement History (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Records every stock movement (in, out, reserved, damaged, adjusted) |
| **Why** | The old schema only had current stock levels with no history. If inventory was wrong, there was no way to trace what happened |
| **Business value** | Full audit trail for stock; identify discrepancies; track damage/returns; accountability for manual adjustments |
| **Transaction types** | `STOCK_IN`, `STOCK_OUT`, `ORDER_RESERVED`, `ORDER_RELEASED`, `SALE`, `RETURN`, `DAMAGE`, `ADJUSTMENT` |

### 4.4 `carts` + `cart_items` — Shopping Cart (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Persistent shopping cart for authenticated customers (and optionally guests) |
| **Why** | The old schema had no cart tables. A persistent cart is fundamental for e-commerce |
| **Business value** | Cart abandonment tracking; cart recovery; guest-to-registered conversion |
| **Cart statuses** | `ACTIVE`, `CONVERTED` (became an order), `ABANDONED` |

### 4.5 `wishlists` + `wishlist_items` — Wishlist (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Allows customers to save products for later |
| **Why** | Standard e-commerce feature; improves customer engagement and return visits |
| **Business value** | Insight into customer interest; marketing signals; improved UX |
| **Constraint** | One wishlist per customer; no duplicate products in a wishlist |

### 4.6 `order_addresses` — Historical Address Snapshots (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Stores a frozen copy of the shipping/billing address at order time |
| **Why** | The old schema referenced customer addresses directly. If a customer moves, old orders would show the new address — destroying the historical record |
| **Business value** | Accurate delivery records; legal compliance for invoicing; dispute resolution |
| **Critical rule** | The old order must always show where it was actually shipped, not the customer's current address |

### 4.7 `payments` — Payment Records (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Records each payment attempt against an order |
| **Why** | The old schema embedded payment status directly on the order. This made it impossible to track payment retries, multiple payment methods, or partial payments |
| **Business value** | Clean separation of payment lifecycle from order lifecycle; support for multiple payment methods |
| **Payment methods** | `QR`, `UPI`, `BANK_TRANSFER`, `COD`, `GATEWAY` |

### 4.8 `payment_verifications` — UTR Verification (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Tracks the UTR verification workflow (submission → review → verified/rejected) |
| **Why** | The old `payment_proofs` table had no status tracking — just a proof image and optional UTR. There was no way to model the admin review workflow |
| **Business value** | Clear audit trail for payment verification; rejection reasons documented; accountability via `verified_by` |
| **Critical rule** | Submitting a UTR does NOT auto-confirm the order. Admin must explicitly verify |

### 4.9 `shipments` — Shipment Tracking (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Dedicated shipment tracking with courier, tracking number, and status |
| **Why** | The old schema stored `shipping_partner`, `tracking_number`, and `estimated_delivery` directly on the `orders` table. This prevented tracking shipment status independently and made split shipments impossible |
| **Business value** | Independent shipment lifecycle; future multi-shipment support; detailed tracking |
| **Shipment statuses** | `PENDING`, `PACKED`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED` |

### 4.10 `reviews` — Product Reviews (MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Customer product reviews with ratings and admin moderation |
| **Why** | Standard e-commerce feature; builds trust and social proof |
| **Business value** | Customer trust; SEO benefits; product quality feedback |
| **Moderation** | Reviews require admin approval (`is_approved`); verified purchase tracking |
| **Constraint** | One review per customer per product; rating between 1 and 5 |

### 4.11 `product_documents` — Product Documents (Optional MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Attach datasheets, manuals, certificates to products |
| **Why** | B2B customers for industrial tools expect technical documentation |
| **Business value** | Professional catalog presentation; reduces pre-sale support questions |
| **Document types** | `DATASHEET`, `MANUAL`, `CERTIFICATE`, `CATALOG`, `OTHER` |

### 4.12 `quote_requests` + `quote_request_items` — Quote Flow (Optional MVP)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Supports "Request Quote" flow for products without fixed pricing |
| **Why** | Some industrial products have prices that depend on quantity, configuration, or negotiation. These should NOT go through normal checkout with `price = 0` |
| **Business value** | Professional B2B inquiry workflow; captures demand for quote-required products |

---

## 5. Expanded Existing Tables

### 5.1 `products` — Major Expansion

| New Column | Purpose | Benefit |
|------------|---------|---------|
| `source_vendor_id` | FK to `vendors` table | Tracks which vendor/dealer supplied this product |
| `source_model_no` | Vendor's own model number | Preserves the original catalog reference (distinct from Galaxy Tools Hub SKU) |
| `parent_product_id` | Self-referencing FK | Links accessories/spare parts to their parent product |
| `product_type` | `PRODUCT` / `ACCESSORY` / `SPARE_PART` | Classifies products for catalog organization |
| `pricing_type` | `FIXED` / `QUOTE_REQUIRED` | Properly handles "On Request" pricing instead of `price = 0` |
| `specifications` | JSONB | Stores technical specs (range, accuracy, resolution, etc.) without a complex normalized attribute system |
| `is_purchasable` | Boolean | Controls whether product can enter checkout (false for quote-required products) |
| `short_description` | Text | Separate short/long descriptions for catalog cards vs detail pages |
| `compare_at_price` | Numeric | Renamed from `mrp` for clearer semantics (shows "was" vs "now" pricing) |
| `minimum_order_quantity` | Integer | MOQ field (nullable — not auto-populated from ambiguous PDF data) |

**Columns renamed for consistency:**
- `active` → `is_active`
- `featured` → `is_featured`
- `mrp` → `compare_at_price`
- `gst_percentage` → `tax_rate`

**New constraint:**
```sql
CONSTRAINT chk_pricing CHECK (
  (pricing_type = 'FIXED' AND price IS NOT NULL)
  OR (pricing_type = 'QUOTE_REQUIRED')
)
```
This ensures FIXED-price products always have a price, while QUOTE_REQUIRED products allow NULL price.

### 5.2 `orders` — Restructured Status Model

| Change | Before | After | Benefit |
|--------|--------|-------|---------|
| Order status | Mixed payment + fulfillment (`Pending Payment`, `Payment Verified`, etc.) | Pure fulfillment (`PENDING`, `CONFIRMED`, `PROCESSING`, etc.) | Cleaner state machine; no contradictory statuses |
| Payment status | Embedded in order (`Pending`, `Submitted`, `Verified`, `Rejected`) | Separate field with expanded values (`PENDING`, `UNDER_REVIEW`, `PAID`, `FAILED`, `REJECTED`, `REFUNDED`) | Independent lifecycles |
| Customer ref | `customer_id` → `customers` | `user_id` → `profiles` | Proper Supabase Auth integration |
| Monetary fields | `total_amount`, `tax_amount`, `discount_amount` only | Added `subtotal`, `shipping_amount`, `currency` | Complete financial breakdown |
| Shipping | `shipping_partner`, `tracking_number`, `estimated_delivery` inline | Moved to dedicated `shipments` table | Clean separation; future multi-shipment |
| Notes | Single `notes` field | Split into `customer_notes` and `admin_notes` | Privacy — customer notes vs internal notes |

### 5.3 `order_items` — Historical Snapshots

| New Column | Purpose | Critical Reason |
|------------|---------|----------------|
| `product_name` | Snapshot of product name | If product renamed later, order still shows original name |
| `sku` | Snapshot of SKU | SKU changes don't corrupt order history |
| `source_model_no` | Snapshot of vendor model | Historical reference |
| `hsn_code` | Snapshot of HSN code | Tax/legal compliance — GST filing uses HSN at time of sale |
| `tax_rate` | Snapshot of tax rate | If tax rate changes, old orders still reflect the rate they were charged |
| `discount_amount` | Per-item discount | Granular discount tracking |
| `product_id` | Changed to nullable (SET NULL on delete) | Product deletion doesn't destroy order history |

### 5.4 `product_images` — Improved Metadata

| Change | Before | After | Benefit |
|--------|--------|-------|---------|
| Image reference | `image_url` (raw URL) | `storage_path` + `public_url` | Proper Supabase Storage integration; URL can be regenerated |
| Display order | `display_order` | `sort_order` | Consistent naming across all tables |
| Primary flag | Not present | `is_primary` | Quickly identify the main product image |
| Alt text | Not present | `alt_text` | Accessibility compliance; SEO benefit |

### 5.5 `inventory` — Enhanced Stock Management

| Change | Before | After | Benefit |
|--------|--------|-------|---------|
| Reserved field | `reserved_stock` | `reserved_quantity` | Consistent naming |
| Available stock | `available_stock GENERATED ALWAYS AS (quantity - reserved_stock) STORED` | Computed at query time (or retain generated column) | Avoids update complications |
| Reorder level | Not present | `reorder_level` | Low-stock alerts in admin dashboard |

### 5.6 `audit_logs` — Expanded from `activity_logs`

| Change | Before | After | Benefit |
|--------|--------|-------|---------|
| Table name | `activity_logs` | `audit_logs` | Clearer purpose |
| Data capture | `metadata JSONB` (freeform) | `old_values JSONB` + `new_values JSONB` | Before/after comparison for every change |
| Client info | Not tracked | `ip_address INET` + `user_agent TEXT` | Security audit; track who did what from where |
| FK reference | `user_id → users(id)` | `user_id → admin_users(id)` | Updated to new table name |

---

## 6. Replaced Tables

### `customers` → `profiles`

| Aspect | Before (`customers`) | After (`profiles`) |
|--------|---------------------|-------------------|
| Authentication | Direct email/phone storage (no auth integration) | Linked to `auth.users.id` via Supabase Auth |
| Identity | Standalone table | `user_id` FK → `auth.users.id` (UNIQUE) |
| Fields | `company_name`, `contact_name`, `email`, `phone`, `gstin` | `full_name`, `email`, `phone`, `account_type`, `avatar_url`, `is_active`, `last_login_at` |
| Account types | None (all were customers) | `CUSTOMER` or `ADMIN` (for future flexibility) |
| Password handling | Not clear | Explicitly handled by Supabase Auth — never stored in custom tables |

**Benefit:** Proper authentication integration; customers can sign up/login via Supabase Auth with email, social providers, or magic links. No custom password management needed.

### `addresses` → `user_addresses`

| Aspect | Before | After |
|--------|--------|-------|
| Name | `addresses` | `user_addresses` (clearer purpose) |
| FK | `customer_id → customers` | `user_id → profiles` |
| Fields | `address_line1`, `address_line2`, `city`, `state`, `pincode` | Added `address_label`, `full_name`, `phone`, `landmark`, `country`, `updated_at` |
| Naming | `pincode` | `postal_code` (international standard) |

### `payment_proofs` → `payments` + `payment_verifications`

| Aspect | Before (single table) | After (split) |
|--------|----------------------|---------------|
| Structure | One `payment_proofs` per order | `payments` (payment attempt) + `payment_verifications` (UTR verification) |
| Status tracking | None — just upload + verify timestamps | Full lifecycle: `PENDING` → `UNDER_REVIEW` → `VERIFIED` / `REJECTED` |
| Payment methods | Implicit | Explicit: `QR`, `UPI`, `BANK_TRANSFER`, `COD`, `GATEWAY` |
| Rejection handling | Not supported | `rejection_reason` field; customer can retry |
| Multiple payments | Not possible (UNIQUE on order_id) | Possible — `payments` has no unique constraint on `order_id` |

**Benefit:** Proper UTR verification workflow; admin accountability; rejection with reason; payment retry support.

---

## 7. Why Each Change Was Made

### Business Model Alignment

| Decision | Reason |
|----------|--------|
| Separate `vendors` from `brands` | Galaxy Tools Hub is a reseller. The vendor who supplies the product is not always the same as the brand. A vendor can supply multiple brands. |
| `source_model_no` separate from `sku` | The vendor's model number (e.g., GT91 TRMS) is NOT the Galaxy Tools Hub SKU (e.g., GTH-GTECH-GT91-001). They must be tracked separately. |
| `pricing_type` with `QUOTE_REQUIRED` | Some industrial products don't have fixed prices. Using `price = 0` is incorrect — it implies the product is free, not that it needs a quote. |
| No enterprise RBAC | The team is 3 people (1 admin + 2 partners). Creating `roles`, `permissions`, `role_permissions`, `user_roles` tables would be severe overengineering. |
| No product variants for MVP | The ~500 catalog items from the PDFs are distinct products, not variants. Forcing them into variants creates unnecessary complexity. |

### Data Integrity

| Decision | Reason |
|----------|--------|
| Order item snapshots | If a product's name, price, or HSN code changes after an order is placed, the order must still reflect the original values. This is a legal requirement for GST invoicing. |
| Order address snapshots | If a customer moves, historical orders must still show the address where the product was actually shipped. |
| Tax snapshot on order items | Tax rates can change. Old orders must reflect the rate that was actually charged, not the current rate. |
| Soft deletion (`is_active`) | Physically deleting a product that appears in historical orders would break referential integrity and destroy financial records. |

### Operational Safety

| Decision | Reason |
|----------|--------|
| UTR verification workflow | The old system had no way to track whether a UTR was reviewed, by whom, or whether it was rejected. The new workflow ensures accountability. |
| Audit logs with before/after | With 3 people having full admin access, knowing who changed what (and what the old value was) is critical for accountability. |
| Inventory transactions | Without a stock movement log, there's no way to trace why inventory numbers are wrong. |

---

## 8. Business Benefits

### Revenue Protection
- **Price history**: Audit logs track every price change with old/new values
- **No false zero-price products**: `QUOTE_REQUIRED` prevents accidental `price = 0` issues
- **Tax compliance**: HSN codes and tax rates snapshotted per order item for GST filing

### Customer Experience
- **Shopping cart**: Persistent carts enable cart recovery and abandoned cart marketing
- **Wishlist**: Customers can save products for later, increasing return visits
- **Reviews**: Social proof builds trust; verified purchase badge adds credibility
- **Quote requests**: Professional B2B inquiry flow for negotiated pricing

### Operational Efficiency
- **Vendor tracking**: Know which vendor supplies which products at a glance
- **Low-stock alerts**: `reorder_level` enables proactive inventory management
- **Stock audit trail**: Every stock movement is logged — no more mystery discrepancies
- **UTR accountability**: Know who verified which payment, when, and why rejections happened

### Scalability
- **28 tables with clean separation of concerns** — each table has one job
- **No artificial coupling** — payment, order, and shipment lifecycles are independent
- **Phase 2 ready** — coupons, returns, refunds, product variants, and structured attributes can be added without restructuring

---

## 9. Technical Benefits

### Database Design Quality

| Improvement | Detail |
|-------------|--------|
| **Normalization** | Vendors, brands, categories, products are properly separated entities |
| **Referential integrity** | All foreign keys use appropriate ON DELETE behavior (RESTRICT, CASCADE, SET NULL) |
| **Data types** | All monetary fields use `NUMERIC(12,2)` — never FLOAT |
| **Constraints** | 35+ CHECK constraints ensure data validity at the DB level |
| **Indexing** | 32 indexes on high-value query paths (vs. 6 before) |
| **Naming consistency** | All boolean flags use `is_` prefix; all timestamps use `_at` suffix |
| **UUID primary keys** | All tables use UUID PKs for Supabase compatibility |

### Query Performance

| Index Category | Count | Examples |
|---------------|-------|---------|
| Product lookups | 8 | SKU, slug, category, brand, vendor, type, active, full-text search |
| Order lookups | 5 | order_number, user, status, payment_status, placed_at |
| Payment lookups | 4 | order_id, status, UTR number, verification status |
| Audit lookups | 3 | entity (composite), user, created_at |
| Other | 12 | Shipments, reviews, addresses, categories, carts, inventory |

### Full-Text Search

```sql
CREATE INDEX idx_products_fts ON products
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

Enables fast product search across name and description using PostgreSQL's built-in GIN trigram index.

---

## 10. Security Improvements

### Row Level Security (RLS) Requirements Documented

| Customer Can | Customer Cannot |
|-------------|----------------|
| Read/update own profile | Access other customers' data |
| Manage own addresses | Update product prices |
| Manage own cart and wishlist | Modify inventory |
| View own orders and payments | Verify/reject payments |
| Submit UTR for own payments | Change order statuses |
| Write reviews for purchased products | Access admin analytics |
| View approved reviews | View audit logs |

### Admin Access

- All admin users access data through the Express backend using the Supabase service role key
- The backend enforces authorization via Clerk JWT + RBAC middleware
- Audit logs track all admin actions with IP address and user agent

### Separation of Auth Concerns

| Before | After |
|--------|-------|
| `customers` table with direct email/phone (no auth) | Supabase Auth (`auth.users`) handles customer authentication |
| `users` table with Clerk IDs for admins | `admin_users` table with Clerk IDs for admins (preserved) |
| Single ambiguous auth model | Dual-auth: Supabase Auth for customers, Clerk for admins |

---

## 11. Enum / Status Value Changes

### Order Status

| Before | After | Reason |
|--------|-------|--------|
| `Pending Payment` | `PENDING` | Payment status is now a separate field |
| `Payment Verified` | *(removed)* | Handled by `payment_status = 'PAID'` |
| `Confirmed` | `CONFIRMED` | Standardized to SCREAMING_CASE |
| `Packed` | `PACKED` | Standardized |
| `Shipped` | `SHIPPED` | Standardized |
| `Delivered` | `DELIVERED` | Standardized |
| `Cancelled` | `CANCELLED` | Standardized |
| *(new)* | `PROCESSING` | Added for preparation stage |
| *(new)* | `RETURN_REQUESTED` | Added for return flow |
| *(new)* | `RETURNED` | Added for return flow |
| *(new)* | `REFUNDED` | Added for refund flow |

### Payment Status

| Before | After | Reason |
|--------|-------|--------|
| `Pending` | `PENDING` | Standardized |
| `Submitted` | `UNDER_REVIEW` | More descriptive of admin review state |
| `Verified` | `PAID` | Industry standard term |
| `Rejected` | `REJECTED` | Standardized |
| *(new)* | `FAILED` | Payment attempt failure |
| *(new)* | `REFUNDED` | Post-sale refund |

### New Enums Introduced

| Enum | Values | Used In |
|------|--------|---------|
| `product_type` | `PRODUCT`, `ACCESSORY`, `SPARE_PART` | `products` |
| `pricing_type` | `FIXED`, `QUOTE_REQUIRED` | `products` |
| `cart_status` | `ACTIVE`, `CONVERTED`, `ABANDONED` | `carts` |
| `payment_method` | `QR`, `UPI`, `BANK_TRANSFER`, `COD`, `GATEWAY` | `payments` |
| `verification_status` | `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED` | `payment_verifications` |
| `shipment_status` | `PENDING`, `PACKED`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED` | `shipments` |
| `document_type` | `DATASHEET`, `MANUAL`, `CERTIFICATE`, `CATALOG`, `OTHER` | `product_documents` |
| `account_type` | `CUSTOMER`, `ADMIN` | `profiles` |
| `address_type` | `SHIPPING`, `BILLING` | `order_addresses` |
| `inventory_transaction_type` | `STOCK_IN`, `STOCK_OUT`, `ORDER_RESERVED`, `ORDER_RELEASED`, `SALE`, `RETURN`, `DAMAGE`, `ADJUSTMENT` | `inventory_transactions` |

---

## 12. Indexing Improvements

### Before (6 indexes)

```
idx_products_slug       — products(slug)
idx_products_sku        — products(sku)
idx_products_brand_cat  — products(brand_id, category_id)
idx_products_fts        — products full-text search
idx_orders_customer     — orders(customer_id)
idx_orders_status       — orders(order_status, payment_status)
```

### After (32 indexes)

**Products (8):** sku, slug, category, brand, vendor, type, active, full-text search
**Orders (5):** order_number, user_id, status, payment_status, placed_at
**Order Items (2):** order_id, product_id
**Payments (2):** order_id, status
**Verifications (2):** utr_number, status
**Inventory (1):** product_id
**Inv. Transactions (2):** product_id, type
**Reviews (2):** product_id, user_id
**Addresses (1):** user_id
**Categories (2):** parent_id, slug
**Audit Logs (3):** (entity_type, entity_id) composite, user_id, created_at
**Shipments (2):** order_id, tracking_number
**Carts (2):** user_id, session_id
**Quote Requests (1):** user_id

---

## 13. Constraint Improvements

### New CHECK Constraints

| Constraint | Table | Purpose |
|-----------|-------|---------|
| `chk_pricing` | `products` | FIXED pricing requires non-null price; QUOTE_REQUIRED allows null |
| `price >= 0` | `products` | No negative prices |
| `compare_at_price >= 0` | `products` | No negative compare prices |
| `tax_rate >= 0` | `products` | No negative tax rates |
| `minimum_order_quantity > 0` | `products` | MOQ must be positive if set |
| `quantity >= 0` | `inventory` | Stock cannot be negative |
| `reserved_quantity >= 0` | `inventory` | Reservations cannot be negative |
| `quantity > 0` | `cart_items` | Cart items must have positive quantity |
| `rating BETWEEN 1 AND 5` | `reviews` | Valid rating range |
| `subtotal >= 0` | `orders` | No negative subtotals |
| `discount_amount >= 0` | `orders`, `order_items` | No negative discounts |
| `tax_amount >= 0` | `orders`, `order_items` | No negative tax |
| `shipping_amount >= 0` | `orders` | No negative shipping |
| `total_amount >= 0` | `orders`, `order_items` | No negative totals |
| `unit_price >= 0` | `order_items` | No negative unit prices |
| `amount >= 0` | `payments` | No negative payment amounts |
| `submitted_amount >= 0` | `payment_verifications` | No negative submissions |
| `quantity > 0` | `order_items`, `quote_request_items` | Positive quantities only |

### New UNIQUE Constraints

| Constraint | Table | Purpose |
|-----------|-------|---------|
| `uq_wishlist_product` | `wishlist_items(wishlist_id, product_id)` | No duplicate wishlist entries |
| `uq_user_product_review` | `reviews(user_id, product_id)` | One review per user per product |
| `UNIQUE(user_id)` | `wishlists` | One wishlist per customer |
| `UNIQUE(user_id)` | `profiles` | One profile per auth user |
| `UNIQUE(code)` | `vendors` | Unique vendor codes |

---

## 14. Data Integrity Safeguards

### Historical Data Protection

| Safeguard | Implementation | What It Prevents |
|-----------|---------------|-----------------|
| Order item snapshots | `product_name`, `sku`, `hsn_code`, `tax_rate` copied to `order_items` | Product changes corrupting order history |
| Order address snapshots | Full address copied to `order_addresses` | Customer address changes affecting historical orders |
| Soft deletion | `is_active = FALSE` instead of DELETE | Product deletion destroying order/review references |
| ON DELETE RESTRICT | On `orders.user_id`, `payments.order_id`, `shipments.order_id`, `invoices.order_id` | Accidental deletion of records with financial dependencies |
| ON DELETE SET NULL | On `order_items.product_id`, `products.parent_product_id` | Product removal preserves order and child product records |

### Foreign Key Delete Policies

| Policy | Count | Usage |
|--------|-------|-------|
| `RESTRICT` | 7 | Products→categories/brands/vendors, orders→profiles, payments→orders, shipments→orders, invoices→orders |
| `CASCADE` | 9 | Addresses, cart items, wishlist items, order items, order addresses, product images/docs, payment verifications, return items |
| `SET NULL` | 3 | Categories→parent, products→parent, order_items→product |

---

## 15. Impact on Existing Code

### Files That Will Need Updates During Implementation

| File | Changes Needed |
|------|---------------|
| `packages/constants/index.ts` | Update `Roles`, `OrderStatus`, `PaymentStatus` enum values; add new enums for product types, cart status, shipment status, etc. |
| `packages/types/index.ts` | Update Zod schemas for all modified tables; add new schemas for new tables |
| `apps/server/src/repositories/base.repository.ts` | Update table references (`users` → `admin_users`) |
| `apps/server/src/repositories/product.repository.ts` | Update to use new product fields |
| `apps/server/src/middlewares/auth.middleware.ts` | No changes needed (Clerk auth preserved) |
| `apps/server/src/middlewares/rbac.middleware.ts` | No changes needed (role values preserved) |
| `apps/server/src/routes/order.routes.ts` | Update for new order/payment structure |
| `apps/server/src/controllers/*` | Update DTOs for expanded table structures |

### Breaking Changes

| Change | Impact | Mitigation |
|--------|--------|-----------|
| `users` → `admin_users` | All queries referencing `users` table break | Find & replace in repository/service layer |
| `customers` → `profiles` | Customer queries break | New Supabase Auth integration needed |
| `payment_proofs` → `payments` + `payment_verifications` | Payment flow needs rewrite | Follow new UTR verification workflow |
| Order status values changed | Status comparisons break | Update `@galaxy/constants` |
| `product_variants` removed | Variant queries break | Products are now separate rows |

---

## 16. Migration Considerations

### Recommended Migration Order

```
1. Extensions (uuid-ossp, pg_trgm)
2. admin_users (rename from users)
3. vendors (new)
4. brands (modify)
5. categories (modify)
6. tax_rates (new)
7. products (major restructure)
8. product_images (modify)
9. product_documents (new, optional)
10. inventory (modify)
11. inventory_transactions (new)
12. profiles (new, with auth trigger)
13. user_addresses (new)
14. carts + cart_items (new)
15. wishlists + wishlist_items (new)
16. orders (restructure)
17. order_items (expand)
18. order_addresses (new)
19. payments (new)
20. payment_verifications (new)
21. shipments (new)
22. invoices (preserve)
23. reviews (new)
24. notifications (preserve)
25. audit_logs (expand from activity_logs)
26. quote_requests + items (new, optional)
27. All indexes
```

### Data Migration Notes

- If existing data exists in `users`, migrate to `admin_users`
- If existing data exists in `customers`, migrate to `profiles` (requires Supabase Auth user creation)
- If existing data exists in `payment_proofs`, migrate to `payments` + `payment_verifications`
- `activity_logs` data can be migrated to `audit_logs` with `metadata` → `new_values`

---

## 17. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Existing application code breaks | High | Schema changes are in docs only; code updates are a separate task |
| Data migration complexity | Medium | No production data exists yet (project is in early development) |
| Over-engineering | Low | Deliberately avoided enterprise patterns (RBAC, variants, multi-warehouse) |
| Under-engineering | Low | Schema is extensible — Phase 2 tables can be added without restructuring |
| Enum value mismatch | Medium | `@galaxy/constants` must be updated to match new values before deployment |

---

## 18. What Was NOT Changed

| Item | Status | Reason |
|------|--------|--------|
| Application source code | Unchanged | This was a schema-only task |
| `.env.example` | Unchanged | No new environment variables needed |
| Clerk authentication | Preserved | Existing admin auth works; no reason to change |
| `invoices` table | Preserved | Existing structure is adequate |
| `notifications` table | Preserved | Existing structure is adequate for MVP |
| Role values (`Owner`, `Manager`, `Staff`) | Preserved | Existing middleware depends on them |
| Supabase Storage upload flow | Preserved | Existing signed-URL approach is correct |
| API response envelope format | Preserved | Existing `{ success, message, data, meta }` is good |
| Monorepo structure | Preserved | pnpm workspaces + Turborepo is fine |

---

## Appendix A: Complete Table List

| # | Table | Status | Phase |
|---|-------|--------|-------|
| 1 | `admin_users` | Renamed from `users` | MVP |
| 2 | `vendors` | **NEW** | MVP |
| 3 | `brands` | Modified | MVP |
| 4 | `categories` | Modified | MVP |
| 5 | `tax_rates` | **NEW** | MVP |
| 6 | `products` | Major expansion | MVP |
| 7 | `product_images` | Modified | MVP |
| 8 | `product_documents` | **NEW** | Optional MVP |
| 9 | `inventory` | Modified | MVP |
| 10 | `inventory_transactions` | **NEW** | MVP |
| 11 | `profiles` | **NEW** (replaces `customers`) | MVP |
| 12 | `user_addresses` | **NEW** (replaces `addresses`) | MVP |
| 13 | `carts` | **NEW** | MVP |
| 14 | `cart_items` | **NEW** | MVP |
| 15 | `wishlists` | **NEW** | MVP |
| 16 | `wishlist_items` | **NEW** | MVP |
| 17 | `orders` | Major restructure | MVP |
| 18 | `order_items` | Expanded (snapshots) | MVP |
| 19 | `order_addresses` | **NEW** | MVP |
| 20 | `payments` | **NEW** (replaces `payment_proofs`) | MVP |
| 21 | `payment_verifications` | **NEW** | MVP |
| 22 | `shipments` | **NEW** | MVP |
| 23 | `invoices` | Preserved | MVP |
| 24 | `reviews` | **NEW** | MVP |
| 25 | `notifications` | Preserved | MVP |
| 26 | `audit_logs` | **NEW** (replaces `activity_logs`) | MVP |
| 27 | `quote_requests` | **NEW** | Optional MVP |
| 28 | `quote_request_items` | **NEW** | Optional MVP |

---

## Appendix B: Removed / Deferred Tables

| Table | Action | Reason |
|-------|--------|--------|
| `product_variants` | Deferred to Phase 2 | Catalog items are distinct products, not variants |
| `customers` | Replaced by `profiles` | Supabase Auth integration |
| `addresses` | Replaced by `user_addresses` | Expanded fields, new naming |
| `payment_proofs` | Replaced by `payments` + `payment_verifications` | Proper payment lifecycle |
| `activity_logs` | Replaced by `audit_logs` | Expanded with before/after values |

---

> **Document Status:** Final
>
> **Review Date:** 2026-08-08
>
> **Next Steps:** Update `@galaxy/constants` and `@galaxy/types` packages to align with new schema, then run Supabase migrations.
