import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q) return NextResponse.json([]);

    const sql = getDb();
    const s = `%${q}%`;
    
    // Search orders and include items
    const orders = await sql`
      SELECT 
        o.id, 
        o.invoice_number as "invoiceNumber", 
        o.customer_name as "customerName",
        b.name as "branchName"
      FROM orders o
      JOIN branches b ON b.id = o.branch_id
      WHERE o.invoice_number ILIKE ${s} OR o.customer_name ILIKE ${s}
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    // Fetch items for each order
    const results = await Promise.all((orders as any[]).map(async (o: any) => {
      const items = await sql`
        SELECT id, item_name as "itemName", item_type as "itemType", quantity
        FROM order_items
        WHERE order_id = ${o.id} AND catalog_offer_id IS NOT NULL
      `;
      return { ...o, items };
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("API Search Orders Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
