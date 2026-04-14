CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"phone_normalized" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(100),
	"customer_type" varchar(10) DEFAULT 'B2C',
	"company_name" varchar(150),
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent" numeric(15, 2) DEFAULT '0' NOT NULL,
	"first_order_date" timestamp,
	"last_order_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_phone_normalized_unique" UNIQUE("phone_normalized")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_id" bigint;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_phone_normalized_uniq" ON "customers" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "idx_customers_last_order" ON "customers" USING btree ("last_order_date");--> statement-breakpoint
CREATE INDEX "idx_customers_total_spent" ON "customers" USING btree ("total_spent");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_customer_id" ON "orders" USING btree ("customer_id");