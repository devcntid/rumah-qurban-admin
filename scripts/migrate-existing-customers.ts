import { getDb } from "../lib/db/client";
import { getOrCreateCustomer } from "../lib/db/queries/customers";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function migrateExistingOrders() {
  const sql = getDb();
  
  console.log("🔍 Fetching orders without customer_id...");
  
  const orders = await sql`
    SELECT 
      id, customer_name, customer_phone, customer_email,
      customer_type, company_name, grand_total, created_at
    FROM orders
    WHERE customer_phone IS NOT NULL
      AND customer_id IS NULL
    ORDER BY created_at ASC
  ` as any[];
  
  console.log(`📊 Found ${orders.length} orders to migrate\n`);
  
  if (orders.length === 0) {
    console.log("✅ No orders to migrate. All done!");
    return;
  }
  
  let success = 0;
  let failed = 0;
  const failedOrders: { id: number; error: string }[] = [];
  
  for (const order of orders) {
    try {
      const customerId = await getOrCreateCustomer({
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        customerType: order.customer_type || 'B2C',
        companyName: order.company_name,
        orderTotal: Number(order.grand_total),
        orderDate: order.created_at,
      });
      
      await sql`UPDATE orders SET customer_id = ${customerId} WHERE id = ${order.id}`;
      console.log(`✓ Order ${order.id} (${order.customer_name}) → Customer ${customerId}`);
      success++;
    } catch (error: any) {
      console.error(`✗ Order ${order.id} failed: ${error.message}`);
      failedOrders.push({ id: order.id, error: error.message });
      failed++;
    }
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📈 Migration Summary:`);
  console.log(`   ✅ Success: ${success} orders`);
  console.log(`   ❌ Failed: ${failed} orders`);
  console.log(`${"=".repeat(60)}`);
  
  if (failedOrders.length > 0) {
    console.log(`\n❌ Failed Orders:`);
    failedOrders.forEach(({ id, error }) => {
      console.log(`   - Order ${id}: ${error}`);
    });
  }
  
  // Show customer stats
  console.log(`\n📊 Customer Stats After Migration:`);
  const stats = await sql`
    SELECT 
      COUNT(*) as total_customers,
      COUNT(*) FILTER (WHERE total_orders = 1) as new_customers,
      COUNT(*) FILTER (WHERE total_orders > 1) as returning_customers,
      ROUND(AVG(total_orders), 2) as avg_orders,
      ROUND(AVG(total_spent::numeric), 0) as avg_spent
    FROM customers
  ` as any[];
  
  const stat = stats[0];
  console.log(`   Total Customers: ${stat.total_customers}`);
  console.log(`   New (1 order): ${stat.new_customers}`);
  console.log(`   Returning (>1 order): ${stat.returning_customers}`);
  console.log(`   Avg Orders per Customer: ${stat.avg_orders}`);
  console.log(`   Avg Spent per Customer: Rp ${Number(stat.avg_spent).toLocaleString("id-ID")}`);
  
  console.log("\n✅ Migration completed!");
}

migrateExistingOrders().catch(console.error);
