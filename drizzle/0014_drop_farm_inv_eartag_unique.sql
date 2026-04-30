-- Allow duplicate eartag_id across rows (e.g. same tag, different animal variant).
-- generated_id remains the unique business identifier.
ALTER TABLE "farm_inventories" DROP CONSTRAINT IF EXISTS "farm_inventories_eartag_id_unique";
--> statement-breakpoint
ALTER TABLE "farm_inventories" DROP CONSTRAINT IF EXISTS "farm_inventories_eartag_id_key";
--> statement-breakpoint
DROP INDEX IF EXISTS "farm_inventories_eartag_uniq";
--> statement-breakpoint
DROP INDEX IF EXISTS "farm_inventories_eartag_id_unique";
