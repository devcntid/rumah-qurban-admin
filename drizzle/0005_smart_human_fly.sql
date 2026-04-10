CREATE TABLE "farm_pens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "farm_inventories" ADD COLUMN "generated_id" varchar(50);
--> statement-breakpoint
UPDATE "farm_inventories" SET "generated_id" = 'LEGACY-' || id WHERE "generated_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "farm_inventories" ALTER COLUMN "generated_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "farm_inventories" 
ADD COLUMN "farm_animal_id" varchar(50),
ADD COLUMN "entry_date" date,
ADD COLUMN "acquisition_type" varchar(50),
ADD COLUMN "initial_product_type" varchar(100),
ADD COLUMN "pen_id" bigint,
ADD COLUMN "pan_name" varchar(50),
ADD COLUMN "purchase_price" numeric(15, 2),
ADD COLUMN "initial_weight_source" numeric(10, 2),
ADD COLUMN "price_per_kg" numeric(15, 2),
ADD COLUMN "shipping_cost" numeric(15, 2),
ADD COLUMN "total_hpp" numeric(15, 2),
ADD COLUMN "horn_type" varchar(50),
ADD COLUMN "initial_weight" numeric(10, 2),
ADD COLUMN "initial_type" varchar(50),
ADD COLUMN "final_type" varchar(50),
ADD COLUMN "exit_date" date;
--> statement-breakpoint
ALTER TABLE "farm_inventories" ALTER COLUMN "weight_actual" TYPE numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "farm_inventories" ADD CONSTRAINT "farm_inventories_generated_id_unique" UNIQUE("generated_id");
--> statement-breakpoint
ALTER TABLE "farm_inventories" ADD CONSTRAINT "farm_inventories_pen_id_farm_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."farm_pens"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "farm_pens" ADD CONSTRAINT "farm_pens_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_farm_inv_pen" ON "farm_inventories" ("pen_id");
--> statement-breakpoint
CREATE INDEX "idx_farm_inv_farm_animal_id" ON "farm_inventories" ("farm_animal_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "farm_pens_name_branch_uniq" ON "farm_pens" ("name", "branch_id");