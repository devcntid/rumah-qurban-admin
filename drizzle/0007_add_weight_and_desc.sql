ALTER TABLE "catalog_offers" ADD COLUMN IF NOT EXISTS "weight_range" varchar(50);--> statement-breakpoint
ALTER TABLE "catalog_offers" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "transaction_date" timestamp DEFAULT now();