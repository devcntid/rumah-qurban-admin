CREATE TABLE "slaughter_records" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"farm_inventory_id" bigint NOT NULL,
	"order_item_id" bigint NOT NULL,
	"slaughtered_at" timestamp NOT NULL,
	"slaughter_location" varchar(255),
	"slaughter_latitude" numeric(10, 8),
	"slaughter_longitude" numeric(11, 8),
	"documentation_photos" jsonb DEFAULT '[]'::jsonb,
	"certificate_url" text,
	"notes" text,
	"performed_by" varchar(150),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "slaughter_records" ADD CONSTRAINT "slaughter_records_farm_inventory_id_farm_inventories_id_fk" FOREIGN KEY ("farm_inventory_id") REFERENCES "public"."farm_inventories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slaughter_records" ADD CONSTRAINT "slaughter_records_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_slaughter_records_farm_inventory" ON "slaughter_records" USING btree ("farm_inventory_id");--> statement-breakpoint
CREATE INDEX "idx_slaughter_records_order_item" ON "slaughter_records" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_slaughter_records_date" ON "slaughter_records" USING btree ("slaughtered_at");