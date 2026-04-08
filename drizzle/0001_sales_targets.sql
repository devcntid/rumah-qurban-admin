-- Add targets module storage

CREATE TABLE IF NOT EXISTS sales_targets (
  id BIGSERIAL PRIMARY KEY,
  branch_id BIGINT NOT NULL REFERENCES branches(id),
  year INT NOT NULL,
  season VARCHAR(50),
  species VARCHAR(50) NOT NULL, -- 'SAPI' | 'DOMBA' | 'KAMBING'
  category VARCHAR(20) NOT NULL, -- 'QA' | 'QB' | 'QK'
  target_ekor INT NOT NULL DEFAULT 0,
  target_omset NUMERIC(15,2) NOT NULL DEFAULT 0,
  target_hpp NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS sales_targets_branch_year_species_category_uniq
  ON sales_targets(branch_id, year, species, category);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_sales_targets_branch_year ON sales_targets(branch_id, year);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_sales_targets_species_category ON sales_targets(species, category);
--> statement-breakpoint

