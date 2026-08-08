-- ============================================================================
-- Galaxy Tools Hub — Industrial E-Commerce Seed Data Script
-- Version: 2.0
-- Purpose: Seeds production-ready industrial categories, brands, vendors,
--          tax rates, products, inventory, and image metadata.
-- ============================================================================

BEGIN;

-- 1. TAX RATES
INSERT INTO tax_rates (id, name, rate, hsn_required, effective_from, is_active) VALUES
  ('11111111-1111-4111-a111-111111111111', 'GST 18%', 18.00, true, '2024-01-01', true),
  ('11111111-1111-4111-a111-111111111112', 'GST 12%', 12.00, true, '2024-01-01', true),
  ('11111111-1111-4111-a111-111111111113', 'GST 28%', 28.00, true, '2024-01-01', true),
  ('11111111-1111-4111-a111-111111111114', 'GST 5%',   5.00, true, '2024-01-01', true)
ON CONFLICT (id) DO NOTHING;

-- 2. VENDORS (Suppliers / Distributors)
INSERT INTO vendors (id, name, code, description, contact_name, email, phone, website, address, is_active) VALUES
  ('22222222-2222-4222-a222-222222222221', 'G-Tech Industrial Supplies', 'GTECH', 'Authorized National Distributor for Bosch & Makita', 'Rajesh Sharma', 'sales@gtechtools.in', '+91-9820011223', 'https://gtechtools.in', 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai 400093', true),
  ('22222222-2222-4222-a222-222222222222', 'Meco Instruments India', 'MECO', 'Precision Electrical & Testing Equipment Manufacturer', 'Anil Mehta', 'info@mecoind.com', '+91-9819922334', 'https://mecoind.com', 'Meco House, 301 Kika Street, Kalbadevi, Mumbai 400002', true),
  ('22222222-2222-4222-a222-222222222223', 'HTC Instruments Ltd', 'HTC', 'Industrial Measurement & Calibration Equipment Specialist', 'Vikram Patel', 'corporate@htcinstruments.com', '+91-9833344556', 'https://htcinstruments.com', 'Unit 12, Industrial Estate, Okhla Phase III, New Delhi 110020', true),
  ('22222222-2222-4222-a222-222222222224', 'Galaxy Direct Logistics', 'GALAXY', 'In-house Central Logistics & Stock Warehouse', 'Operations Manager', 'logistics@galaxytoolshub.com', '+91-9876543210', 'https://galaxytoolshub.com', 'Warehouse A-1, Logistics Park, Bhiwandi, Thane 421302', true)
ON CONFLICT (id) DO NOTHING;

-- 3. BRANDS (Manufacturers)
INSERT INTO brands (id, name, slug, description, logo_url, website, is_active) VALUES
  ('33333333-3333-4333-a333-333333333331', 'Bosch', 'bosch', 'Global leader in heavy-duty professional power tools and German engineering', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/brands/bosch.png', 'https://www.bosch-pt.in', true),
  ('33333333-3333-4333-a333-333333333332', 'Makita', 'makita', 'Japanese pioneer in high-performance cordless and brushless industrial tools', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/brands/makita.png', 'https://www.makita.in', true),
  ('33333333-3333-4333-a333-333333333333', 'Stanley', 'stanley', 'World-renowned manufacturer of durable hand tools and industrial equipment', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/brands/stanley.png', 'https://www.stanleytools.in', true),
  ('33333333-3333-4333-a333-333333333334', 'Fluke', 'fluke', 'The gold standard in electronic test tools, thermal imaging, and digital multimeters', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/brands/fluke.png', 'https://www.fluke.com/en-in', true),
  ('33333333-3333-4333-a333-333333333335', 'Ingco', 'ingco', 'Professional quality industrial tools making high technology accessible', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/brands/ingco.png', 'https://www.ingco.com', true),
  ('33333333-3333-4333-a333-333333333336', 'Taparia', 'taparia', 'India trusted market leader in hand tools, forged steel wrenches, and pliers', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/brands/taparia.png', 'https://www.tapariatools.com', true)
ON CONFLICT (id) DO NOTHING;

-- 4. CATEGORIES
INSERT INTO categories (id, name, slug, parent_id, description, image_url, sort_order, is_active) VALUES
  ('44444444-4444-4444-a444-444444444441', 'Power Tools', 'power-tools', NULL, 'Corded & cordless industrial drills, angle grinders, rotary hammers, and impact drivers', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/categories/power-tools.jpg', 1, true),
  ('44444444-4444-4444-a444-444444444442', 'Hand Tools', 'hand-tools', NULL, 'Heavy-duty spanners, socket sets, pliers, screwdrivers, and torque wrenches', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/categories/hand-tools.jpg', 2, true),
  ('44444444-4444-4444-a444-444444444443', 'Measuring Instruments', 'measuring-instruments', NULL, 'Precision laser distance meters, digital calipers, micrometers, and dial gauges', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/categories/measuring.jpg', 3, true),
  ('44444444-4444-4444-a444-444444444444', 'Testing Equipment', 'testing-equipment', NULL, 'CAT IV Digital multimeters, clamp meters, insulation testers, and thermal cameras', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/categories/testing.jpg', 4, true),
  ('44444444-4444-4444-a444-444444444445', 'Safety Equipment', 'safety-equipment', NULL, 'IS-certified safety helmets, high-visibility jackets, protective gloves, and safety shoes', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/categories/safety.jpg', 5, true),
  ('44444444-4444-4444-a444-444444444446', 'Electrical Tools', 'electrical-tools', NULL, 'Cable crimping tools, wire strippers, conduit benders, and VDE insulated hand tools', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/categories/electrical.jpg', 6, true)
ON CONFLICT (id) DO NOTHING;

-- 5. PRODUCTS
INSERT INTO products (
  id, category_id, brand_id, source_vendor_id, parent_product_id,
  sku, source_model_no, name, slug, product_type,
  short_description, description, specifications,
  pricing_type, price, compare_at_price, hsn_code, tax_rate,
  minimum_order_quantity, weight, dimensions, seo_title, seo_description, meta_keywords,
  is_purchasable, is_featured, is_active
) VALUES
  (
    '55555555-5555-4555-a555-555555555551',
    '44444444-4444-4444-a444-444444444441', -- Power Tools
    '33333333-3333-4333-a333-333333333331', -- Bosch
    '22222222-2222-4222-a222-222222222221', -- G-Tech
    NULL,
    'GTH-BOS-GBH228',
    'GBH 2-28 DV',
    'Bosch GBH 2-28 DV Professional Rotary Hammer Drill 850W',
    'bosch-gbh-2-28-dv-rotary-hammer',
    'PRODUCT',
    '850W heavy-duty SDS Plus rotary hammer with Vibration Control and kickback safety control.',
    'The Bosch GBH 2-28 DV Professional is the most powerful SDS Plus rotary hammer in its class. Featuring an 850W motor delivering 3.2 Joules of impact energy, integrated Vibration Control for comfortable operation, and robust magnesium gear housing.',
    '{"power_input_w": 850, "impact_energy_j": 3.2, "chuck_type": "SDS Plus", "max_drilling_concrete_mm": 28, "weight_kg": 3.1}',
    'FIXED', 14500.00, 17800.00, '84672100', 18.00,
    1, 3.1, '402x216x105 mm',
    'Bosch GBH 2-28 DV Rotary Hammer 850W SDS Plus | Galaxy Tools Hub',
    'Buy authentic Bosch GBH 2-28 DV 850W SDS Plus Rotary Hammer with GST Invoice and manufacturer warranty.',
    'bosch rotary hammer, gbh 2-28 dv, sds plus drill, power tools mumbai',
    true, true, true
  ),
  (
    '55555555-5555-4555-a555-555555555552',
    '44444444-4444-4444-a444-444444444441', -- Power Tools
    '33333333-3333-4333-a333-333333333332', -- Makita
    '22222222-2222-4222-a222-222222222221', -- G-Tech
    NULL,
    'GTH-MAK-GA5030',
    'GA5030R',
    'Makita GA5030R 125mm Angle Grinder 720W with Soft Start',
    'makita-ga5030r-125mm-angle-grinder',
    'PRODUCT',
    'Compact 720W 125mm angle grinder with anti-restart protection and ergonomic barrel grip.',
    'Makita GA5030R delivers industrial performance in an ultra-compact body weighing only 1.8kg. Designed for heavy fabrication metal grinding, weld seam preparation, and masonry cutting.',
    '{"power_input_w": 720, "wheel_diameter_mm": 125, "no_load_speed_rpm": 11000, "spindle_thread": "M14", "weight_kg": 1.8}',
    'FIXED', 4200.00, 5100.00, '84672900', 18.00,
    1, 1.8, '266x138x103 mm',
    'Makita GA5030R 125mm Angle Grinder 720W | Galaxy Tools Hub',
    'Order Makita GA5030R 125mm Angle Grinder with soft start and anti-restart safety features.',
    'makita angle grinder, ga5030r, 125mm grinder, fabrication power tools',
    true, true, true
  ),
  (
    '55555555-5555-4555-a555-555555555553',
    '44444444-4444-4444-a444-444444444444', -- Testing Equipment
    '33333333-3333-4333-a333-333333333334', -- Fluke
    '22222222-2222-4222-a222-222222222223', -- HTC
    NULL,
    'GTH-FLU-179',
    'Fluke 179',
    'Fluke 179 True-RMS Industrial Digital Multimeter with Temperature',
    'fluke-179-true-rms-digital-multimeter',
    'PRODUCT',
    'CAT IV 600V / CAT III 1000V True-RMS Digital Multimeter with built-in thermometer.',
    'The Fluke 179 True-RMS Digital Multimeter is the industry benchmark for plant troubleshooting. Provides accurate AC current and voltage measurements on non-linear signals with frequency, capacitance, resistance, continuity, and diode test capabilities.',
    '{"safety_rating": "CAT IV 600V / CAT III 1000V", "dc_voltage_max": 1000, "ac_voltage_max": 1000, "temp_range_c": "-40 to +400", "display_counts": 6000}',
    'FIXED', 32500.00, 36000.00, '90303100', 18.00,
    1, 0.42, '185x90x43 mm',
    'Fluke 179 True-RMS Digital Multimeter | Galaxy Tools Hub',
    'Industrial Fluke 179 True-RMS DMM with temperature probe. Official warranty and calibration certificate.',
    'fluke 179, digital multimeter, true rms meter, electrical testing tools',
    true, true, true
  ),
  (
    '55555555-5555-4555-a555-555555555554',
    '44444444-4444-4444-a444-444444444442', -- Hand Tools
    '33333333-3333-4333-a333-333333333336', -- Taparia
    '22222222-2222-4222-a222-222222222224', -- Galaxy Direct
    NULL,
    'GTH-TAP-S14H',
    'S14H Set',
    'Taparia 1/2 Inch Drive Socket Set (26 Pieces Forged Steel)',
    'taparia-1-2-inch-socket-set-26-pcs',
    'PRODUCT',
    '26-piece chrome vanadium steel socket set with quick release 72-tooth ratchet handle.',
    'Taparia S14H 26-piece 1/2" drive socket set is manufactured from high-grade drop-forged Chrome Vanadium steel, fully hardened and tempered. Includes sockets from 10mm to 32mm, extension bars, universal joint, and heavy metal carry case.',
    '{"drive_size_inch": "1/2", "total_pieces": 26, "material": "Chrome Vanadium Steel", "finish": "Chrome Plated", "case_material": "Steel"}',
    'FIXED', 3850.00, 4500.00, '82042000', 18.00,
    1, 4.5, '450x200x50 mm',
    'Taparia 1/2 Inch Socket Set 26 Pcs (S14H) | Galaxy Tools Hub',
    'Buy Taparia S14H 26 Pcs 1/2 Inch Drive Socket Set at direct industrial prices with GST invoice.',
    'taparia socket set, s14h socket set, 1/2 drive ratchet, hand tools india',
    true, false, true
  )
ON CONFLICT (id) DO NOTHING;

-- 6. PRODUCT IMAGES
INSERT INTO product_images (id, product_id, storage_path, public_url, alt_text, sort_order, is_primary) VALUES
  ('66666666-6666-4666-a666-666666666661', '55555555-5555-4555-a555-555555555551', 'products/bosch-gbh2-28-main.jpg', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/bosch-gbh2-28-main.jpg', 'Bosch GBH 2-28 DV Rotary Hammer Main View', 1, true),
  ('66666666-6666-4666-a666-666666666662', '55555555-5555-4555-a555-555555555552', 'products/makita-ga5030-main.jpg', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/makita-ga5030-main.jpg', 'Makita GA5030R 125mm Angle Grinder', 1, true),
  ('66666666-6666-4666-a666-666666666663', '55555555-5555-4555-a555-555555555553', 'products/fluke-179-main.jpg', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/fluke-179-main.jpg', 'Fluke 179 True-RMS Digital Multimeter', 1, true),
  ('66666666-6666-4666-a666-666666666664', '55555555-5555-4555-a555-555555555554', 'products/taparia-s14h-main.jpg', 'https://rxpkvexhvbzbtdeacjyt.supabase.co/storage/v1/object/public/products/taparia-s14h-main.jpg', 'Taparia 26 Pcs 1/2 Inch Drive Socket Set', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 7. INVENTORY
INSERT INTO inventory (id, product_id, quantity, reserved_quantity, reorder_level) VALUES
  ('77777777-7777-4777-a777-777777777771', '55555555-5555-4555-a555-555555555551', 25, 0, 5),
  ('77777777-7777-4777-a777-777777777772', '55555555-5555-4555-a555-555555555552', 50, 2, 10),
  ('77777777-7777-4777-a777-777777777773', '55555555-5555-4555-a555-555555555553', 10, 0, 2),
  ('77777777-7777-4777-a777-777777777774', '55555555-5555-4555-a555-555555555554', 100, 5, 15)
ON CONFLICT (product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

COMMIT;
