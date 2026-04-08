-- Make invoice lines explicitly reference their source:
-- - add-ons / quota products -> order_items.product_id (existing)
-- - animal/offer catalog -> order_items.catalog_offer_id (new)

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS catalog_offer_id BIGINT REFERENCES catalog_offers(id);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_order_items_catalog_offer_id ON order_items(catalog_offer_id);
--> statement-breakpoint

