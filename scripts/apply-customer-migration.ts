import { getDb } from "../lib/db/client";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

async function applyMigration() {
  const sql = getDb();
  
  console.log("🔄 Applying customer migration manually...\n");
  
  try {
    // Check if customers table exists
    const checkTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      )
    ` as any[];
    
    const tableExists = checkTable[0]?.exists;
    
    if (!tableExists) {
      console.log("📝 Creating customers table...");
      await sql`
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
        )
      `;
      console.log("✅ customers table created");
      
      console.log("📝 Creating indexes...");
      await sql`CREATE UNIQUE INDEX "customers_phone_normalized_uniq" ON "customers" USING btree ("phone_normalized")`;
      await sql`CREATE INDEX "idx_customers_last_order" ON "customers" USING btree ("last_order_date")`;
      await sql`CREATE INDEX "idx_customers_total_spent" ON "customers" USING btree ("total_spent")`;
      console.log("✅ Indexes created");
    } else {
      console.log("ℹ️  customers table already exists");
    }
    
    // Check if customer_id column exists in orders
    const checkColumn = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'customer_id'
      )
    ` as any[];
    
    const columnExists = checkColumn[0]?.exists;
    
    if (!columnExists) {
      console.log("\n📝 Adding customer_id column to orders...");
      await sql`ALTER TABLE "orders" ADD COLUMN "customer_id" bigint`;
      console.log("✅ customer_id column added");
      
      console.log("📝 Creating foreign key...");
      await sql`
        ALTER TABLE "orders" 
        ADD CONSTRAINT "orders_customer_id_customers_id_fk" 
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") 
        ON DELETE no action ON UPDATE no action
      `;
      console.log("✅ Foreign key created");
      
      console.log("📝 Creating index on customer_id...");
      await sql`CREATE INDEX "idx_orders_customer_id" ON "orders" USING btree ("customer_id")`;
      console.log("✅ Index created");
    } else {
      console.log("ℹ️  customer_id column already exists in orders");
    }
    
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

applyMigration().catch(console.error);
