-- ============================================================================
-- Galaxy Tools Hub — Supabase PostgreSQL Schema
-- Version: 2.0 (aligned with DatabaseGuide.md specification)
-- ============================================================================
-- This schema implements all MVP tables as defined in the Database Architecture
-- & Implementation Guide. Phase 2 tables (coupons, returns, refunds,
-- product_variants, structured attributes) are NOT included.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUIDv4 primary keys
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram matching for full-text search


-- ============================================================================
-- PHASE 1: FOUNDATION TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ADMIN USERS (Internal staff authenticated via Clerk)
--    Renamed from 'users' to avoid collision with customer 'profiles'.
--    For MVP, all roles (Owner/Manager/Staff) have identical dashboard access.
-- ---------------------------------------------------------------------------
CREATE TABLE admin_users (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id  VARCHAR(255) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  role           VARCHAR(50)  NOT NULL CHECK (role IN ('Owner', 'Manager', 'Staff')),
  status         VARCHAR(50)  NOT NULL DEFAULT 'Active'
                              CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. VENDORS (Supplier/dealer sources for the product catalog)
-- ---------------------------------------------------------------------------
CREATE TABLE vendors (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT        NOT NULL,
  code           TEXT        UNIQUE NOT NULL,  -- e.g. 'GTECH', 'MECO', 'HTC'
  description    TEXT,
  contact_name   TEXT,
  email          TEXT,
  phone          TEXT,
  website        TEXT,
  address        TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. BRANDS (Product manufacturers — separate concept from vendors)
-- ---------------------------------------------------------------------------
CREATE TABLE brands (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(255) NOT NULL,
  slug           VARCHAR(255) UNIQUE NOT NULL,
  description    TEXT,
  logo_url       TEXT,
  website        TEXT,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4. CATEGORIES (Self-referencing hierarchy via parent_id)
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id      UUID         REFERENCES categories(id) ON DELETE SET NULL,
  name           VARCHAR(255) NOT NULL,
  slug           VARCHAR(255) UNIQUE NOT NULL,
  description    TEXT,
  image_url      TEXT,
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. TAX RATES (Configurable GST rates — not hardcoded)
-- ---------------------------------------------------------------------------
CREATE TABLE tax_rates (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT          NOT NULL,          -- e.g. 'GST 18%', 'GST 12%'
  rate           NUMERIC(5,2)  NOT NULL CHECK (rate >= 0),
  hsn_required   BOOLEAN       NOT NULL DEFAULT FALSE,
  effective_from DATE          NOT NULL,
  effective_to   DATE,                            -- NULL = currently active
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- PHASE 2: PRODUCT CATALOG
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 6. PRODUCTS (Central catalog table)
--    Galaxy Tools Hub SKU ≠ Vendor Model Number ≠ Brand ≠ Vendor
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id                     UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relationships
  category_id            UUID           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id               UUID           NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  source_vendor_id       UUID           NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  parent_product_id      UUID           REFERENCES products(id) ON DELETE SET NULL,

  -- Identification
  sku                    TEXT           UNIQUE NOT NULL,       -- Galaxy Tools Hub SKU
  source_model_no        TEXT           NOT NULL,              -- Vendor's own model number
  name                   TEXT           NOT NULL,
  slug                   TEXT           UNIQUE NOT NULL,

  -- Classification
  product_type           TEXT           NOT NULL DEFAULT 'PRODUCT'
                                        CHECK (product_type IN ('PRODUCT', 'ACCESSORY', 'SPARE_PART')),

  -- Descriptions
  short_description      TEXT,
  description            TEXT,

  -- Technical specifications (JSONB for MVP)
  specifications         JSONB          DEFAULT '{}'::jsonb,

  -- Pricing
  pricing_type           TEXT           NOT NULL DEFAULT 'FIXED'
                                        CHECK (pricing_type IN ('FIXED', 'QUOTE_REQUIRED')),
  price                  NUMERIC(12,2)  CHECK (price >= 0),
  compare_at_price       NUMERIC(12,2)  CHECK (compare_at_price >= 0),

  -- Tax
  hsn_code               TEXT           NOT NULL,
  tax_rate               NUMERIC(5,2)   NOT NULL DEFAULT 18.00 CHECK (tax_rate >= 0),

  -- Quantity
  minimum_order_quantity INTEGER        CHECK (minimum_order_quantity > 0),

  -- Physical
  weight                 NUMERIC(8,2),
  dimensions             VARCHAR(100),

  -- SEO
  seo_title              VARCHAR(255),
  seo_description        TEXT,
  meta_keywords          TEXT,

  -- Flags
  is_purchasable         BOOLEAN        NOT NULL DEFAULT TRUE,
  is_featured            BOOLEAN        NOT NULL DEFAULT FALSE,
  is_active              BOOLEAN        NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  -- Business rule: FIXED pricing requires a non-null price
  CONSTRAINT chk_pricing CHECK (
    (pricing_type = 'FIXED' AND price IS NOT NULL)
    OR (pricing_type = 'QUOTE_REQUIRED')
  )
);

-- ---------------------------------------------------------------------------
-- 7. PRODUCT IMAGES (Metadata only — files in Supabase Storage)
-- ---------------------------------------------------------------------------
CREATE TABLE product_images (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path   TEXT        NOT NULL,   -- Path in Supabase Storage bucket
  public_url     TEXT,                   -- Generated public URL
  alt_text       TEXT,                   -- Accessibility text
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  is_primary     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 8. PRODUCT DOCUMENTS (Optional MVP — datasheets, manuals, certificates)
-- ---------------------------------------------------------------------------
CREATE TABLE product_documents (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  document_type  TEXT        NOT NULL
                             CHECK (document_type IN ('DATASHEET', 'MANUAL', 'CERTIFICATE', 'CATALOG', 'OTHER')),
  file_name      TEXT        NOT NULL,
  storage_path   TEXT        NOT NULL,   -- Path in Supabase Storage bucket
  file_size      INTEGER,                -- Bytes
  mime_type      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 9. INVENTORY (One row per product)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id         UUID        UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity           INTEGER     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity  INTEGER     NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  reorder_level      INTEGER,    -- Low-stock alert threshold
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 10. INVENTORY TRANSACTIONS (Stock movement audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_transactions (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id         UUID        NOT NULL REFERENCES products(id),
  transaction_type   TEXT        NOT NULL
                                 CHECK (transaction_type IN (
                                   'STOCK_IN', 'STOCK_OUT',
                                   'ORDER_RESERVED', 'ORDER_RELEASED',
                                   'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT'
                                 )),
  quantity           INTEGER     NOT NULL,   -- Positive or negative depending on type
  reference_type     TEXT,                   -- e.g. 'ORDER', 'RETURN', 'MANUAL'
  reference_id       UUID,                   -- FK to relevant entity (polymorphic)
  notes              TEXT,
  created_by         UUID        REFERENCES admin_users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- PHASE 3: CUSTOMER
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 11. PROFILES (Customer accounts linked to Supabase Auth)
--     One auth.users row → exactly one profiles row.
--     Do NOT store passwords here — Supabase Auth handles authentication.
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        UNIQUE NOT NULL,  -- FK → auth.users.id (managed by trigger)
  full_name      TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  phone          TEXT,
  account_type   TEXT        NOT NULL DEFAULT 'CUSTOMER'
                             CHECK (account_type IN ('CUSTOMER', 'ADMIN')),
  avatar_url     TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a new user signs up via Supabase Auth
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 12. USER ADDRESSES (Customers can maintain multiple addresses)
-- ---------------------------------------------------------------------------
CREATE TABLE user_addresses (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address_label  TEXT,                   -- e.g. 'Home', 'Office'
  full_name      TEXT        NOT NULL,
  phone          TEXT        NOT NULL,
  address_line_1 TEXT        NOT NULL,
  address_line_2 TEXT,
  landmark       TEXT,
  city           TEXT        NOT NULL,
  state          TEXT        NOT NULL,
  postal_code    TEXT        NOT NULL,
  country        TEXT        NOT NULL DEFAULT 'India',
  is_default     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- PHASE 4: SHOPPING
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 13. CARTS
-- ---------------------------------------------------------------------------
CREATE TABLE carts (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        REFERENCES profiles(id),       -- NULL for guest carts
  session_id     TEXT,                                       -- For guest checkout
  status         TEXT        NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('ACTIVE', 'CONVERTED', 'ABANDONED')),
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 14. CART ITEMS
-- ---------------------------------------------------------------------------
CREATE TABLE cart_items (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id        UUID          NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id     UUID          NOT NULL REFERENCES products(id),
  quantity       INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price     NUMERIC(12,2) NOT NULL,   -- Price at time of adding to cart
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 15. WISHLISTS (One per customer)
-- ---------------------------------------------------------------------------
CREATE TABLE wishlists (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        UNIQUE NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 16. WISHLIST ITEMS
-- ---------------------------------------------------------------------------
CREATE TABLE wishlist_items (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id    UUID        NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id     UUID        NOT NULL REFERENCES products(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_wishlist_product UNIQUE (wishlist_id, product_id)
);


-- ============================================================================
-- PHASE 5: ORDERS & PAYMENTS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 17. ORDERS
--     Payment status and order status are INDEPENDENT state machines.
--     All monetary fields use NUMERIC(12,2) — never FLOAT.
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number       VARCHAR(50)   UNIQUE NOT NULL,
  user_id            UUID          NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  -- Status (independent state machines)
  status             TEXT          NOT NULL DEFAULT 'PENDING'
                                   CHECK (status IN (
                                     'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED',
                                     'SHIPPED', 'DELIVERED', 'CANCELLED',
                                     'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'
                                   )),
  payment_status     TEXT          NOT NULL DEFAULT 'PENDING'
                                   CHECK (payment_status IN (
                                     'PENDING', 'UNDER_REVIEW', 'PAID',
                                     'FAILED', 'REJECTED', 'REFUNDED'
                                   )),

  -- Monetary totals
  subtotal           NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount    NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount         NUMERIC(12,2) NOT NULL CHECK (tax_amount >= 0),
  shipping_amount    NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_amount >= 0),
  total_amount       NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  currency           TEXT          NOT NULL DEFAULT 'INR',

  -- Optional coupon reference (Phase 2 FK)
  coupon_id          UUID,

  -- Notes
  customer_notes     TEXT,
  admin_notes        TEXT,

  -- Timestamps
  placed_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 18. ORDER ITEMS (Historical snapshots — survives product mutations)
--     Even if a product's name/SKU/HSN/price changes later, the order item
--     retains the values at the time of purchase.
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id         UUID          REFERENCES products(id) ON DELETE SET NULL,

  -- Snapshotted product data
  product_name       TEXT          NOT NULL,
  sku                TEXT          NOT NULL,
  source_model_no    TEXT,
  hsn_code           TEXT          NOT NULL,

  -- Quantities & pricing
  quantity           INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price         NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount    NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),

  -- Tax snapshot
  tax_rate           NUMERIC(5,2)  NOT NULL,
  tax_amount         NUMERIC(12,2) NOT NULL CHECK (tax_amount >= 0),

  -- Line total
  total_amount       NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),

  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 19. ORDER ADDRESSES (Historical snapshots — not a reference to current address)
-- ---------------------------------------------------------------------------
CREATE TABLE order_addresses (
  id             UUID   PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID   NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  address_type   TEXT   NOT NULL CHECK (address_type IN ('SHIPPING', 'BILLING')),
  full_name      TEXT   NOT NULL,
  phone          TEXT   NOT NULL,
  address_line_1 TEXT   NOT NULL,
  address_line_2 TEXT,
  landmark       TEXT,
  city           TEXT   NOT NULL,
  state          TEXT   NOT NULL,
  postal_code    TEXT   NOT NULL,
  country        TEXT   NOT NULL DEFAULT 'India'
);

-- ---------------------------------------------------------------------------
-- 20. PAYMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           UUID          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  payment_method     TEXT          NOT NULL
                                   CHECK (payment_method IN ('QR', 'UPI', 'BANK_TRANSFER', 'COD', 'GATEWAY')),
  status             TEXT          NOT NULL DEFAULT 'PENDING'
                                   CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'PAID', 'FAILED', 'REJECTED', 'REFUNDED')),
  amount             NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency           TEXT          NOT NULL DEFAULT 'INR',
  transaction_id     TEXT,                   -- External transaction reference
  gateway_reference  TEXT,                   -- Payment gateway ref
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 21. PAYMENT VERIFICATIONS (UTR verification — admin must verify)
--     Do NOT mark order as paid merely because customer submitted a UTR.
-- ---------------------------------------------------------------------------
CREATE TABLE payment_verifications (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id         UUID          NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  utr_number         TEXT          NOT NULL,
  submitted_amount   NUMERIC(12,2) NOT NULL CHECK (submitted_amount >= 0),
  screenshot_path    TEXT,                   -- Supabase Storage path
  status             TEXT          NOT NULL DEFAULT 'PENDING'
                                   CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  rejection_reason   TEXT,
  verified_by        UUID          REFERENCES admin_users(id),
  verified_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 22. SHIPMENTS (Separate table — allows future multi-shipment per order)
-- ---------------------------------------------------------------------------
CREATE TABLE shipments (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           UUID        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  courier_name       TEXT,
  tracking_number    TEXT,
  status             TEXT        NOT NULL DEFAULT 'PENDING'
                                 CHECK (status IN (
                                   'PENDING', 'PACKED', 'SHIPPED', 'IN_TRANSIT',
                                   'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
                                 )),
  shipped_at         TIMESTAMPTZ,
  estimated_delivery DATE,
  delivered_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 23. INVOICES (Preserved from existing schema)
-- ---------------------------------------------------------------------------
CREATE TABLE invoices (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number     VARCHAR(50) UNIQUE NOT NULL,
  order_id           UUID        UNIQUE NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  pdf_url            TEXT,       -- Supabase Storage path
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- PHASE 6: ENGAGEMENT & AUDIT
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 24. REVIEWS
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES profiles(id),
  product_id           UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_item_id        UUID        REFERENCES order_items(id),
  rating               INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                TEXT,
  comment              TEXT,
  is_verified_purchase BOOLEAN     NOT NULL DEFAULT FALSE,
  is_approved          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_product_review UNIQUE (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- 25. NOTIFICATIONS (Preserved from existing schema)
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_role VARCHAR(50),
  title          VARCHAR(255) NOT NULL,
  message        TEXT         NOT NULL,
  read           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 26. AUDIT LOGS (Expanded from existing activity_logs)
--     Critical for: price changes, inventory changes, UTR verification,
--     order status changes, product deletion/deactivation.
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        REFERENCES admin_users(id),
  action         TEXT        NOT NULL,      -- e.g. UPDATE_PRODUCT, VERIFY_PAYMENT
  entity_type    TEXT        NOT NULL,      -- e.g. 'product', 'order', 'payment'
  entity_id      UUID,
  old_values     JSONB,                     -- Previous state
  new_values     JSONB,                     -- New state
  ip_address     INET,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 27. QUOTE REQUESTS (Optional MVP — for QUOTE_REQUIRED products)
-- ---------------------------------------------------------------------------
CREATE TABLE quote_requests (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES profiles(id),
  status         TEXT        NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING', 'RESPONDED', 'CLOSED')),
  customer_notes TEXT,
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 28. QUOTE REQUEST ITEMS (Optional MVP)
-- ---------------------------------------------------------------------------
CREATE TABLE quote_request_items (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_request_id  UUID          NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  product_id        UUID          NOT NULL REFERENCES products(id),
  quantity          INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  quoted_price      NUMERIC(12,2),  -- Admin-provided quote price
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- PHASE 7: INDEXES
-- ============================================================================

-- Products
CREATE INDEX idx_products_sku              ON products(sku);
CREATE INDEX idx_products_slug             ON products(slug);
CREATE INDEX idx_products_category_id      ON products(category_id);
CREATE INDEX idx_products_brand_id         ON products(brand_id);
CREATE INDEX idx_products_source_vendor_id ON products(source_vendor_id);
CREATE INDEX idx_products_product_type     ON products(product_type);
CREATE INDEX idx_products_is_active        ON products(is_active);
CREATE INDEX idx_products_fts              ON products
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Orders
CREATE INDEX idx_orders_order_number       ON orders(order_number);
CREATE INDEX idx_orders_user_id            ON orders(user_id);
CREATE INDEX idx_orders_status             ON orders(status);
CREATE INDEX idx_orders_payment_status     ON orders(payment_status);
CREATE INDEX idx_orders_placed_at          ON orders(placed_at);

-- Order Items
CREATE INDEX idx_order_items_order_id      ON order_items(order_id);
CREATE INDEX idx_order_items_product_id    ON order_items(product_id);

-- Payments
CREATE INDEX idx_payments_order_id         ON payments(order_id);
CREATE INDEX idx_payments_status           ON payments(status);

-- Payment Verifications
CREATE INDEX idx_pv_utr_number             ON payment_verifications(utr_number);
CREATE INDEX idx_pv_status                 ON payment_verifications(status);

-- Inventory
CREATE INDEX idx_inventory_product_id      ON inventory(product_id);

-- Inventory Transactions
CREATE INDEX idx_inv_tx_product_id         ON inventory_transactions(product_id);
CREATE INDEX idx_inv_tx_type               ON inventory_transactions(transaction_type);

-- Reviews
CREATE INDEX idx_reviews_product_id        ON reviews(product_id);
CREATE INDEX idx_reviews_user_id           ON reviews(user_id);

-- User Addresses
CREATE INDEX idx_user_addresses_user_id    ON user_addresses(user_id);

-- Categories
CREATE INDEX idx_categories_parent_id      ON categories(parent_id);
CREATE INDEX idx_categories_slug           ON categories(slug);

-- Audit Logs
CREATE INDEX idx_audit_logs_entity         ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id        ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at     ON audit_logs(created_at);

-- Shipments
CREATE INDEX idx_shipments_order_id        ON shipments(order_id);
CREATE INDEX idx_shipments_tracking        ON shipments(tracking_number);

-- Carts
CREATE INDEX idx_carts_user_id             ON carts(user_id);
CREATE INDEX idx_carts_session_id          ON carts(session_id);

-- Quote Requests
CREATE INDEX idx_quote_requests_user_id    ON quote_requests(user_id);
