-- Catalog offers imported from spreadsheet:
-- price is per branch, even for identical weight range

CREATE TABLE IF NOT EXISTS catalog_offers (
  id BIGSERIAL PRIMARY KEY,
  branch_id BIGINT NOT NULL REFERENCES branches(id),
  vendor_id BIGINT REFERENCES vendors(id),

  product_group VARCHAR(50) NOT NULL, -- e.g. 'Qurban Antar' | 'Qurban Kaleng' | 'Qurban Berbagi'
  animal_species VARCHAR(50), -- e.g. 'Sapi' | 'Domba' | 'Kambing'
  animal_class VARCHAR(50), -- e.g. 'A' | 'B' | 'rendang'
  offer_type VARCHAR(150), -- e.g. 'Qurban Antar Sapi Jawa'
  offer_name VARCHAR(255), -- free text

  image_url TEXT,
  price NUMERIC(15,2),

  weight_text VARCHAR(100),
  min_weight DECIMAL(7,2),
  max_weight DECIMAL(7,2),
  projected_weight DECIMAL(7,2),

  external_animal_id VARCHAR(50),
  location TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS catalog_offers_uniq
  ON catalog_offers(
    branch_id,
    product_group,
    COALESCE(animal_species, ''),
    COALESCE(animal_class, ''),
    COALESCE(offer_type, ''),
    COALESCE(offer_name, ''),
    COALESCE(weight_text, ''),
    COALESCE(external_animal_id, '')
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_catalog_offers_branch_group ON catalog_offers(branch_id, product_group);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_catalog_offers_species_class ON catalog_offers(animal_species, animal_class);
--> statement-breakpoint

