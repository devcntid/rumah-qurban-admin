-- Baseline schema for Rumah Qurban (from refs/rq.sql), adapted for idempotent seeding.
-- Notes:
-- - orders/transactions are partitioned by created_at
-- - add supporting unique indexes for seed upserts

-- =============================================================================
-- MASTER TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  coa_code VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS branches_name_uniq ON branches(name);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS vendors (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS vendors_name_uniq ON vendors(name);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS sales_agents (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS sales_agents_name_uniq ON sales_agents(name);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS animal_types (
  id BIGSERIAL PRIMARY KEY,
  species VARCHAR(50) NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS animal_types_species_type_name_uniq
  ON animal_types(species, type_name);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  coa_code VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS payment_instructions (
  id BIGSERIAL PRIMARY KEY,
  payment_method_code VARCHAR(50) NOT NULL REFERENCES payment_methods(code) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  instruction_steps TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS payment_instructions_method_channel_uniq
  ON payment_instructions(payment_method_code, channel);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS pricing_matrix (
  id BIGSERIAL PRIMARY KEY,
  branch_id BIGINT REFERENCES branches(id),
  vendor_id BIGINT REFERENCES vendors(id),
  animal_type_id BIGINT REFERENCES animal_types(id),
  min_weight DECIMAL(5,2),
  max_weight DECIMAL(5,2),
  base_price NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS pricing_matrix_compound_uniq
  ON pricing_matrix(branch_id, vendor_id, animal_type_id, min_weight, max_weight);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  animal_type_id BIGINT REFERENCES animal_types(id),
  target_quota INT DEFAULT 1,
  current_quota INT DEFAULT 0,
  price NUMERIC(15,2) NOT NULL,
  coa_code VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS products_name_uniq ON products(name);
--> statement-breakpoint

-- =============================================================================
-- TRANSACT TABLES (PARTITIONED)
-- =============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL,
  invoice_number VARCHAR(50) NOT NULL,
  branch_id BIGINT REFERENCES branches(id),
  sales_agent_id BIGINT REFERENCES sales_agents(id),

  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  delivery_address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  transaction_type VARCHAR(50) NOT NULL,
  source_of_info VARCHAR(100),
  promo_code VARCHAR(50),
  order_notes TEXT,

  subtotal NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  dp_amount NUMERIC(15,2) DEFAULT 0,
  remaining_amount NUMERIC(15,2) DEFAULT 0,

  status VARCHAR(50) NOT NULL,
  delivery_order_url TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_created_uniq ON orders(invoice_number, created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS orders_y2025m05 PARTITION OF orders
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS orders_y2025m06 PARTITION OF orders
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS orders_y2026m05 PARTITION OF orders
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS orders_y2026m06 PARTITION OF orders
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL,
  order_id BIGINT NOT NULL,
  payment_method_code VARCHAR(50) REFERENCES payment_methods(code),
  payment_category VARCHAR(50) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  va_number VARCHAR(100),
  qr_code_url TEXT,
  payment_gateway_url TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS transactions_y2025m05 PARTITION OF transactions
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS transactions_y2025m06 PARTITION OF transactions
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS transactions_y2026m05 PARTITION OF transactions
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS transactions_y2026m06 PARTITION OF transactions
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS payment_receipts (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  verifier_notes TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);
--> statement-breakpoint

-- =============================================================================
-- CHILD TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  item_category VARCHAR(50) NOT NULL,
  coa_code VARCHAR(50),
  product_id BIGINT REFERENCES products(id),
  animal_type_id BIGINT REFERENCES animal_types(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_order_items_animal_type_id ON order_items(animal_type_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS order_participants (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  participant_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150) NOT NULL,
  certificate_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_order_participants_order_id ON order_participants(order_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS farm_inventories (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT REFERENCES vendors(id),
  animal_type_id BIGINT REFERENCES animal_types(id),
  eartag_id VARCHAR(50) NOT NULL,
  weight DECIMAL(5,2),
  status VARCHAR(50) NOT NULL,
  order_id BIGINT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS farm_inventories_eartag_uniq ON farm_inventories(eartag_id);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_farm_inv_vendor_id ON farm_inventories(vendor_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_farm_inv_animal_type_id ON farm_inventories(animal_type_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_farm_inv_order_id ON farm_inventories(order_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_farm_inv_eartag_id ON farm_inventories(eartag_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_farm_inv_status ON farm_inventories(status);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS slaughter_documentations (
  id BIGSERIAL PRIMARY KEY,
  farm_inventory_id BIGINT REFERENCES farm_inventories(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL,
  media_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_slaughter_docs_farm_inv_id ON slaughter_documentations(farm_inventory_id);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS logistics (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  scheduled_date DATE,
  vehicle_type VARCHAR(50),
  vehicle_plate VARCHAR(20),
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  instruction_notes TEXT,
  status VARCHAR(50) NOT NULL,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_logistics_order_id ON logistics(order_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_logistics_scheduled_date ON logistics(scheduled_date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_logistics_status ON logistics(status);
--> statement-breakpoint

-- =============================================================================
-- LOG TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL,
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

CREATE TABLE IF NOT EXISTS notif_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  template_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS notif_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT,
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

CREATE TABLE IF NOT EXISTS zains_logs (
  id BIGSERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  payload JSONB,
  response JSONB,
  status_code INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

