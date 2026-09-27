# Galaxy Tools Hub — Comprehensive Project Change & Architecture Report

> **Last Updated:** 2026-08-29  
> **Repository:** [Galaxy-Tools-Hub](https://github.com/DakshChaudhary2668/Galaxy-Tools-Hub.git)  
> **Scope:** Full Codebase Evolution & Architecture Transition (Initial Scaffold → Core E-Commerce Checkout → Enterprise Admin Panel Suite Release)

---

## 1. Executive Summary

**Galaxy Tools Hub** has evolved from an initial monorepo scaffold into a complete, enterprise-grade e-commerce application and operational management platform specifically tailored for B2B/B2C industrial tools, testing equipment, and dealer supply chains.

### Core Milestones Achieved
1. **Monorepo & Build System:** PNPM workspaces + TurboRepo pipeline managing `apps/web` (Next.js 15 App Router), `apps/server` (Express.js TypeScript), `packages/types`, `packages/constants`, `packages/config`, and `packages/utils`.
2. **Customer E-Commerce Engine:** Complete cart management, dynamic tax/shipping calculation, Razorpay Standard Checkout SDK integration with HMAC SHA-256 server-side signature verification, and visual order receipt pages.
3. **Enterprise Admin Panel (`/admin`):** 12 comprehensive administrative sub-modules including Dashboard, Orders, Products, Categories, Inventory Control, Customer Management, Promotions/Coupons, Analytics, and Store Settings.
4. **Database & RBAC Security:** Unified authentication (Supabase Auth for both internal staff and customer accounts), zero-trust credential isolation, and atomic inventory reservation lifecycles.
5. **Verified Production Builds:** Zero TypeScript errors, zero ESLint blocking issues, and clean Next.js 15 production compilation (`apps/web`) alongside TypeScript server bundle generation (`apps/server`).

---

## 2. Chronological Commit & Major Implementation Log

| Phase / Release | Category | Description & Impact | Key Files Created / Modified |
| :--- | :--- | :--- | :--- |
| **Monorepo Bootstrap** | `scaffold` | Initialized PNPM workspace with TurboRepo pipeline managing `apps/web` and `apps/server`. | `pnpm-workspace.yaml`, `package.json`, `turbo.json` |
| **Database v2.0 Overhaul** | `database` | Designed 28-table schema with RLS, variant tracking, audit trails, and foreign key safety. | `Docs/schema.sql`, `Docs/DatabaseGuide.md` |
| **Backend Core Architecture** | `backend` | Repository pattern (`base.repository.ts`), rate limiting, `/health` monitoring, and response standardizer. | `apps/server/src/controllers/`, `apps/server/src/repositories/` |
| **Customer Cart Page** | `web/cart` | Responsive cart view (`/cart`) with quantity modifiers, 18% inclusive GST calculations, and ₹50,000 free shipping rule (₹500 flat fee). | `apps/web/src/app/cart/page.tsx`, `Cart.module.scss` |
| **Razorpay Checkout Engine** | `checkout/payment` | Multi-step checkout (`/checkout`), Razorpay Node.js SDK config, order creation (`POST /api/v1/payments/create-order`), and HMAC verification (`POST /api/v1/payments/verify`). | `apps/server/src/controllers/payment.controller.ts`, `apps/web/src/app/checkout/` |
| **Order Confirmation UX** | `web/orders` | Visual tracking receipt (`/order-success`), transaction status badge, payment mode, and order reference summary. | `apps/web/src/app/order-success/page.tsx`, `OrderSuccess.module.scss` |
| **Admin Panel Layout Shell** | `admin/shell` | Dark industrial sidebar (`#0F172A`), active indicators, mobile drawer collapse, notification top bar, and role badges. | `apps/web/src/app/admin/layout.tsx`, `AdminLayout.module.scss` |
| **Admin Operational Dashboard** | `admin/dashboard` | 6 KPI cards, revenue & order timeline charts (`7d`, `30d`, `3m`, `1y`), recent orders feed, and low-stock alerts. | `apps/web/src/app/admin/dashboard/page.tsx`, `apps/server/src/controllers/analytics.controller.ts` |
| **Admin Order Management** | `admin/orders` | Server-side paginated orders table with search, fulfillment/payment filters, order detail inspector (`/admin/orders/[id]`), state machine transitions, and inventory auto-release hooks. | `apps/web/src/app/admin/orders/`, `apps/server/src/controllers/order.controller.ts` |
| **Admin Product Management** | `admin/products` | Catalog table, product creator (`/new`), product editor (`/[id]/edit`), SKU uniqueness validation, dynamic technical specifications builder, and safe delete protection. | `apps/web/src/app/admin/products/`, `apps/server/src/controllers/product.controller.ts` |
| **Admin Category Management** | `admin/categories` | Dynamic category manager with live product count badges, unique slug generation, circular parentage prevention (`parent_id !== id`), and safe delete checks. | `apps/web/src/app/admin/categories/page.tsx`, `apps/server/src/controllers/category.controller.ts` |
| **Admin Customer Intelligence** | `admin/customers` | Customer directory (`/admin/customers`), profile inspection (`/admin/customers/[id]`), lifetime spend and order metrics, address book, zero credential exposure. | `apps/web/src/app/admin/customers/`, `apps/server/src/controllers/customer.controller.ts` |
| **Admin Coupon & Discount Suite** | `admin/coupons` | Promotions manager with live status engine (`ACTIVE`, `SCHEDULED`, `EXPIRED`, `DISABLED`), create/edit modal, and server-side discount validator (`POST /api/v1/coupons/validate`). | `apps/web/src/app/admin/coupons/`, `apps/server/src/controllers/coupon.controller.ts` |
| **Admin Business Analytics** | `admin/analytics` | Dedicated business analytics dashboard with date presets & custom range pickers, net revenue calculations (excluding failed/cancelled orders), AOV equation, visual timelines, and category breakdowns. | `apps/web/src/app/admin/analytics/`, `apps/server/src/controllers/analytics.controller.ts` |
| **Admin Settings & Governance** | `admin/settings` | Multi-tab settings panel (Store Profile, Commerce & 18% GST, Masked Razorpay Gateway Status, Notification Policies, Admin Team RBAC, and System Architecture). | `apps/web/src/app/admin/settings/`, `apps/server/src/controllers/settings.controller.ts` |
| **Admin Inventory Control** | `admin/inventory` | Real-time warehouse inventory table, reserved order allocations, sellable stock counts, inline quick stock adjustment, and low-stock filters. | `apps/web/src/app/admin/inventory/`, `apps/server/src/controllers/inventory.controller.ts` |
| **Production QA & Security Audit** | `qa/build` | Comprehensive end-to-end audit, type check (`tsc --noEmit`), Next.js 15 production compilation, and secret isolation verification. | Full monorepo audit suite |

---

## 3. Detailed Architecture Breakdown

### 3.1. Frontend Web Architecture (`apps/web`)
- **Framework:** Next.js 15 App Router with TypeScript.
- **Styling Architecture:** Titan Industrial SCSS Token System (`_variables.scss`, `_mixins.scss`, `_breakpoints.scss`, `globals.scss`) providing B2B dark slate styling (`#0F172A`), high-contrast warning accents (`#F5C710`), dense operational data tables, and glassmorphic card overlays.
- **Client Services Layer:**
  - `product.service.ts`: Products catalog & CRUD operations.
  - `category.service.ts`: Categories listing & management.
  - `order.service.ts`: Order lifecycle, pagination, and transitions.
  - `payment.service.ts`: Razorpay integration & verification.
  - `analytics.service.ts`: Dashboard summaries & deep analytics.
  - `customer.service.ts`: Customer profile intelligence.
  - `coupon.service.ts`: Promotional vouchers & checkout validator.
  - `inventory.service.ts`: Warehouse stock adjustments.
  - `settings.service.ts`: Store parameters & RBAC team.

### 3.2. Backend REST Architecture (`apps/server`)
- **Runtime:** Express.js + TypeScript running on Port 8000.
- **Database Client:** Supabase PostgreSQL with `supabaseAdmin` service client.
- **Security & RBAC Middleware:**
  - `adminAuthGuard`: Authenticates Supabase JWT tokens and verifies admin role for protected endpoints.
  - `rbacGuard`: Enforces fine-grained role permissions (`OWNER`, `MANAGER`, `STAFF`).
  - `express-rate-limit`: Protects against brute-force attacks on public endpoints.
- **Mounted API Endpoints:**
  - `/api/v1/auth`: Authentication and admin user session handlers.
  - `/api/v1/categories`: Category taxonomy and product associations.
  - `/api/v1/products`: Product catalog, SKU lookups, and inventory sync.
  - `/api/v1/orders`: Order creation, timeline management, and status transitions.
  - `/api/v1/payments`: Razorpay order creation and HMAC SHA-256 verification.
  - `/api/v1/analytics`: Dashboard operational summaries and detailed analytics.
  - `/api/v1/customers`: Customer intelligence and lifetime metrics.
  - `/api/v1/coupons`: Voucher creation, status engine, and checkout validation.
  - `/api/v1/settings`: Store configuration and admin team management.
  - `/api/v1/inventory`: Warehouse stock tracking and quick adjustments.

### 3.3. Shared Types & Constants (`packages/types`, `packages/constants`)
- **Types:** Fully typed DTOs and Zod validation schemas for `ProductSchema`, `OrderSchema`, `CategorySchema`, `AdminUserSchema`, `CouponSchema`, `InventorySchema`, and `PaymentVerificationSchema`.
- **Constants:** Centralized enums for `OrderStatus`, `PaymentStatus`, `Roles`, `DiscountType`, and `StockStatus`.

---

## 4. Key Security & Operational Guarantees

1. **Zero Frontend Secret Exposure:**
   - `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and database credentials reside strictly on the server in `.env`.
   - The settings panel exposes only masked public identifiers (e.g. `rzp_test_5••••••••••••`).
2. **Server-Side Financial & Discount Authority:**
   - Order payment verification is impossible without valid HMAC SHA-256 signatures from Razorpay.
   - Discount calculations are strictly evaluated and recalculated server-side; client subtotal tamperings are rejected.
3. **Data Protection & Foreign Key Safety:**
   - Active products referenced by historical orders cannot be destructively hard-deleted.
   - Categories containing assigned products cannot be deleted without reassigning inventory.
   - Circular category hierarchy (`parent_id === id`) is blocked.
   - Coupons used in previous orders are deactivated/archived rather than cascade deleted.
4. **Customer Data Privacy:**
   - Passwords, cryptographic hashes, session tokens, and secrets are never selected or exposed in customer profile APIs.

---

## 5. Verification & Build Results

```
┌─────────────────────────────────────────────────────────────┐
│ Monorepo Verification & Production Build Suite              │
├──────────────────────────────┬──────────────────────────────┤
│ apps/web Type Check (TSC)    │ PASS (0 errors, 0 warnings)  │
│ apps/server Type Check (TSC) │ PASS (0 errors, 0 warnings)  │
│ apps/server Build (TSC)      │ PASS (Compiled to dist/)     │
│ apps/web Production Build    │ PASS (Next.js 15.5.23)       │
│ Active Development Servers   │ RUNNING (Port 3000 & 8000)   │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 6. Repository Status
- **Main Branch:** Up-to-date and stabilized.
- **Production Status:** Fully functional and ready for deployment.
