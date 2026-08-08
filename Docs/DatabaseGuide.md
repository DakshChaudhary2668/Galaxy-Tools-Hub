# Galaxy Tools Hub — Database Architecture & Implementation Guide

> **Document Status:** READY FOR REVIEW
>
> **Last Updated:** 2026-08-08
>
> **Purpose:** Definitive database design specification for the Galaxy Tools Hub e-commerce platform.
> This document is the single source of truth for all Supabase PostgreSQL schema decisions.
> Another developer must be able to implement the complete database from this guide alone.

---

## Table of Contents

1. [Database Architecture Overview](#1-database-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Business Model Assumptions](#3-business-model-assumptions)
4. [User & Authentication Model](#4-user--authentication-model)
5. [Customer Database](#5-customer-database)
6. [Vendor & Brand Architecture](#6-vendor--brand-architecture)
7. [Category Architecture](#7-category-architecture)
8. [Product Architecture](#8-product-architecture)
9. [Product Pricing](#9-product-pricing)
10. [Product Specifications](#10-product-specifications)
11. [Product Media & Documents](#11-product-media--documents)
12. [Inventory Architecture](#12-inventory-architecture)
13. [Cart & Wishlist](#13-cart--wishlist)
14. [Order Architecture](#14-order-architecture)
15. [Payment Architecture](#15-payment-architecture)
16. [UTR Verification](#16-utr-verification)
17. [GST / HSN / Tax](#17-gst--hsn--tax)
18. [Shipping & Tracking](#18-shipping--tracking)
19. [Reviews](#19-reviews)
20. [Coupons / Offers](#20-coupons--offers)
21. [Returns & Refunds](#21-returns--refunds)
22. [Admin Architecture](#22-admin-architecture)
23. [Audit Logging](#23-audit-logging)
24. [Analytics](#24-analytics)
25. [Supabase Storage](#25-supabase-storage)
26. [RLS / Security](#26-rls--security)
27. [Foreign Keys & Delete Policies](#27-foreign-keys--delete-policies)
28. [Indexing](#28-indexing)
29. [Constraints](#29-constraints)
30. [ER Diagram](#30-er-diagram)
31. [Table-by-Table Data Dictionary](#31-table-by-table-data-dictionary)
32. [Enum / Controlled Value Registry](#32-enum--controlled-value-registry)
33. [MVP vs Phase 2](#33-mvp-vs-phase-2)
34. [Open Business Decisions](#34-open-business-decisions)
35. [Implementation Roadmap](#35-implementation-roadmap)
36. [Supabase Migration Plan](#36-supabase-migration-plan)

---

## 1. Database Architecture Overview

Galaxy Tools Hub is a professional B2B/B2C e-commerce website for industrial, measuring, and testing tools and equipment. The platform acts as a **reseller/dealer**, sourcing products from vendor/dealer catalogs (G-Tech, Meco, HTC) containing approximately 500 combined line items.

### Core Design Principles

| Principle | Application |
|---|---|
| **Dealer/Reseller Model** | Galaxy Tools Hub SKU ≠ Vendor Model Number ≠ Brand ≠ Vendor/Supplier |
| **Historical Integrity** | Orders, payments, and addresses are snapshotted — never depend on mutable product/customer data |
| **Soft Deletion** | Catalog entities use `is_active` flags; physical deletion is avoided where historical relationships exist |
| **Separation of Concerns** | Payment status ≠ Order status ≠ Fulfillment status |
| **Database-Level Integrity** | CHECK constraints, NOT NULL, and UNIQUE enforced at the DB level — not only in frontend |
| **MVP Pragmatism** | No enterprise RBAC, no variant engine, no normalized attribute system, no multi-warehouse |

### SKU Model

```
Galaxy Tools Hub SKU:    GTH-GTECH-GT91-001
                         ┬── ┬──── ┬──── ┬──
                         │   │     │     └── Sequence number
                         │   │     └──────── Vendor model number
                         │   └────────────── Brand code
                         └────────────────── Galaxy Tools Hub prefix

Brand:                   G-Tech
Source Vendor:           G-Tech distributor/vendor
Source Model No:         GT91 TRMS
```

> **Critical:** Vendor model numbers are NOT assumed globally unique. Only Galaxy Tools Hub SKUs are unique.

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| **Database** | Supabase PostgreSQL 15+ |
| **Authentication (Customers)** | Supabase Auth (`auth.users`) |
| **Authentication (Admin)** | Clerk (existing implementation) |
| **Storage** | Supabase Storage |
| **Backend** | Express.js (apps/server) — Clean Architecture |
| **Frontend** | Next.js 15 App Router (apps/web) |
| **Monorepo** | pnpm workspaces + Turborepo |

### Required PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUIDv4 primary keys
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram matching for full-text search
```

---

## 3. Business Model Assumptions

1. Galaxy Tools Hub is a **reseller/dealer**, not a manufacturer.
2. The product catalog originates from **three vendor PDF catalogs**: G-Tech, Meco, HTC.
3. **Brand** and **Vendor/Supplier** are separate concepts (a vendor can supply multiple brands).
4. The internal team consists of **1 main admin + 2 partners** — there is no large organization.
5. For MVP, all admin users have equal operational access. No complex role hierarchy is needed.
6. Products in the vendor PDFs with specification variations (e.g., GT8000 Models A/B/C) are treated as **separate products** for MVP, not as variants.
7. Some products require a **quote** instead of fixed pricing (`QUOTE_REQUIRED`).
8. Payment verification via **UTR** is a core business flow.
9. **GST/HSN** codes are first-class product attributes sourced from the vendor catalogs.

---

## 4. User & Authentication Model

### Dual Authentication Architecture

The project uses a **split authentication model**:

| User Type | Auth Provider | Reason |
|---|---|---|
| **Customers** | Supabase Auth (`auth.users`) | Self-service registration, customer-facing flows |
| **Admin/Internal** | Clerk | Already implemented; admin dashboard auth via `@clerk/express` |

> **Existing Code Conflict:** The current codebase (`schema.sql`, `constants/index.ts`, `rbac.middleware.ts`) uses Clerk with `Owner`, `Manager`, `Staff` roles for admin users. The specification calls for a simplified `CUSTOMER | ADMIN` model. This guide defines the **target architecture** below while documenting the existing state.

### `profiles` — Customer Profiles (MVP)

Links to `auth.users` for customer accounts authenticated via Supabase Auth.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `user_id` | UUID | NO | — | FK → `auth.users.id`, UNIQUE |
| `full_name` | TEXT | NO | — | |
| `email` | TEXT | NO | — | |
| `phone` | TEXT | YES | — | |
| `account_type` | TEXT | NO | `'CUSTOMER'` | CHECK: `CUSTOMER`, `ADMIN` |
| `avatar_url` | TEXT | YES | — | |
| `is_active` | BOOLEAN | NO | `TRUE` | |
| `last_login_at` | TIMESTAMPTZ | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Notes:**
- One `auth.users` row maps to exactly one `profiles` row.
- Do NOT store passwords in this table — authentication is handled by Supabase Auth.
- The `account_type` field enables a simple CUSTOMER vs ADMIN distinction at the application profile level.
- A future `is_super_admin` BOOLEAN may be added if the main admin requires unique permissions, but is NOT required for MVP.

### `admin_users` — Internal Admin Users (MVP)

Preserves the existing Clerk-based admin authentication. This table corresponds to the existing `users` table in `schema.sql`.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `clerk_user_id` | VARCHAR(255) | NO | — | UNIQUE |
| `name` | VARCHAR(255) | NO | — | |
| `email` | VARCHAR(255) | NO | — | UNIQUE |
| `role` | VARCHAR(50) | NO | — | CHECK: `Owner`, `Manager`, `Staff` |
| `status` | VARCHAR(50) | NO | `'Active'` | CHECK: `Active`, `Inactive`, `Suspended` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Notes:**
- Renamed from `users` to `admin_users` for clarity, avoiding collision with customer `profiles`.
- The existing role system (`Owner`, `Manager`, `Staff`) is preserved because the `rbac.middleware.ts` and `@galaxy/constants` package already implement it.
- For MVP, all roles effectively have the same dashboard access. The role field exists for future differentiation if needed.
- Do NOT create separate `roles`, `permissions`, `role_permissions`, `user_roles` tables.

> **Conflict Resolution:** The existing code has `users` with Clerk auth + roles. The specification wants `profiles` with Supabase Auth + `CUSTOMER | ADMIN`. Both are preserved: `admin_users` for Clerk-authenticated admins, `profiles` for Supabase Auth customer accounts. Documented under [Open Business Decisions](#34-open-business-decisions).

---

## 5. Customer Database

### `user_addresses` — Customer Addresses (MVP)

Customers can maintain multiple addresses. Orders snapshot addresses separately.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `user_id` | UUID | NO | — | FK → `profiles.id` |
| `address_label` | TEXT | YES | — | e.g., "Home", "Office" |
| `full_name` | TEXT | NO | — | |
| `phone` | TEXT | NO | — | |
| `address_line_1` | TEXT | NO | — | |
| `address_line_2` | TEXT | YES | — | |
| `landmark` | TEXT | YES | — | |
| `city` | TEXT | NO | — | |
| `state` | TEXT | NO | — | |
| `postal_code` | TEXT | NO | — | |
| `country` | TEXT | NO | `'India'` | |
| `is_default` | BOOLEAN | NO | `FALSE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Relationship:** `profiles` 1 ──── N `user_addresses`

---

## 6. Vendor & Brand Architecture

### `vendors` — Supplier/Vendor Source (MVP)

Represents the supplier/vendor/dealer source from which the product catalog originates. This table does NOT exist in the current `schema.sql` and must be created.

| Column | Type | Nullable | Default | Constraints |
|---|- --|------|---|
| `id`   | UUID | NO | `uuid_generate_v4()` | PK |
| `name` | TEXT | NO | — | |
| `code` | TEXT | NO | — | UNIQUE (e.g., `GTECH`, `MECO`, `HTC`) |
| `description` | TEXT | YES | — | |
| `contact_name` | TEXT | YES | — | |
| `email` | TEXT | YES | — | |
| `phone` | TEXT | YES | — | |
| `website` | TEXT | YES | — | |
| `address` | TEXT | YES | — | |
| `is_active` | BOOLEAN | NO | `TRUE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Initial vendor data (from PDF catalogs):**

| Vendor Name | Code |
|---|---|
| G-Tech | `GTECH` |
| Meco | `MECO` |
| HTC | `HTC` |

### `brands` — Product Brands (MVP)

Brand and vendor MUST remain separate concepts. A vendor may supply products from multiple brands, and a brand may be supplied by multiple vendors.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `name` | VARCHAR(255) | NO | — | |
| `slug` | VARCHAR(255) | NO | — | UNIQUE |
| `description` | TEXT | YES | — | |
| `logo_url` | TEXT | YES | — | |
| `website` | TEXT | YES | — | |
| `is_active` | BOOLEAN | NO | `TRUE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

> **Migration Note:** The existing `brands` table uses `active` instead of `is_active`. Rename to `is_active` for consistency across all tables.

---

## 7. Category Architecture

### `categories` — Hierarchical Product Categories (MVP)

Self-referencing hierarchy via `parent_id`. Do not hardcode vendor names into category names.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `parent_id` | UUID | YES | — | FK → `categories.id` ON DELETE SET NULL |
| `name` | VARCHAR(255) | NO | — | |
| `slug` | VARCHAR(255) | NO | — | UNIQUE |
| `description` | TEXT | YES | — | |
| `image_url` | TEXT | YES | — | |
| `sort_order` | INTEGER | NO | `0` | |
| `is_active` | BOOLEAN | NO | `TRUE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Example hierarchy:**

```
Measuring Instruments
├── Multimeters
├── Clamp Meters
├── Anemometers
├── Insulation Testers
└── Other Instruments

Safety & Detection
├── Gas Detectors
├── Sound Level Meters
└── Lux Meters
```

---

## 8. Product Architecture

### `products` — Central Product Catalog (MVP)

This is the central catalog table. Every purchasable item, accessory, or spare part is a product.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `category_id` | UUID | NO | — | FK → `categories.id` ON DELETE RESTRICT |
| `brand_id` | UUID | NO | — | FK → `brands.id` ON DELETE RESTRICT |
| `source_vendor_id` | UUID | NO | — | FK → `vendors.id` ON DELETE RESTRICT |
| `parent_product_id` | UUID | YES | — | FK → `products.id` ON DELETE SET NULL |
| `sku` | TEXT | NO | — | UNIQUE |
| `source_model_no` | TEXT | NO | — | Vendor's own model number |
| `name` | TEXT | NO | — | |
| `slug` | TEXT | NO | — | UNIQUE |
| `product_type` | TEXT | NO | `'PRODUCT'` | CHECK: `PRODUCT`, `ACCESSORY`, `SPARE_PART` |
| `short_description` | TEXT | YES | — | |
| `description` | TEXT | YES | — | |
| `specifications` | JSONB | YES | `'{}'::jsonb` | Freeform technical specs |
| `pricing_type` | TEXT | NO | `'FIXED'` | CHECK: `FIXED`, `QUOTE_REQUIRED` |
| `price` | NUMERIC(12,2) | YES | — | CHECK: `price >= 0` when NOT NULL |
| `compare_at_price` | NUMERIC(12,2) | YES | — | CHECK: `compare_at_price >= 0` |
| `hsn_code` | TEXT | NO | — | GST HSN code |
| `tax_rate` | NUMERIC(5,2) | NO | `18.00` | CHECK: `tax_rate >= 0` |
| `minimum_order_quantity` | INTEGER | YES | — | CHECK: `minimum_order_quantity > 0` when NOT NULL |
| `weight` | NUMERIC(8,2) | YES | — | |
| `dimensions` | VARCHAR(100) | YES | — | |
| `seo_title` | VARCHAR(255) | YES | — | |
| `seo_description` | TEXT | YES | — | |
| `meta_keywords` | TEXT | YES | — | |
| `is_purchasable` | BOOLEAN | NO | `TRUE` | Controls checkout eligibility |
| `is_featured` | BOOLEAN | NO | `FALSE` | |
| `is_active` | BOOLEAN | NO | `TRUE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Key changes from existing `schema.sql`:**

| Aspect | Old (schema.sql) | New |
|---|---|---|
| Vendor tracking | None | `source_vendor_id` FK → `vendors` |
| Model number | None | `source_model_no` |
| Product type | None | `product_type` (PRODUCT / ACCESSORY / SPARE_PART) |
| Parent product | None | `parent_product_id` for accessories/spares |
| Pricing model | `price` always required | `pricing_type` + nullable `price` |
| Quote support | None | `QUOTE_REQUIRED` pricing type |
| Purchasable flag | None | `is_purchasable` |
| Specifications | None | `specifications` JSONB |
| Tax | `gst_percentage` hardcoded default | `tax_rate` configurable per product |
| Compare price | `mrp` | `compare_at_price` (clearer naming) |

### Product Type Rules

| Type | Description | Independently Purchasable? |
|---|---|---|
| `PRODUCT` | Standard catalog product | Yes |
| `ACCESSORY` | Accessory related to a parent product | Yes |
| `SPARE_PART` | Spare/replacement part for a parent product | Yes |

All types are independent products. The `parent_product_id` establishes a loose relationship, not a hard dependency.

**Example:**
```
AVM08 Anemometer (PRODUCT, parent_product_id = NULL)
    └── Spare Probe (SPARE_PART, parent_product_id = AVM08.id)
```

### Product Variants — NOT Required for MVP

The existing `product_variants` table in `schema.sql` is **demoted to Phase 2**. Reason: The GT8000-style products in the PDFs have distinct model/specification/price/HSN combinations. For MVP, they are separate products:

```
GT8000 Gas Detector - Model A  →  products row 1, SKU: GTH-GTECH-GT8000A-001
GT8000 Gas Detector - Model B  →  products row 2, SKU: GTH-GTECH-GT8000B-001
GT8000 Gas Detector - Model C  →  products row 3, SKU: GTH-GTECH-GT8000C-001
```

The schema keeps `parent_product_id` to make future variant introduction non-breaking.

---

## 9. Product Pricing

### Pricing Rules

| `pricing_type` | `price` | `is_purchasable` | Behavior |
|---|---|---|---|
| `FIXED` | Required (NOT NULL, >= 0) | `TRUE` | Normal add-to-cart → checkout |
| `QUOTE_REQUIRED` | NULL allowed | `FALSE` | "Request Quote" button; cannot enter checkout |

> **Critical:** Do NOT represent "On Request" pricing as `price = 0`. Use `pricing_type = 'QUOTE_REQUIRED'` with `price = NULL`.

### Check Constraint

```sql
CONSTRAINT chk_pricing CHECK (
  (pricing_type = 'FIXED' AND price IS NOT NULL) OR
  (pricing_type = 'QUOTE_REQUIRED')
)
```

### Quote Request Flow (Optional MVP)

If the project requires a quote flow, the following lightweight structure supports it:

#### `quote_requests` (OPTIONAL MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `user_id` | UUID | NO | — | FK → `profiles.id` |
| `status` | TEXT | NO | `'PENDING'` | CHECK: `PENDING`, `RESPONDED`, `CLOSED` |
| `customer_notes` | TEXT | YES | — | |
| `admin_notes` | TEXT | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

#### `quote_request_items` (OPTIONAL MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `quote_request_id` | UUID | NO | — | FK → `quote_requests.id` ON DELETE CASCADE |
| `product_id` | UUID | NO | — | FK → `products.id` |
| `quantity` | INTEGER | NO | `1` | CHECK: `quantity > 0` |
| `quoted_price` | NUMERIC(12,2) | YES | — | Admin-provided quote |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## 10. Product Specifications

### MVP: JSONB Field

The vendor PDF catalogs contain specifications embedded in free-text descriptions (range, accuracy, resolution, jaw opening, voltage, current, frequency, temperature, dimensions, etc.).

For MVP, the `products.specifications` JSONB column is sufficient:

```json
{
  "range": "0-150 mm",
  "accuracy": "±0.02 mm",
  "resolution": "0.01 mm",
  "operating_temperature": "0°C - 40°C",
  "jaw_opening": "55mm",
  "display": "LCD with backlight"
}
```

### Phase 2: Structured Attribute System

Future tables for category-specific attribute catalogs:

| Table | Purpose | Phase |
|---|---|---|
| `attributes` | Define attribute names per category | Phase 2 |
| `attribute_values` | Allowed values per attribute | Phase 2 |
| `product_attributes` | Map products to attribute values | Phase 2 |

These are NOT MVP dependencies.

---

## 11. Product Media & Documents

### `product_images` — Product Image Metadata (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `product_id` | UUID | NO | — | FK → `products.id` ON DELETE CASCADE |
| `storage_path` | TEXT | NO | — | Path in Supabase Storage |
| `public_url` | TEXT | YES | — | Generated public URL |
| `alt_text` | TEXT | YES | — | Accessibility text |
| `sort_order` | INTEGER | NO | `0` | Display ordering |
| `is_primary` | BOOLEAN | NO | `FALSE` | Primary display image |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

> **Migration Note:** The existing `product_images` table uses `image_url` and `display_order`. Rename to `storage_path`/`public_url` and `sort_order` for consistency. Add `is_primary` and `alt_text`.

### `product_documents` — Product Documents (OPTIONAL MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `product_id` | UUID | NO | — | FK → `products.id` ON DELETE CASCADE |
| `document_type` | TEXT | NO | — | CHECK: `DATASHEET`, `MANUAL`, `CERTIFICATE`, `CATALOG`, `OTHER` |
| `file_name` | TEXT | NO | — | |
| `storage_path` | TEXT | NO | — | Path in Supabase Storage |
| `file_size` | INTEGER | YES | — | Bytes |
| `mime_type` | TEXT | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

> **Note:** The vendor PDFs establish vendor-level certifications but do NOT confirm that every individual product has its own datasheet/manual. Document availability is optional. See [Open Business Decisions](#34-open-business-decisions).

---

## 12. Inventory Architecture

### `inventory` — Stock Levels (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `product_id` | UUID | NO | — | FK → `products.id` ON DELETE CASCADE, UNIQUE |
| `quantity` | INTEGER | NO | `0` | CHECK: `quantity >= 0` |
| `reserved_quantity` | INTEGER | NO | `0` | CHECK: `reserved_quantity >= 0` |
| `reorder_level` | INTEGER | YES | — | Low-stock alert threshold |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Available stock calculation:**

```
available_stock = quantity - reserved_quantity
```

> **Migration Note:** The existing schema uses a `GENERATED ALWAYS AS` stored column for `available_stock`. This can be retained for query convenience, but the specification recommends computing it at query time to avoid complications with partial updates. If retained as a generated column, it is acceptable.

### `inventory_transactions` — Stock History & Audit (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `product_id` | UUID | NO | — | FK → `products.id` |
| `transaction_type` | TEXT | NO | — | CHECK (see enum registry) |
| `quantity` | INTEGER | NO | — | Positive or negative depending on type |
| `reference_type` | TEXT | YES | — | e.g., `ORDER`, `RETURN`, `MANUAL` |
| `reference_id` | UUID | YES | — | FK to relevant entity |
| `notes` | TEXT | YES | — | |
| `created_by` | UUID | YES | — | FK → `admin_users.id` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

### Inventory Reservation Lifecycle

```
1. Checkout:   Order placed → reserved_quantity += order quantity
2. Verification: Payment verified → Order CONFIRMED
3. Fulfillment:  Shipped → quantity -= reserved amount, reserved_quantity -= reserved amount
4. Cancellation: Order cancelled → reserved_quantity -= reserved amount (stock released)
```

---

## 13. Cart & Wishlist

### `carts` — Shopping Carts (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `user_id` | UUID | YES | — | FK → `profiles.id` |
| `session_id` | TEXT | YES | — | For guest checkout if supported |
| `status` | TEXT | NO | `'ACTIVE'` | CHECK: `ACTIVE`, `CONVERTED`, `ABANDONED` |
| `expires_at` | TIMESTAMPTZ | YES | — | Cart expiration for cleanup |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

### `cart_items` — Cart Line Items (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `cart_id` | UUID | NO | — | FK → `carts.id` ON DELETE CASCADE |
| `product_id` | UUID | NO | — | FK → `products.id` |
| `quantity` | INTEGER | NO | `1` | CHECK: `quantity > 0` |
| `unit_price` | NUMERIC(12,2) | NO | — | Price at time of adding to cart |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

### `wishlists` — Customer Wishlists (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `user_id` | UUID | NO | — | FK → `profiles.id`, UNIQUE |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

### `wishlist_items` — Wishlist Products (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `wishlist_id` | UUID | NO | — | FK → `wishlists.id` ON DELETE CASCADE |
| `product_id` | UUID | NO | — | FK → `products.id` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Constraint:** `UNIQUE(wishlist_id, product_id)`

---

## 14. Order Architecture

### `orders` — Order Records (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `order_number` | VARCHAR(50) | NO | — | UNIQUE |
| `user_id` | UUID | NO | — | FK → `profiles.id` ON DELETE RESTRICT |
| `status` | TEXT | NO | `'PENDING'` | CHECK (see enum registry) |
| `payment_status` | TEXT | NO | `'PENDING'` | CHECK (see enum registry) |
| `fulfillment_status` | TEXT | YES | — | Optional separate tracking |
| `subtotal` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `discount_amount` | NUMERIC(12,2) | NO | `0.00` | CHECK: `>= 0` |
| `tax_amount` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `shipping_amount` | NUMERIC(12,2) | NO | `0.00` | CHECK: `>= 0` |
| `total_amount` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `currency` | TEXT | NO | `'INR'` | |
| `coupon_id` | UUID | YES | — | FK → `coupons.id` if coupons are implemented |
| `customer_notes` | TEXT | YES | — | |
| `admin_notes` | TEXT | YES | — | |
| `placed_at` | TIMESTAMPTZ | YES | — | When order was placed |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

> **Critical:** All monetary fields use `NUMERIC(12,2)`. **Never use FLOAT** for money.

### Order Status State Machine

```
PENDING ──→ CONFIRMED ──→ PROCESSING ──→ PACKED ──→ SHIPPED ──→ DELIVERED
   │                                                                 │
   ├──→ CANCELLED                                                    │
   │                                                    RETURN_REQUESTED
   │                                                         │
   │                                                    RETURNED
   │                                                         │
   │                                                    REFUNDED
```

> **Migration Note:** The existing `schema.sql` uses `Pending Payment`, `Payment Verified`, etc. The new specification uses `PENDING`, `CONFIRMED`, etc. with separate `payment_status`. The `@galaxy/constants` package must be updated accordingly during implementation.

### `order_items` — Order Line Items with Historical Snapshots (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `order_id` | UUID | NO | — | FK → `orders.id` ON DELETE CASCADE |
| `product_id` | UUID | YES | — | FK → `products.id` ON DELETE SET NULL |
| `product_name` | TEXT | NO | — | **Snapshot** |
| `sku` | TEXT | NO | — | **Snapshot** |
| `source_model_no` | TEXT | YES | — | **Snapshot** |
| `hsn_code` | TEXT | NO | — | **Snapshot** |
| `quantity` | INTEGER | NO | — | CHECK: `quantity > 0` |
| `unit_price` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `discount_amount` | NUMERIC(12,2) | NO | `0.00` | CHECK: `>= 0` |
| `tax_rate` | NUMERIC(5,2) | NO | — | **Snapshot** of tax rate at time of sale |
| `tax_amount` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `total_amount` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

> **Critical:** Even if the product later changes its name, SKU, HSN, price, or description, the order item must remain historically correct. Snapshot all relevant product information.

### `order_addresses` — Historical Address Snapshots (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `order_id` | UUID | NO | — | FK → `orders.id` ON DELETE CASCADE |
| `address_type` | TEXT | NO | — | CHECK: `SHIPPING`, `BILLING` |
| `full_name` | TEXT | NO | — | |
| `phone` | TEXT | NO | — | |
| `address_line_1` | TEXT | NO | — | |
| `address_line_2` | TEXT | YES | — | |
| `landmark` | TEXT | YES | — | |
| `city` | TEXT | NO | — | |
| `state` | TEXT | NO | — | |
| `postal_code` | TEXT | NO | — | |
| `country` | TEXT | NO | `'India'` | |

> **Critical:** Do NOT simply reference the customer's current address. If the customer moves, old orders must still show the original shipping/billing address.

---

## 15. Payment Architecture

### `payments` — Payment Records (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `order_id` | UUID | NO | — | FK → `orders.id` ON DELETE RESTRICT |
| `payment_method` | TEXT | NO | — | CHECK (see enum registry) |
| `status` | TEXT | NO | `'PENDING'` | CHECK (see enum registry) |
| `amount` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `currency` | TEXT | NO | `'INR'` | |
| `transaction_id` | TEXT | YES | — | External transaction reference |
| `gateway_reference` | TEXT | YES | — | Payment gateway ref |
| `paid_at` | TIMESTAMPTZ | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

### Payment Methods

| Value | Description |
|---|---|
| `QR` | QR code payment |
| `UPI` | UPI transfer |
| `BANK_TRANSFER` | Direct bank transfer |
| `COD` | Cash on delivery |
| `GATEWAY` | Online payment gateway |

### Payment Status vs Order Status

These are **independent state machines**:

| Payment Status | Order Status | Meaning |
|---|---|---|
| `PENDING` | `PENDING` | Awaiting payment |
| `UNDER_REVIEW` | `PENDING` | UTR submitted, admin reviewing |
| `PAID` | `CONFIRMED` | Payment verified, order confirmed |
| `FAILED` | `PENDING` or `CANCELLED` | Payment attempt failed |
| `REJECTED` | `PENDING` | UTR rejected, customer must retry |
| `REFUNDED` | `REFUNDED` | Refund processed |

---

## 16. UTR Verification

### `payment_verifications` — UTR Payment Verification (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `payment_id` | UUID | NO | — | FK → `payments.id` ON DELETE CASCADE |
| `utr_number` | TEXT | NO | — | |
| `submitted_amount` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `screenshot_path` | TEXT | YES | — | Supabase Storage path |
| `status` | TEXT | NO | `'PENDING'` | CHECK: `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED` |
| `rejection_reason` | TEXT | YES | — | |
| `verified_by` | UUID | YES | — | FK → `admin_users.id` |
| `verified_at` | TIMESTAMPTZ | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

### UTR Verification Flow

```
Customer submits payment
         ↓
    UTR submitted → status = PENDING
         ↓
    Admin picks up → status = UNDER_REVIEW
         ↓
    ┌─── Admin verifies ───┐
    │                       │
  VERIFIED                REJECTED
    │                       │
  payment.status = PAID   payment.status = REJECTED
    │                     (customer may retry)
  order.status = CONFIRMED
```

> **Critical:** Do NOT mark an order as paid merely because the customer submitted a UTR. Admin verification is mandatory.

> **Migration Note:** The existing `payment_proofs` table is a simpler version. It must be replaced by the split `payments` + `payment_verifications` structure for proper status tracking.

---

## 17. GST / HSN / Tax

### Product-Level Tax

HSN code is a first-class product field. Every catalog row from the vendor PDFs contains HSN information.

- `products.hsn_code` — HSN code per product
- `products.tax_rate` — Default tax rate per product (configurable, not hardcoded)

> **Critical:** GST must NOT be hardcoded to 18% in application code. The rate must be configurable per product and per tax rule.

### `tax_rates` — Configurable Tax Rates (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `name` | TEXT | NO | — | e.g., "GST 18%", "GST 12%" |
| `rate` | NUMERIC(5,2) | NO | — | CHECK: `rate >= 0` |
| `hsn_required` | BOOLEAN | NO | `FALSE` | |
| `effective_from` | DATE | NO | — | |
| `effective_to` | DATE | YES | — | NULL = currently active |
| `is_active` | BOOLEAN | NO | `TRUE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

### Order Tax Snapshot

At checkout, tax information is snapshotted onto `order_items`:

- `order_items.tax_rate` — Rate applied at time of sale
- `order_items.tax_amount` — Computed tax amount
- `order_items.hsn_code` — HSN code at time of sale

Do NOT calculate historical order tax using current tax tables.

### CGST/SGST/IGST Split

The GST split (Central/State/Integrated) is determined during checkout based on buyer/seller state comparison rules. Separate permanent columns for CGST/SGST/IGST are not created unless required by the invoicing implementation.

---

## 18. Shipping & Tracking

### `shipments` — Shipment Tracking (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `order_id` | UUID | NO | — | FK → `orders.id` ON DELETE RESTRICT |
| `courier_name` | TEXT | YES | — | |
| `tracking_number` | TEXT | YES | — | |
| `status` | TEXT | NO | `'PENDING'` | CHECK (see enum registry) |
| `shipped_at` | TIMESTAMPTZ | YES | — | |
| `estimated_delivery` | DATE | YES | — | |
| `delivered_at` | TIMESTAMPTZ | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

> **Design Note:** Schema allows multiple shipments per order (one-to-many) for future split-shipment support, though one-to-one is expected for MVP.

> **Migration Note:** The existing `schema.sql` stores `shipping_partner`, `tracking_number`, and `estimated_delivery` directly on the `orders` table. These should move to the dedicated `shipments` table.

---

## 19. Reviews

### `reviews` — Product Reviews (MVP)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `user_id` | UUID | NO | — | FK → `profiles.id` |
| `product_id` | UUID | NO | — | FK → `products.id` ON DELETE CASCADE |
| `order_item_id` | UUID | YES | — | FK → `order_items.id` |
| `rating` | INTEGER | NO | — | CHECK: `rating BETWEEN 1 AND 5` |
| `title` | TEXT | YES | — | |
| `comment` | TEXT | YES | — | |
| `is_verified_purchase` | BOOLEAN | NO | `FALSE` | |
| `is_approved` | BOOLEAN | NO | `FALSE` | Admin approval required |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Constraint:** `UNIQUE(user_id, product_id)` — one review per user per product.

> If business requirements later allow multiple reviews per user/product, adjust this constraint.

---

## 20. Coupons / Offers

### `coupons` — Discount Coupons (PHASE 2)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `code` | TEXT | NO | — | UNIQUE |
| `description` | TEXT | YES | — | |
| `discount_type` | TEXT | NO | — | CHECK: `PERCENTAGE`, `FIXED_AMOUNT` |
| `discount_value` | NUMERIC(12,2) | NO | — | CHECK: `> 0` |
| `minimum_order_amount` | NUMERIC(12,2) | YES | — | |
| `maximum_discount` | NUMERIC(12,2) | YES | — | |
| `usage_limit` | INTEGER | YES | — | NULL = unlimited |
| `usage_count` | INTEGER | NO | `0` | |
| `starts_at` | TIMESTAMPTZ | NO | — | |
| `expires_at` | TIMESTAMPTZ | NO | — | |
| `is_active` | BOOLEAN | NO | `TRUE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

### `coupon_usages` — Coupon Usage History (PHASE 2)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `coupon_id` | UUID | NO | — | FK → `coupons.id` |
| `user_id` | UUID | NO | — | FK → `profiles.id` |
| `order_id` | UUID | NO | — | FK → `orders.id` |
| `discount_amount` | NUMERIC(12,2) | NO | — | |
| `used_at` | TIMESTAMPTZ | NO | `NOW()` | |

> Do not rely only on `usage_count` — the `coupon_usages` table provides a full audit trail.

---

## 21. Returns & Refunds

### `returns` — Return Requests (PHASE 2)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `order_id` | UUID | NO | — | FK → `orders.id` |
| `user_id` | UUID | NO | — | FK → `profiles.id` |
| `reason` | TEXT | NO | — | |
| `status` | TEXT | NO | `'REQUESTED'` | CHECK (see enum registry) |
| `admin_notes` | TEXT | YES | — | |
| `requested_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `approved_at` | TIMESTAMPTZ | YES | — | |
| `completed_at` | TIMESTAMPTZ | YES | — | |

### `return_items` — Return Line Items (PHASE 2)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `return_id` | UUID | NO | — | FK → `returns.id` ON DELETE CASCADE |
| `order_item_id` | UUID | NO | — | FK → `order_items.id` |
| `quantity` | INTEGER | NO | — | CHECK: `quantity > 0` |
| `reason` | TEXT | YES | — | |

### `refunds` — Refund Records (PHASE 2)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `order_id` | UUID | NO | — | FK → `orders.id` |
| `payment_id` | UUID | NO | — | FK → `payments.id` |
| `amount` | NUMERIC(12,2) | NO | — | CHECK: `>= 0` |
| `refund_method` | TEXT | NO | — | |
| `status` | TEXT | NO | `'PENDING'` | CHECK (see enum registry) |
| `transaction_reference` | TEXT | YES | — | |
| `processed_at` | TIMESTAMPTZ | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## 22. Admin Architecture

### Team Structure

| Person | Count |
|---|---|
| Main Admin | 1 |
| Partners | 2 |
| **Total** | **3** |

### MVP Admin Access Model

All admin users have **full dashboard access**. There is no complex role hierarchy.

**Admin capabilities:**
- Manage products, categories, brands, vendors
- Manage inventory
- Manage orders, track orders
- Verify payments, verify UTR
- Manage customers
- Manage reviews
- Manage coupons/offers (if implemented)
- Manage shipping
- View analytics
- Manage catalog content
- View audit logs

### Do NOT Create

- `roles` table
- `permissions` table
- `role_permissions` table
- `user_roles` table

The existing `admin_users.role` field (`Owner`, `Manager`, `Staff`) from the Clerk-based auth is sufficient for any future differentiation.

### `invoices` — Existing Table (PRESERVED)

The existing `schema.sql` contains an `invoices` table. It is preserved as-is:

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `invoice_number` | VARCHAR(50) | NO | — | UNIQUE |
| `order_id` | UUID | NO | — | FK → `orders.id` ON DELETE RESTRICT, UNIQUE |
| `pdf_url` | TEXT | YES | — | Supabase Storage path |
| `issued_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## 23. Audit Logging

### `audit_logs` — Audit Trail (MVP)

Because all internal users have broad access, an audit log is critical.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `user_id` | UUID | YES | — | FK → `admin_users.id` |
| `action` | TEXT | NO | — | |
| `entity_type` | TEXT | NO | — | |
| `entity_id` | UUID | YES | — | |
| `old_values` | JSONB | YES | — | Previous state |
| `new_values` | JSONB | YES | — | New state |
| `ip_address` | INET | YES | — | |
| `user_agent` | TEXT | YES | — | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

**Critical audit actions:**

| Action | Why It Matters |
|---|---|
| `UPDATE_PRODUCT` | Track catalog changes |
| `UPDATE_PRICE` | Price manipulation detection |
| `UPDATE_INVENTORY` | Stock discrepancy tracking |
| `VERIFY_PAYMENT` | UTR verification accountability |
| `REJECT_PAYMENT` | Rejection accountability |
| `CHANGE_ORDER_STATUS` | Order lifecycle audit |
| `DELETE_PRODUCT` | Catalog removal tracking |
| `UPDATE_TAX_RATE` | Tax configuration changes |

> **Migration Note:** The existing `activity_logs` table is renamed to `audit_logs` with expanded fields (`old_values`, `new_values`, `ip_address`, `user_agent`). The existing `metadata` JSONB pattern is superseded by the more structured approach.

### `notifications` — Existing Table (PRESERVED)

The existing `notifications` table is preserved. It may be refactored in Phase 2 for user-specific notifications.

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | UUID | NO | `uuid_generate_v4()` | PK |
| `recipient_role` | VARCHAR(50) | YES | — | |
| `title` | VARCHAR(255) | NO | — | |
| `message` | TEXT | NO | — | |
| `read` | BOOLEAN | NO | `FALSE` | |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## 24. Analytics

Do NOT create a separate analytics database. The admin dashboard derives business metrics from existing tables:

| Metric | Source Tables |
|---|---|
| Revenue | `orders`, `order_items` |
| Order Count | `orders` |
| Average Order Value | `orders` |
| Top Products | `order_items` → `products` |
| Top Categories | `order_items` → `products` → `categories` |
| Low Stock Alerts | `inventory` |
| Pending Payments | `payments` (status = `PENDING`) |
| Pending UTR Verification | `payment_verifications` (status = `PENDING` or `UNDER_REVIEW`) |
| Order Status Distribution | `orders` (GROUP BY `status`) |
| Customer Count | `profiles` |
| Revenue by Brand | `order_items` → `products` → `brands` |
| Revenue by Vendor | `order_items` → `products` → `vendors` |

SQL views or materialized views should be created **only if** query performance eventually requires them.

---

## 25. Supabase Storage

### Bucket Structure

| Bucket | Purpose | Access |
|---|---|---|
| `product-images` | Product photos | Public read |
| `product-documents` | Datasheets, manuals, certificates | Authenticated read |
| `payment-screenshots` | UTR payment proof images | Admin only |
| `avatars` | Customer profile images | Owner read, public fallback |
| `brand-logos` | Brand logo images | Public read |
| `invoices` | Generated invoice PDFs | Admin + order owner |

### Storage Rules

- Database tables store `storage_path` — NOT raw file binaries.
- Actual files live in Supabase Storage buckets.
- Upload flow uses signed URLs (existing implementation in `storage.routes.ts`).
- Storage policies must align with corresponding database RLS policies.

---

## 26. RLS / Security

### Customer RLS Policies

| Table | Operation | Policy |
|---|---|---|
| `profiles` | SELECT | Own profile only (`auth.uid() = user_id`) |
| `profiles` | UPDATE | Own profile only |
| `user_addresses` | ALL | Own addresses only (`user_id` = own profile) |
| `carts` | ALL | Own cart only |
| `cart_items` | ALL | Items in own cart only |
| `wishlists` | ALL | Own wishlist only |
| `wishlist_items` | ALL | Items in own wishlist only |
| `orders` | SELECT | Own orders only |
| `order_items` | SELECT | Items in own orders only |
| `order_addresses` | SELECT | Addresses on own orders only |
| `payments` | SELECT | Payments on own orders only |
| `payment_verifications` | SELECT | Verifications on own payments only |
| `payment_verifications` | INSERT | For own payments only |
| `reviews` | INSERT | For products in own delivered orders |
| `reviews` | SELECT | Approved reviews only (all users) |
| `products` | SELECT | Active products only (`is_active = TRUE`) |
| `categories` | SELECT | Active categories only |
| `brands` | SELECT | Active brands only |

### Customer MUST NOT

- READ another customer's orders, payments, addresses, or cart
- UPDATE product prices or inventory
- VERIFY or REJECT payments
- CHANGE order statuses
- ACCESS admin analytics or audit logs

### Admin RLS Policies

Admin users (authenticated via Clerk on the Express backend) bypass Supabase RLS through the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`). All admin data access is through the backend API, which enforces authorization at the middleware level.

For MVP, all admin users (`Owner`, `Manager`, `Staff`) receive identical operational access.

---

## 27. Foreign Keys & Delete Policies

| FK Relationship | ON DELETE | Rationale |
|---|---|---|
| `profiles.user_id` → `auth.users.id` | CASCADE | Profile removed when auth account deleted |
| `user_addresses.user_id` → `profiles.id` | CASCADE | Addresses removed with profile |
| `products.category_id` → `categories.id` | RESTRICT | Cannot delete category with products |
| `products.brand_id` → `brands.id` | RESTRICT | Cannot delete brand with products |
| `products.source_vendor_id` → `vendors.id` | RESTRICT | Cannot delete vendor with products |
| `products.parent_product_id` → `products.id` | SET NULL | Parent deletion doesn't cascade |
| `product_images.product_id` → `products.id` | CASCADE | Images removed with product |
| `product_documents.product_id` → `products.id` | CASCADE | Documents removed with product |
| `inventory.product_id` → `products.id` | CASCADE | Inventory removed with product |
| `cart_items.cart_id` → `carts.id` | CASCADE | Items removed with cart |
| `wishlist_items.wishlist_id` → `wishlists.id` | CASCADE | Items removed with wishlist |
| `orders.user_id` → `profiles.id` | RESTRICT | Cannot delete customer with orders |
| `order_items.order_id` → `orders.id` | CASCADE | Items removed with order |
| `order_items.product_id` → `products.id` | SET NULL | Product deletion doesn't destroy order history |
| `order_addresses.order_id` → `orders.id` | CASCADE | Addresses removed with order |
| `payments.order_id` → `orders.id` | RESTRICT | Cannot delete order with payments |
| `payment_verifications.payment_id` → `payments.id` | CASCADE | Verification removed with payment |
| `shipments.order_id` → `orders.id` | RESTRICT | Cannot delete order with shipments |
| `reviews.product_id` → `products.id` | CASCADE | Reviews removed with product |
| `invoices.order_id` → `orders.id` | RESTRICT | Cannot delete order with invoices |

### Key Principles

1. **Orders are financial records** — never cascade-delete because a customer account is removed.
2. **Products in historical orders** — prefer `is_active = FALSE` for catalog removal over physical deletion.
3. **Categories with active products** — RESTRICT prevents orphaned products.

---

## 28. Indexing

### Recommended Indexes

```sql
-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_source_vendor_id ON products(source_vendor_id);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_fts ON products USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Orders
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Payments
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Payment Verifications
CREATE INDEX idx_payment_verifications_utr ON payment_verifications(utr_number);
CREATE INDEX idx_payment_verifications_status ON payment_verifications(status);

-- Inventory
CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- Reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- User Addresses
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);

-- Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Audit Logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Shipments
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
```

> Do not blindly index every column. The above are chosen based on expected query patterns (product browsing, order lookups, payment tracking, audit retrieval).

---

## 29. Constraints

### Unique Constraints

| Table | Column(s) | Scope |
|---|---|---|
| `profiles` | `user_id` | One profile per auth user |
| `products` | `sku` | Global SKU uniqueness |
| `products` | `slug` | URL-friendly unique slug |
| `brands` | `slug` | URL-friendly unique slug |
| `categories` | `slug` | URL-friendly unique slug |
| `vendors` | `code` | Unique vendor code |
| `orders` | `order_number` | Unique order number |
| `inventory` | `product_id` | One inventory record per product |
| `wishlists` | `user_id` | One wishlist per user |
| `wishlist_items` | `(wishlist_id, product_id)` | No duplicate wishlist entries |
| `reviews` | `(user_id, product_id)` | One review per user per product |
| `invoices` | `invoice_number` | Unique invoice number |
| `invoices` | `order_id` | One invoice per order |

### Check Constraints

```sql
-- Products
CHECK (price >= 0)
CHECK (compare_at_price >= 0)
CHECK (tax_rate >= 0)
CHECK (minimum_order_quantity > 0)  -- when NOT NULL
CHECK (product_type IN ('PRODUCT', 'ACCESSORY', 'SPARE_PART'))
CHECK (pricing_type IN ('FIXED', 'QUOTE_REQUIRED'))
CHECK ((pricing_type = 'FIXED' AND price IS NOT NULL) OR (pricing_type = 'QUOTE_REQUIRED'))

-- Inventory
CHECK (quantity >= 0)
CHECK (reserved_quantity >= 0)

-- Orders
CHECK (subtotal >= 0)
CHECK (discount_amount >= 0)
CHECK (tax_amount >= 0)
CHECK (shipping_amount >= 0)
CHECK (total_amount >= 0)

-- Order Items
CHECK (quantity > 0)
CHECK (unit_price >= 0)
CHECK (discount_amount >= 0)
CHECK (tax_amount >= 0)
CHECK (total_amount >= 0)

-- Cart Items
CHECK (quantity > 0)

-- Reviews
CHECK (rating BETWEEN 1 AND 5)

-- Payments
CHECK (amount >= 0)

-- Tax Rates
CHECK (rate >= 0)

-- Coupons
CHECK (discount_value > 0)
```

> **Principle:** Do not depend exclusively on frontend validation. These constraints protect data integrity at the database level.

---

## 30. ER Diagram

```mermaid
erDiagram
    %% Authentication & Profiles
    AUTH_USERS ||--|| PROFILES : "1:1"
    PROFILES ||--o{ USER_ADDRESSES : "1:N"
    PROFILES ||--o{ CARTS : "1:N"
    PROFILES ||--o| WISHLISTS : "1:1"
    PROFILES ||--o{ ORDERS : "1:N"
    PROFILES ||--o{ REVIEWS : "1:N"

    %% Products
    VENDORS ||--o{ PRODUCTS : "1:N"
    BRANDS ||--o{ PRODUCTS : "1:N"
    CATEGORIES ||--o{ PRODUCTS : "1:N"
    CATEGORIES ||--o{ CATEGORIES : "self-ref"
    PRODUCTS ||--o{ PRODUCTS : "parent-child"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "1:N"
    PRODUCTS ||--o{ PRODUCT_DOCUMENTS : "1:N"
    PRODUCTS ||--|| INVENTORY : "1:1"
    PRODUCTS ||--o{ INVENTORY_TRANSACTIONS : "1:N"
    PRODUCTS ||--o{ REVIEWS : "1:N"

    %% Cart
    CARTS ||--o{ CART_ITEMS : "1:N"
    PRODUCTS ||--o{ CART_ITEMS : "1:N"

    %% Wishlist
    WISHLISTS ||--o{ WISHLIST_ITEMS : "1:N"
    PRODUCTS ||--o{ WISHLIST_ITEMS : "1:N"

    %% Orders
    ORDERS ||--o{ ORDER_ITEMS : "1:N"
    ORDERS ||--o{ ORDER_ADDRESSES : "1:N"
    ORDERS ||--o{ PAYMENTS : "1:N"
    ORDERS ||--o| SHIPMENTS : "1:N"
    ORDERS ||--o| INVOICES : "1:1"
    PRODUCTS ||--o{ ORDER_ITEMS : "1:N"

    %% Payments
    PAYMENTS ||--o{ PAYMENT_VERIFICATIONS : "1:N"

    %% Admin
    ADMIN_USERS ||--o{ AUDIT_LOGS : "1:N"
    ADMIN_USERS ||--o{ PAYMENT_VERIFICATIONS : "verified_by"

    %% Entities
    PROFILES {
        uuid id PK
        uuid user_id FK
        text full_name
        text email
        text account_type
        boolean is_active
    }

    ADMIN_USERS {
        uuid id PK
        varchar clerk_user_id UK
        varchar name
        varchar email UK
        varchar role
        varchar status
    }

    VENDORS {
        uuid id PK
        text name
        text code UK
        boolean is_active
    }

    BRANDS {
        uuid id PK
        varchar name
        varchar slug UK
        boolean is_active
    }

    CATEGORIES {
        uuid id PK
        uuid parent_id FK
        varchar name
        varchar slug UK
        integer sort_order
        boolean is_active
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        uuid brand_id FK
        uuid source_vendor_id FK
        uuid parent_product_id FK
        text sku UK
        text source_model_no
        text name
        text slug UK
        text product_type
        text pricing_type
        numeric price
        text hsn_code
        numeric tax_rate
        jsonb specifications
        boolean is_purchasable
        boolean is_active
    }

    INVENTORY {
        uuid id PK
        uuid product_id FK_UK
        integer quantity
        integer reserved_quantity
        integer reorder_level
    }

    ORDERS {
        uuid id PK
        varchar order_number UK
        uuid user_id FK
        text status
        text payment_status
        numeric total_amount
        text currency
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        text product_name
        text sku
        text hsn_code
        numeric unit_price
        numeric tax_rate
        numeric tax_amount
        numeric total_amount
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        text payment_method
        text status
        numeric amount
    }

    PAYMENT_VERIFICATIONS {
        uuid id PK
        uuid payment_id FK
        text utr_number
        text status
        uuid verified_by FK
    }

    SHIPMENTS {
        uuid id PK
        uuid order_id FK
        text tracking_number
        text status
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        text action
        text entity_type
        uuid entity_id
        jsonb old_values
        jsonb new_values
    }
```

---

## 31. Table-by-Table Data Dictionary

### Summary of All Tables

| # | Table | Purpose | Phase |
|---|---|---|---|
| 1 | `profiles` | Customer profiles linked to Supabase Auth | MVP |
| 2 | `admin_users` | Internal admin users (Clerk auth) | MVP |
| 3 | `user_addresses` | Customer shipping/billing addresses | MVP |
| 4 | `vendors` | Supplier/vendor sources | MVP |
| 5 | `brands` | Product brands/manufacturers | MVP |
| 6 | `categories` | Hierarchical product categories | MVP |
| 7 | `products` | Central product catalog | MVP |
| 8 | `product_images` | Product image metadata | MVP |
| 9 | `product_documents` | Product datasheets/manuals | OPTIONAL MVP |
| 10 | `inventory` | Stock levels per product | MVP |
| 11 | `inventory_transactions` | Stock movement history | MVP |
| 12 | `carts` | Shopping carts | MVP |
| 13 | `cart_items` | Cart line items | MVP |
| 14 | `wishlists` | Customer wishlists | MVP |
| 15 | `wishlist_items` | Wishlist products | MVP |
| 16 | `orders` | Order records | MVP |
| 17 | `order_items` | Order line items (historical snapshots) | MVP |
| 18 | `order_addresses` | Order address snapshots | MVP |
| 19 | `payments` | Payment records | MVP |
| 20 | `payment_verifications` | UTR verification records | MVP |
| 21 | `tax_rates` | Configurable tax rates | MVP |
| 22 | `shipments` | Shipment tracking | MVP |
| 23 | `reviews` | Product reviews | MVP |
| 24 | `audit_logs` | Admin action audit trail | MVP |
| 25 | `invoices` | Order invoices | MVP |
| 26 | `notifications` | System notifications | MVP |
| 27 | `quote_requests` | Quote inquiries | OPTIONAL MVP |
| 28 | `quote_request_items` | Quote inquiry line items | OPTIONAL MVP |
| 29 | `coupons` | Discount coupons | PHASE 2 |
| 30 | `coupon_usages` | Coupon usage history | PHASE 2 |
| 31 | `returns` | Return requests | PHASE 2 |
| 32 | `return_items` | Return line items | PHASE 2 |
| 33 | `refunds` | Refund records | PHASE 2 |

> Detailed column definitions for each table are provided in their respective sections above.

---

## 32. Enum / Controlled Value Registry

All enum/check-controlled values in one place. Avoid duplicate or contradictory definitions.

### `account_type` (profiles)

| Value | Description |
|---|---|
| `CUSTOMER` | Regular customer account |
| `ADMIN` | Admin-level application profile |

### `admin_role` (admin_users)

| Value | Description |
|---|---|
| `Owner` | Primary admin |
| `Manager` | Partner/manager |
| `Staff` | Staff member |

### `product_type` (products)

| Value | Description |
|---|---|
| `PRODUCT` | Standard catalog product |
| `ACCESSORY` | Product accessory |
| `SPARE_PART` | Spare/replacement part |

### `pricing_type` (products)

| Value | Description |
|---|---|
| `FIXED` | Fixed price, purchasable |
| `QUOTE_REQUIRED` | Price on request |

### `cart_status` (carts)

| Value | Description |
|---|---|
| `ACTIVE` | Currently in use |
| `CONVERTED` | Converted to order |
| `ABANDONED` | Abandoned/expired |

### `order_status` (orders)

| Value | Description |
|---|---|
| `PENDING` | Order created, awaiting payment |
| `CONFIRMED` | Payment verified, order confirmed |
| `PROCESSING` | Being prepared |
| `PACKED` | Packed for shipment |
| `SHIPPED` | Handed to courier |
| `DELIVERED` | Delivered to customer |
| `CANCELLED` | Order cancelled |
| `RETURN_REQUESTED` | Return requested |
| `RETURNED` | Return completed |
| `REFUNDED` | Refund processed |

### `payment_status` (orders, payments)

| Value | Description |
|---|---|
| `PENDING` | Awaiting payment |
| `UNDER_REVIEW` | UTR submitted, admin reviewing |
| `PAID` | Payment confirmed |
| `FAILED` | Payment failed |
| `REJECTED` | Payment/UTR rejected |
| `REFUNDED` | Payment refunded |

### `payment_method` (payments)

| Value | Description |
|---|---|
| `QR` | QR code payment |
| `UPI` | UPI transfer |
| `BANK_TRANSFER` | Direct bank transfer |
| `COD` | Cash on delivery |
| `GATEWAY` | Online payment gateway |

### `payment_verification_status` (payment_verifications)

| Value | Description |
|---|---|
| `PENDING` | Submitted, not yet reviewed |
| `UNDER_REVIEW` | Admin is reviewing |
| `VERIFIED` | Admin verified payment |
| `REJECTED` | Admin rejected |

### `shipment_status` (shipments)

| Value | Description |
|---|---|
| `PENDING` | Not yet shipped |
| `PACKED` | Packed and ready |
| `SHIPPED` | Handed to courier |
| `IN_TRANSIT` | In transit |
| `OUT_FOR_DELIVERY` | Out for delivery |
| `DELIVERED` | Delivered |
| `CANCELLED` | Shipment cancelled |

### `document_type` (product_documents)

| Value | Description |
|---|---|
| `DATASHEET` | Technical datasheet |
| `MANUAL` | User manual |
| `CERTIFICATE` | Calibration/compliance certificate |
| `CATALOG` | Product catalog page |
| `OTHER` | Other document |

### `discount_type` (coupons)

| Value | Description |
|---|---|
| `PERCENTAGE` | Percentage discount |
| `FIXED_AMOUNT` | Fixed amount discount |

### `return_status` (returns)

| Value | Description |
|---|---|
| `REQUESTED` | Return requested |
| `APPROVED` | Return approved |
| `RECEIVED` | Product received back |
| `COMPLETED` | Return completed |
| `REJECTED` | Return rejected |

### `refund_status` (refunds)

| Value | Description |
|---|---|
| `PENDING` | Refund pending |
| `PROCESSING` | Refund being processed |
| `COMPLETED` | Refund completed |
| `FAILED` | Refund failed |

### `inventory_transaction_type` (inventory_transactions)

| Value | Description |
|---|---|
| `STOCK_IN` | Stock received |
| `STOCK_OUT` | Stock removed |
| `ORDER_RESERVED` | Reserved for order |
| `ORDER_RELEASED` | Released from cancelled order |
| `SALE` | Sold and shipped |
| `RETURN` | Returned to stock |
| `DAMAGE` | Damaged/written off |
| `ADJUSTMENT` | Manual adjustment |

### `address_type` (order_addresses)

| Value | Description |
|---|---|
| `SHIPPING` | Shipping address |
| `BILLING` | Billing address |

### `quote_request_status` (quote_requests)

| Value | Description |
|---|---|
| `PENDING` | Awaiting admin response |
| `RESPONDED` | Admin has responded |
| `CLOSED` | Quote request closed |

---

## 33. MVP vs Phase 2

### MVP Tables (Must Implement)

| Table | Notes |
|---|---|
| `profiles` | Customer profiles |
| `admin_users` | Replaces existing `users` |
| `user_addresses` | Customer addresses |
| `vendors` | **NEW** — vendor source tracking |
| `brands` | Existing, with field renames |
| `categories` | Existing, with `sort_order` and `updated_at` added |
| `products` | Major expansion from existing |
| `product_images` | Existing, with field renames |
| `inventory` | Existing, with `reorder_level` added |
| `inventory_transactions` | **NEW** — stock audit trail |
| `carts` | **NEW** |
| `cart_items` | **NEW** |
| `wishlists` | **NEW** |
| `wishlist_items` | **NEW** |
| `orders` | Major restructuring |
| `order_items` | Expanded with historical snapshots |
| `order_addresses` | **NEW** — address snapshots |
| `payments` | **NEW** — replaces `payment_proofs` concept |
| `payment_verifications` | **NEW** — UTR verification |
| `tax_rates` | **NEW** — configurable GST rates |
| `shipments` | **NEW** — replaces inline shipping fields |
| `reviews` | **NEW** |
| `audit_logs` | Expands existing `activity_logs` |
| `invoices` | Existing, preserved |
| `notifications` | Existing, preserved |

### Optional MVP Tables

| Table | Condition |
|---|---|
| `quote_requests` | Include if quote flow is a launch requirement |
| `quote_request_items` | Include with `quote_requests` |
| `product_documents` | Include if product document uploads are needed at launch |

### Phase 2 Tables

| Table | Notes |
|---|---|
| `product_variants` | Demoted from existing schema |
| `coupons` | Discount system |
| `coupon_usages` | Coupon audit trail |
| `returns` | Return management |
| `return_items` | Return line items |
| `refunds` | Refund tracking |
| `attributes` | Structured product attributes |
| `attribute_values` | Attribute value catalog |
| `product_attributes` | Product-attribute mapping |

### Future (Not Planned)

| Feature | Status |
|---|---|
| Multi-warehouse | NOT REQUIRED |
| Complex RBAC | NOT REQUIRED |
| Supplier procurement | NOT REQUIRED |
| Purchase orders | NOT REQUIRED |
| Vendor price comparison | NOT REQUIRED |
| Microservice databases | NOT REQUIRED |
| Separate analytics warehouse | NOT REQUIRED |

---

## 34. Open Business Decisions

### ⚠️ BUSINESS CONFIRMATION REQUIRED

#### 1. MOQ (Minimum Order Quantity)

The vendor PDFs contain quantity/MOQ-like columns, but the exact meaning is ambiguous.

- **Current decision:** `products.minimum_order_quantity` field exists but should NOT be auto-populated from ambiguous PDF data.
- **Action needed:** Business must confirm which PDF quantity columns represent MOQ vs. pack size vs. stock.

#### 2. Product Documents

The PDFs establish vendor-level certifications but do NOT confirm that every individual product has its own datasheet/manual.

- **Current decision:** `product_documents` table is OPTIONAL MVP.
- **Action needed:** Business must confirm document availability per product.

#### 3. Product Variants

- **Current decision:** Separate products for MVP. `product_variants` demoted to Phase 2.
- **Rationale:** GT8000-style products have distinct model/specification/price/HSN combinations — they are distinct catalog items, not color/size variants.

#### 4. Structured Specifications

- **Current decision:** JSONB for MVP. Structured attribute system in Phase 2.
- **Rationale:** Building a normalized attribute system for ~500 products is premature.

#### 5. Multi-Vendor Comparison

- **Current decision:** Not required for MVP.
- **Rationale:** Galaxy Tools Hub is a single storefront reselling from known vendors.

#### 6. Quote Flow

- **Current decision:** OPTIONAL MVP. Tables defined but implementation is conditional.
- **Action needed:** Business must confirm if "Request Quote" is a launch requirement.

#### 7. Guest Checkout

- **Current decision:** `carts.session_id` supports guest checkout.
- **Action needed:** Business must confirm if guest checkout is a launch requirement.

### ⚠️ EXISTING CODE CONFLICTS

#### 8. Authentication Provider Split

| Aspect | Existing Code | This Specification |
|---|---|---|
| Admin auth | Clerk | Clerk (preserved) |
| Customer auth | `customers` table with direct fields | Supabase Auth → `profiles` |
| Admin user table | `users` | `admin_users` (renamed) |
| Customer table | `customers` (direct credentials) | `profiles` (linked to `auth.users`) |

- **Resolution:** Both systems coexist. The existing `customers` table is replaced by `profiles` linked to Supabase Auth. The existing `users` table is renamed to `admin_users`.

#### 9. Order/Payment Status Values

| Aspect | Existing Code (`@galaxy/constants`) | This Specification |
|---|---|---|
| Order statuses | `Pending Payment`, `Payment Verified`, `Confirmed`, etc. | `PENDING`, `CONFIRMED`, `PROCESSING`, etc. |
| Payment statuses | `Pending`, `Submitted`, `Verified`, `Rejected` | `PENDING`, `UNDER_REVIEW`, `PAID`, `FAILED`, `REJECTED`, `REFUNDED` |

- **Resolution:** The `@galaxy/constants` package must be updated during implementation to match the new enum values. Database CHECK constraints will enforce the new values.

#### 10. Product Variants

| Aspect | Existing Code | This Specification |
|---|---|---|
| `product_variants` table | EXISTS in `schema.sql` | DEMOTED to Phase 2 |

- **Resolution:** The `product_variants` table remains defined in Phase 2 documentation but is not created in MVP migrations.

---

## 35. Implementation Roadmap

### Migration Order

Tables must be created in dependency order. The recommended sequence:

```
Phase 1: Foundation
  1. Extensions (uuid-ossp, pg_trgm)
  2. admin_users
  3. vendors
  4. brands
  5. categories
  6. tax_rates

Phase 2: Product Catalog
  7. products
  8. product_images
  9. product_documents (optional)
  10. inventory
  11. inventory_transactions

Phase 3: Customer
  12. profiles (with auth.users trigger)
  13. user_addresses

Phase 4: Shopping
  14. carts
  15. cart_items
  16. wishlists
  17. wishlist_items

Phase 5: Orders & Payments
  18. orders
  19. order_items
  20. order_addresses
  21. payments
  22. payment_verifications
  23. shipments
  24. invoices

Phase 6: Engagement
  25. reviews
  26. notifications
  27. audit_logs
  28. quote_requests (optional)
  29. quote_request_items (optional)

Phase 7: Indexes & Policies
  30. All indexes
  31. All RLS policies
  32. All storage bucket policies
```

---

## 36. Supabase Migration Plan

### Migration Strategy

1. **Use Supabase Migrations** — `supabase migration new <name>` for each logical phase.
2. **One migration per phase** — Keep migrations atomic and reversible.
3. **Seed data** — Create a separate seed file for initial vendor, brand, and category data.
4. **RLS policies** — Apply in a dedicated migration after all tables are created.
5. **Indexes** — Apply in a dedicated migration after schema is stable.

### Naming Convention

```
YYYYMMDDHHMMSS_<description>.sql

Example:
20260808000001_create_foundation_tables.sql
20260808000002_create_product_catalog.sql
20260808000003_create_customer_tables.sql
20260808000004_create_shopping_tables.sql
20260808000005_create_order_payment_tables.sql
20260808000006_create_engagement_tables.sql
20260808000007_create_indexes.sql
20260808000008_create_rls_policies.sql
20260808000009_seed_initial_data.sql
```

### Profile Trigger

A database trigger should automatically create a `profiles` row when a new `auth.users` entry is created:

```sql
-- Function: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'CUSTOMER'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fire after insert on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Existing Schema Mapping

| Existing Table (`schema.sql`) | Action | New Table |
|---|---|---|
| `users` | RENAME + modify | `admin_users` |
| `categories` | MODIFY | `categories` (add `sort_order`, `updated_at`) |
| `brands` | MODIFY | `brands` (rename `active` → `is_active`, add `website`, `updated_at`) |
| `products` | MAJOR RESTRUCTURE | `products` (many new fields) |
| `product_variants` | DEFER | Phase 2 (do not create in MVP) |
| `inventory` | MODIFY | `inventory` (add `reorder_level`, rename `reserved_stock`) |
| `product_images` | MODIFY | `product_images` (rename fields, add `is_primary`, `alt_text`) |
| `customers` | REPLACE | `profiles` (Supabase Auth integration) |
| `addresses` | REPLACE | `user_addresses` (expanded fields) |
| `orders` | MAJOR RESTRUCTURE | `orders` (separated statuses, new monetary fields) |
| `order_items` | EXPAND | `order_items` (historical snapshots) |
| `payment_proofs` | REPLACE | `payments` + `payment_verifications` |
| `invoices` | PRESERVE | `invoices` |
| `notifications` | PRESERVE | `notifications` |
| `activity_logs` | EXPAND + RENAME | `audit_logs` |

---

> **Database Architecture Status: READY FOR REVIEW**
>
> All major schema relationships are internally consistent. Foreign keys reference existing tables,
> product/brand/vendor separation is enforced, historical order data is snapshotted, payment and order
> statuses are independent, and RLS requirements are documented.
>
> Implementation should proceed after business confirmation on items listed in
> [Open Business Decisions](#34-open-business-decisions).
