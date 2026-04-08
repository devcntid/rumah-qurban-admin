-- ==============================================================================
-- STRUKTUR DATABASE (DDL) RUMAH QURBAN
-- Target: PostgreSQL / Neon Serverless
-- Fitur: BigSerial, No UUID, No Enum (Varchar), Table Partitioning (Orders & Transactions)
-- Update: Payment Instructions (Multi-channel), VA/QR in Transactions, Multi-media Documentations per Animal
-- ==============================================================================

-- 1. Bersihkan tabel jika sudah ada (untuk keperluan re-seed)
DROP TABLE IF EXISTS zains_logs CASCADE;
DROP TABLE IF EXISTS notif_logs CASCADE;
DROP TABLE IF EXISTS notif_templates CASCADE;
DROP TABLE IF EXISTS payment_logs CASCADE;
DROP TABLE IF EXISTS slaughter_documentations CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS logistics CASCADE;
DROP TABLE IF EXISTS order_participants CASCADE;
DROP TABLE IF EXISTS farm_inventories CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payment_instructions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS pricing_matrix CASCADE;
DROP TABLE IF EXISTS animal_types CASCADE;
DROP TABLE IF EXISTS sales_agents CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- ==============================================================================
-- MASTER TABLES
-- ==============================================================================

-- Tabel Cabang (Branches)
CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    coa_code VARCHAR(50), -- FIELD BARU: Chart of Account untuk Cabang
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Vendor / Kandang (Farm)
CREATE TABLE vendors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Sales / Closer / Mitra
CREATE TABLE sales_agents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'MITRA', 'AGEN', 'TELEMARKETING', 'DIGITAL_ADS'
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Jenis & Tipe Hewan
CREATE TABLE animal_types (
    id BIGSERIAL PRIMARY KEY,
    species VARCHAR(50) NOT NULL, -- e.g., 'SAPI', 'DOMBA', 'KAMBING'
    type_name VARCHAR(100) NOT NULL, -- e.g., 'Sapi 1/7', 'Domba Tipe B'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Metode Pembayaran
CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'CASH', 'TF_MANDIRI', 'XENDIT_VA_MANDIRI'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'OFFLINE_CASH', 'MANUAL_TRANSFER', 'VIRTUAL_ACCOUNT', 'EWALLET'
    coa_code VARCHAR(50), -- FIELD BARU: Chart of Account untuk Akun Kas/Bank
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Instruksi Pembayaran (Multi-Channel: ATM, M-Banking, dll)
CREATE TABLE payment_instructions (
    id BIGSERIAL PRIMARY KEY,
    payment_method_code VARCHAR(50) REFERENCES payment_methods(code) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- e.g., 'ATM', 'MBANKING', 'IBANKING', 'ALFAMART'
    instruction_steps TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pricing Matrix (Harga Dinamis per Kg)
CREATE TABLE pricing_matrix (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT REFERENCES branches(id),
    vendor_id BIGINT REFERENCES vendors(id),
    animal_type_id BIGINT REFERENCES animal_types(id),
    min_weight DECIMAL(5,2),
    max_weight DECIMAL(5,2),
    base_price NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Master Produk (Untuk Qurban Berbagi / Kaleng yang memiliki kuota)
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'ANTAR', 'BERBAGI', 'KALENG'
    animal_type_id BIGINT REFERENCES animal_types(id),
    target_quota INT DEFAULT 1,
    current_quota INT DEFAULT 0,
    price NUMERIC(15,2) NOT NULL,
    coa_code VARCHAR(50), -- FIELD BARU: Chart of Account untuk Pendapatan Produk
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- TRANSACT TABLES (PARTITIONED)
-- ==============================================================================

-- Tabel Utama Pesanan (Orders) - DIPARTISI BERDASARKAN WAKTU
CREATE TABLE orders (
    id BIGSERIAL,
    invoice_number VARCHAR(50) NOT NULL,
    branch_id BIGINT REFERENCES branches(id),
    sales_agent_id BIGINT REFERENCES sales_agents(id), 
    
    -- Data Pelanggan
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    delivery_address TEXT,
    latitude DECIMAL(10,8),  -- FIELD BARU: Koordinat Peta Pengiriman
    longitude DECIMAL(11,8), -- FIELD BARU: Koordinat Peta Pengiriman
    
    -- Meta Checkout
    transaction_type VARCHAR(50) NOT NULL, -- e.g., 'ONLINE', 'OFFLINE'
    source_of_info VARCHAR(100),
    promo_code VARCHAR(50),
    order_notes TEXT,
    
    -- Keuangan (Disederhanakan, Rincian pindah ke Order Items)
    subtotal NUMERIC(15,2) NOT NULL,
    discount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    
    -- Skema DP & Pelunasan
    dp_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) NOT NULL, -- e.g., 'PENDING', 'DP_PAID', 'FULL_PAID', 'PROCESSING', 'SLAUGHTERED'
    delivery_order_url TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partisi Bulanan untuk Tabel Orders
CREATE TABLE orders_y2025m05 PARTITION OF orders FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE orders_y2025m06 PARTITION OF orders FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE orders_y2026m05 PARTITION OF orders FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE orders_y2026m06 PARTITION OF orders FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Tabel Transaksi / Pembayaran - DIPARTISI BERDASARKAN WAKTU
CREATE TABLE transactions (
    id BIGSERIAL,
    order_id BIGINT NOT NULL,
    payment_method_code VARCHAR(50) REFERENCES payment_methods(code),
    payment_category VARCHAR(50) NOT NULL, -- e.g., 'DOWN_PAYMENT', 'SETTLEMENT', 'FULL_PAYMENT'
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'
    
    -- Pembayaran Eksternal / Gateway
    va_number VARCHAR(100), -- Nomor Virtual Account (VA)
    qr_code_url TEXT,       -- URL / string payload QRIS
    payment_gateway_url TEXT,
    
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partisi Bulanan untuk Tabel Transactions
CREATE TABLE transactions_y2025m05 PARTITION OF transactions FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE transactions_y2025m06 PARTITION OF transactions FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE transactions_y2026m05 PARTITION OF transactions FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE transactions_y2026m06 PARTITION OF transactions FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Tabel Bukti Transfer (Menampung Upload Lampiran Pembayaran Manual)
CREATE TABLE payment_receipts (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL, -- Merujuk ke transaksi
    file_url TEXT NOT NULL,         -- URL gambar/PDF dari Vercel Blob Storage
    status VARCHAR(50) DEFAULT 'PENDING', -- e.g., 'PENDING', 'APPROVED', 'REJECTED'
    verifier_notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);

-- ==============================================================================
-- CHILD TABLES (Logistics, Items, Logs, Documentations)
-- ==============================================================================

-- Index manual untuk Order ID karena Strict FK dihilangkan untuk table partisi
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_participants_order_id ON order_participants(order_id);
CREATE INDEX idx_logistics_order_id ON logistics(order_id);
CREATE INDEX idx_transactions_order_id ON transactions(order_id);

-- Index Tambahan untuk Relasi pada Child Tables
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_animal_type_id ON order_items(animal_type_id);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    item_category VARCHAR(50) NOT NULL, -- e.g., 'ANIMAL_PRODUCT', 'SHIPPING_FEE', 'SLAUGHTER_FEE' (Pemisah COA Keuangan)
    coa_code VARCHAR(50), -- FIELD BARU: Capture COA saat transaksi terjadi agar historis tidak berubah
    product_id BIGINT REFERENCES products(id),
    animal_type_id BIGINT REFERENCES animal_types(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_participants (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    participant_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150) NOT NULL,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farm_inventories (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT REFERENCES vendors(id),
    animal_type_id BIGINT REFERENCES animal_types(id),
    eartag_id VARCHAR(50) NOT NULL,
    weight DECIMAL(5,2),
    status VARCHAR(50) NOT NULL, -- e.g., 'AVAILABLE', 'BOOKED', 'SLAUGHTERED'
    order_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk Inventaris Kandang (Pencarian Tag & Filter Kandang)
CREATE INDEX idx_farm_inv_vendor_id ON farm_inventories(vendor_id);
CREATE INDEX idx_farm_inv_animal_type_id ON farm_inventories(animal_type_id);
CREATE INDEX idx_farm_inv_order_id ON farm_inventories(order_id);
CREATE INDEX idx_farm_inv_eartag_id ON farm_inventories(eartag_id);
CREATE INDEX idx_farm_inv_status ON farm_inventories(status);

-- Tabel Multi-Dokumentasi Per Hewan
CREATE TABLE slaughter_documentations (
    id BIGSERIAL PRIMARY KEY,
    farm_inventory_id BIGINT REFERENCES farm_inventories(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- e.g., 'IMAGE', 'VIDEO'
    media_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_slaughter_docs_farm_inv_id ON slaughter_documentations(farm_inventory_id);

CREATE TABLE logistics (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    scheduled_date DATE,
    vehicle_type VARCHAR(50),
    vehicle_plate VARCHAR(20),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    instruction_notes TEXT,
    status VARCHAR(50) NOT NULL, -- e.g., 'PREPARING', 'ON_DELIVERY', 'DELIVERED'
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk Logistik (Filter tanggal pengiriman & status)
CREATE INDEX idx_logistics_scheduled_date ON logistics(scheduled_date);
CREATE INDEX idx_logistics_status ON logistics(status);

-- ==============================================================================
-- LOG TABLES
-- ==============================================================================

CREATE TABLE payment_logs (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    reference_id VARCHAR(100),
    log_type VARCHAR(50), -- e.g., 'CREATE_INVOICE', 'WEBHOOK_CALLBACK'
    payload JSONB,
    response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_logs_transaction_id ON payment_logs(transaction_id);
CREATE INDEX idx_payment_logs_reference_id ON payment_logs(reference_id);

CREATE TABLE notif_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    template_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notif_logs (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    template_id BIGINT REFERENCES notif_templates(id),
    target_number VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'SENT', 'FAILED', 'PENDING'
    payload JSONB, 
    provider_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_logs_order_id ON notif_logs(order_id);
CREATE INDEX idx_notif_logs_target_number ON notif_logs(target_number);

CREATE TABLE zains_logs (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    payload JSONB,
    response JSONB,
    status_code INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==============================================================================
-- SEED DATA (DML)
-- ==============================================================================

-- Seed Cabang, Vendor, Sales
INSERT INTO branches (name, address) VALUES 
('Bandung Raya', 'Jl. Golf Barat Raya No 36, Arcamanik, Bandung'),
('Jakarta Raya', 'Jl. Malaka Raya No.96, Duren Sawit, Jaktim');

INSERT INTO vendors (name, location) VALUES 
('Kandang Pusat Sukamiskin', 'Bandung'),
('Mitra Gembong Farm', 'Kabupaten Bekasi');

INSERT INTO sales_agents (name, category, phone_number) VALUES 
('Agro Great Indoberkah', 'KEMITRAAN', '08123456789'),
('Tim Telemarketing Internal', 'TELEMARKETING', NULL);

-- Seed Jenis Hewan & Pricing
INSERT INTO animal_types (species, type_name, description) VALUES 
('DOMBA', 'Domba Tipe B', 'Domba berat 23-25 Kg');

INSERT INTO pricing_matrix (branch_id, vendor_id, animal_type_id, min_weight, max_weight, base_price) VALUES 
(1, 1, 1, 23.00, 25.00, 2100000), 
(2, 2, 1, 23.00, 25.00, 3300000); 

-- Seed Master Payment Methods
INSERT INTO payment_methods (code, name, category) VALUES 
('CASH', 'Tunai / Cash', 'OFFLINE_CASH'),
('TF_MANDIRI', 'Transfer Bank Mandiri', 'MANUAL_TRANSFER'),
('XENDIT_VA_MANDIRI', 'Virtual Account Mandiri', 'VIRTUAL_ACCOUNT'),
('XENDIT_QRIS', 'QRIS Dinamis', 'EWALLET');

-- Seed Payment Instructions (Multi-Channel)
INSERT INTO payment_instructions (payment_method_code, channel, instruction_steps) VALUES 
('TF_MANDIRI', 'ATM', '1. Masukkan Kartu ATM\n2. Pilih Transfer -> Antar Rekening\n3. Masukkan Rekening 1310007965835'),
('TF_MANDIRI', 'MBANKING', '1. Buka Livin by Mandiri\n2. Pilih Transfer ke Sesama\n3. Masukkan Rek 1310007965835'),
('XENDIT_VA_MANDIRI', 'ATM', '1. Masukkan Kartu ATM\n2. Pilih Bayar/Beli -> Multipayment\n3. Masukkan Kode VA {{va_number}}'),
('XENDIT_VA_MANDIRI', 'MBANKING', '1. Buka Aplikasi m-Banking\n2. Pilih Bayar -> Multipayment\n3. Masukkan Kode VA {{va_number}}'),
('XENDIT_QRIS', 'ALL', '1. Buka Aplikasi e-Wallet / m-Banking (OVO, Gopay, BCA, dll)\n2. Pilih Menu Scan QR\n3. Scan QR Code yang tersedia di layar.');

-- Seed Orders
INSERT INTO orders (id, invoice_number, branch_id, sales_agent_id, customer_name, customer_phone, customer_email, transaction_type, source_of_info, subtotal, total_amount, dp_amount, remaining_amount, status, created_at) VALUES 
(1, 'INV-20260524001', 1, NULL, 'Hadid Amirul Arifin', '085642420971', 'hadid@gmail.com', 'ONLINE', 'Instagram Ads', 2250000, 2250000, 0, 0, 'FULL_PAID', '2026-05-24 10:00:00'),
(2, 'INV-20260525002', 2, 1, 'Lili Apriliyani', '081317854742', 'lili@gmail.com', 'OFFLINE', 'Referensi Mitra', 3300000, 3300000, 1000000, 2300000, 'DP_PAID', '2026-05-25 14:00:00');

-- Fix sequence untuk orders
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- Seed Order Items & Participants (Termasuk Jasa Sembelih & Ongkir sebagai Item terpisah untuk COA Keuangan)
INSERT INTO order_items (order_id, item_category, animal_type_id, product_name, quantity, unit_price, subtotal) VALUES 
(1, 'ANIMAL_PRODUCT', 1, 'Qurban Antar Domba Tipe B | Bandung', 1, 2100000, 2100000),
(1, 'SLAUGHTER_FEE', NULL, 'Biaya Potong Hewan | Bandung', 1, 100000, 100000),
(1, 'SHIPPING_FEE', NULL, 'Ongkos Kirim Non Aqiqah | Bandung', 1, 50000, 50000),
(2, 'ANIMAL_PRODUCT', 1, 'Qurban Antar Domba Tipe B | Jakarta', 1, 3300000, 3300000);

INSERT INTO order_participants (order_id, participant_name, father_name) VALUES 
(1, 'Hadid Amirul Arifin', 'Redi Waluyo'),
(2, 'Lili Apriliyani', 'Doddy Sebo');

-- Seed Inventaris Kandang (Hewan)
INSERT INTO farm_inventories (id, vendor_id, animal_type_id, eartag_id, weight, status, order_id) VALUES 
(1, 1, 1, 'TAG-2268', 24.5, 'SLAUGHTERED', 1),
(2, 2, 1, 'TAG-2270', 25.1, 'BOOKED', 2);

-- Fix sequence inventaris
SELECT setval('farm_inventories_id_seq', (SELECT MAX(id) FROM farm_inventories));

-- Seed Dokumentasi Penyembelihan (Multi-media per hewan - referensi farm_inventories)
INSERT INTO slaughter_documentations (farm_inventory_id, media_type, media_url) VALUES 
(1, 'IMAGE', 'https://blob.vercel.com/rumahqurban/tag-2268-sebelum-potong.jpg'),
(1, 'IMAGE', 'https://blob.vercel.com/rumahqurban/tag-2268-daging.jpg'),
(1, 'VIDEO', 'https://blob.vercel.com/rumahqurban/tag-2268-proses-sembelih.mp4');

-- Seed Transactions (Dengan VA dan QR)
-- Transaksi 1: Bayar Lunas Online (Menggunakan VA Xendit)
INSERT INTO transactions (order_id, payment_method_code, payment_category, amount, status, va_number, qr_code_url, paid_at, created_at) VALUES 
(1, 'XENDIT_VA_MANDIRI', 'FULL_PAYMENT', 2100000, 'SUCCESS', '8808123456789012', NULL, '2026-05-24 10:05:00', '2026-05-24 10:00:00');

-- Transaksi 2: Bayar DP Manual
INSERT INTO transactions (order_id, payment_method_code, payment_category, amount, status, va_number, qr_code_url, paid_at, created_at) VALUES 
(2, 'TF_MANDIRI', 'DOWN_PAYMENT', 1000000, 'SUCCESS', NULL, NULL, '2026-05-25 14:30:00', '2026-05-25 14:00:00');

-- Transaksi 3: Link Pelunasan (Contoh menggunakan QRIS)
INSERT INTO transactions (order_id, payment_method_code, payment_category, amount, status, va_number, qr_code_url, created_at) VALUES 
(2, 'XENDIT_QRIS', 'SETTLEMENT', 2450000, 'PENDING', NULL, 'https://qris.xendit.co/qr/dynamic_xyz', '2026-05-25 14:35:00');

-- Seed Notif Templates & Logs
INSERT INTO notif_templates (name, template_text) VALUES 
('DP_RECEIVED', 'Halo {{name}}, dana DP sebesar {{dp_amount}} untuk pesanan {{invoice}} telah kami terima. Sisa tagihan {{remaining}}.');

INSERT INTO notif_logs (order_id, template_id, target_number, status, payload, provider_response) VALUES 
(2, 1, '081317854742', 'SENT', '{"name": "Lili Apriliyani", "dp_amount": "Rp 1.000.000", "invoice": "INV-20260525002", "remaining": "Rp 2.450.000"}', '{"message_id": "STARS-12345", "status": "success"}');