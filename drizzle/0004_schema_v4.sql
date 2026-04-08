-- Rumah Qurban schema V4: spreadsheet/catalog aligned, non-partitioned orders/transactions.
-- Destructive: drops legacy catalog, orders subtree, animal_types, pricing_matrix, old products, logistics, slaughter_documentations.

DROP VIEW IF EXISTS view_spreadsheet_catalog;
--> statement-breakpoint

DROP TABLE IF EXISTS delivery_manifests CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS logistics_trips CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS inventory_allocations CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS animal_trackings CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS slaughter_documentations CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS logistics CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS farm_inventories CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS order_participants CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS order_items CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS payment_receipts CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS payment_logs CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS transactions CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS notif_logs CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS orders CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS catalog_offers CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS products CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS pricing_matrix CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS animal_types CASCADE;
--> statement-breakpoint

ALTER TABLE branches DROP COLUMN IF EXISTS address;
--> statement-breakpoint
ALTER TABLE branches DROP COLUMN IF EXISTS created_at;
--> statement-breakpoint

ALTER TABLE vendors DROP COLUMN IF EXISTS is_active;
--> statement-breakpoint
ALTER TABLE vendors DROP COLUMN IF EXISTS created_at;
--> statement-breakpoint

UPDATE sales_agents SET phone_number = '-' WHERE phone_number IS NULL;
--> statement-breakpoint
ALTER TABLE sales_agents RENAME COLUMN phone_number TO phone;
--> statement-breakpoint
ALTER TABLE sales_agents ALTER COLUMN phone SET NOT NULL;
--> statement-breakpoint

CREATE TABLE animal_variants (
  id BIGSERIAL PRIMARY KEY,
  species VARCHAR(50) NOT NULL,
  class_grade VARCHAR(10),
  weight_range VARCHAR(50),
  description TEXT
);
--> statement-breakpoint

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  requires_shipping BOOLEAN DEFAULT FALSE,
  coa_code VARCHAR(50)
);
--> statement-breakpoint

CREATE TABLE catalog_offers (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id),
  animal_variant_id BIGINT REFERENCES animal_variants(id),
  branch_id BIGINT REFERENCES branches(id),
  vendor_id BIGINT REFERENCES vendors(id),
  display_name VARCHAR(255) NOT NULL,
  sub_type VARCHAR(50),
  sku_code VARCHAR(50),
  projected_weight VARCHAR(50),
  price NUMERIC(15,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE NULLS NOT DISTINCT (product_id, animal_variant_id, branch_id, sub_type)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_catalog_offers_branch ON catalog_offers(branch_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_catalog_offers_product ON catalog_offers(product_id);
--> statement-breakpoint

CREATE TABLE services (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  base_price NUMERIC(15,2) NOT NULL,
  branch_id BIGINT REFERENCES branches(id),
  animal_variant_id BIGINT REFERENCES animal_variants(id),
  coa_code VARCHAR(50)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_services_branch ON services(branch_id);
--> statement-breakpoint

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  branch_id BIGINT REFERENCES branches(id),
  sales_agent_id BIGINT REFERENCES sales_agents(id),
  customer_type VARCHAR(10) DEFAULT 'B2C',
  customer_name VARCHAR(150) NOT NULL,
  company_name VARCHAR(150),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  delivery_address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  subtotal NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  grand_total NUMERIC(15,2) NOT NULL,
  dp_paid NUMERIC(15,2) DEFAULT 0,
  remaining_balance NUMERIC(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
--> statement-breakpoint

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,
  catalog_offer_id BIGINT REFERENCES catalog_offers(id),
  service_id BIGINT REFERENCES services(id),
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  total_price NUMERIC(15,2) NOT NULL,
  coa_code VARCHAR(50)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_order_items_catalog_offer_id ON order_items(catalog_offer_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON order_items(service_id);
--> statement-breakpoint

CREATE TABLE order_participants (
  id BIGSERIAL PRIMARY KEY,
  order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  participant_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_order_participants_order_item_id ON order_participants(order_item_id);
--> statement-breakpoint

CREATE TABLE farm_inventories (
  id BIGSERIAL PRIMARY KEY,
  eartag_id VARCHAR(50) UNIQUE NOT NULL,
  animal_variant_id BIGINT REFERENCES animal_variants(id),
  branch_id BIGINT REFERENCES branches(id),
  vendor_id BIGINT REFERENCES vendors(id),
  weight_actual NUMERIC(6,2),
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'AVAILABLE',
  order_item_id BIGINT REFERENCES order_items(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_farm_inv_branch ON farm_inventories(branch_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_farm_inv_variant ON farm_inventories(animal_variant_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_farm_inv_status ON farm_inventories(status);
--> statement-breakpoint

CREATE TABLE inventory_allocations (
  id BIGSERIAL PRIMARY KEY,
  order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  farm_inventory_id BIGINT NOT NULL REFERENCES farm_inventories(id) ON DELETE CASCADE,
  allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (farm_inventory_id)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_inventory_allocations_order_item ON inventory_allocations(order_item_id);
--> statement-breakpoint

CREATE TABLE animal_trackings (
  id BIGSERIAL PRIMARY KEY,
  farm_inventory_id BIGINT NOT NULL REFERENCES farm_inventories(id) ON DELETE CASCADE,
  milestone VARCHAR(50) NOT NULL,
  description TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  media_url TEXT,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_animal_trackings_farm_inv ON animal_trackings(farm_inventory_id);
--> statement-breakpoint

CREATE TABLE logistics_trips (
  id BIGSERIAL PRIMARY KEY,
  branch_id BIGINT REFERENCES branches(id),
  vehicle_plate VARCHAR(20) NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'PREPARING'
);
--> statement-breakpoint

CREATE TABLE delivery_manifests (
  id BIGSERIAL PRIMARY KEY,
  trip_id BIGINT NOT NULL REFERENCES logistics_trips(id) ON DELETE CASCADE,
  farm_inventory_id BIGINT REFERENCES farm_inventories(id),
  destination_address TEXT,
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  delivery_status VARCHAR(50) DEFAULT 'PENDING'
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_delivery_manifests_trip ON delivery_manifests(trip_id);
--> statement-breakpoint

CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  payment_method_code VARCHAR(50) REFERENCES payment_methods(code),
  transaction_type VARCHAR(50) DEFAULT 'PELUNASAN',
  amount NUMERIC(15,2) NOT NULL,
  va_number VARCHAR(50),
  qr_code_url TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
--> statement-breakpoint

CREATE TABLE payment_receipts (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT REFERENCES transactions(id),
  file_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  verifier_notes TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);
--> statement-breakpoint

CREATE TABLE payment_logs (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reference_id VARCHAR(100),
  log_type VARCHAR(50),
  payload JSONB,
  response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_payment_logs_transaction_id ON payment_logs(transaction_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_payment_logs_reference_id ON payment_logs(reference_id);
--> statement-breakpoint

CREATE TABLE notif_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  template_id BIGINT REFERENCES notif_templates(id),
  target_number VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payload JSONB,
  provider_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_notif_logs_order_id ON notif_logs(order_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_notif_logs_target_number ON notif_logs(target_number);
--> statement-breakpoint

CREATE OR REPLACE VIEW view_spreadsheet_catalog AS
SELECT
  co.id AS "No",
  COALESCE(b.name, '') AS "cabang",
  p.name AS "produk",
  co.image_url AS "url gambar",
  av.species AS "jenis hewan",
  av.class_grade AS "kelas hewan",
  co.sub_type AS "Type",
  co.display_name AS "nama hewan",
  co.price AS "harga",
  av.weight_range AS "berat",
  co.projected_weight AS "proyeksi berat akhir",
  co.sku_code AS "id hewan",
  v.name AS "lokasi",
  v.location AS "vendor"
FROM catalog_offers co
JOIN products p ON co.product_id = p.id
JOIN animal_variants av ON co.animal_variant_id = av.id
LEFT JOIN branches b ON co.branch_id = b.id
LEFT JOIN vendors v ON co.vendor_id = v.id
ORDER BY b.name NULLS LAST, p.id, av.species DESC, av.class_grade ASC NULLS LAST;
--> statement-breakpoint

-- Actuals: orders with status DP_PAID/FULL_PAID, ANIMAL lines with catalog join. Species bucket matches sales_targets.species (SAPI/DOMBA/KAMBING).
CREATE OR REPLACE VIEW target_vs_actual AS
SELECT
  st.id AS sales_target_id,
  st.branch_id,
  st.year,
  st.season,
  st.species,
  st.category AS product_code,
  st.target_ekor,
  st.target_omset,
  st.target_hpp,
  COALESCE(a.actual_ekor, 0)::bigint AS actual_ekor,
  COALESCE(a.actual_omset, 0::numeric) AS actual_omset
FROM sales_targets st
LEFT JOIN (
  SELECT
    o.branch_id,
    EXTRACT(YEAR FROM o.created_at)::int AS yr,
    CASE
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) IN ('SAPI', 'COW') THEN 'SAPI'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) LIKE 'SAPI%' THEN 'SAPI'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) IN ('DOMBA', 'SHEEP') THEN 'DOMBA'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) LIKE 'DOMBA%' THEN 'DOMBA'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) IN ('KAMBING', 'GOAT') THEN 'KAMBING'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) LIKE 'KAMBING%' THEN 'KAMBING'
      ELSE UPPER(TRIM(COALESCE(av.species, '')))
    END AS species_bucket,
    p.code AS product_code,
    SUM(oi.quantity)::bigint AS actual_ekor,
    SUM(oi.total_price)::numeric AS actual_omset
  FROM orders o
  INNER JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN catalog_offers co ON co.id = oi.catalog_offer_id
  LEFT JOIN products p ON p.id = co.product_id
  LEFT JOIN animal_variants av ON av.id = co.animal_variant_id
  WHERE oi.item_type = 'ANIMAL'
    AND o.status IN ('DP_PAID', 'FULL_PAID')
    AND oi.catalog_offer_id IS NOT NULL
    AND p.code IS NOT NULL
  GROUP BY o.branch_id, EXTRACT(YEAR FROM o.created_at),
    CASE
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) IN ('SAPI', 'COW') THEN 'SAPI'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) LIKE 'SAPI%' THEN 'SAPI'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) IN ('DOMBA', 'SHEEP') THEN 'DOMBA'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) LIKE 'DOMBA%' THEN 'DOMBA'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) IN ('KAMBING', 'GOAT') THEN 'KAMBING'
      WHEN UPPER(TRIM(COALESCE(av.species, ''))) LIKE 'KAMBING%' THEN 'KAMBING'
      ELSE UPPER(TRIM(COALESCE(av.species, '')))
    END,
    p.code
) a ON a.branch_id = st.branch_id
  AND a.yr = st.year
  AND a.species_bucket = st.species
  AND a.product_code = st.category;
--> statement-breakpoint

CREATE OR REPLACE VIEW stock_by_branch_variant AS
SELECT
  fi.branch_id,
  fi.animal_variant_id,
  av.species,
  av.class_grade,
  av.weight_range,
  fi.status,
  COUNT(*)::bigint AS head_count,
  COUNT(*) FILTER (
    WHERE fi.order_item_id IS NOT NULL
      OR EXISTS (SELECT 1 FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id)
  )::bigint AS assigned_count,
  COUNT(*) FILTER (
    WHERE fi.status = 'AVAILABLE'
      AND fi.order_item_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id)
  )::bigint AS available_unassigned_count
FROM farm_inventories fi
LEFT JOIN animal_variants av ON av.id = fi.animal_variant_id
GROUP BY fi.branch_id, fi.animal_variant_id, av.species, av.class_grade, av.weight_range, fi.status;
--> statement-breakpoint
