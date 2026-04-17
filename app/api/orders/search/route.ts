import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || searchParams.get("term") || "";
    const branch = searchParams.get("branch") || "";
    const branchId = searchParams.get("branchId") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || searchParams.get("startDate") || "";
    const dateTo = searchParams.get("dateTo") || searchParams.get("endDate") || "";
    const pageSize = Math.min(Number(searchParams.get("pageSize")) || 20, 500);
    const sentTemplateId = searchParams.get("sentTemplateId") || "";
    const notSentTemplateId = searchParams.get("notSentTemplateId") || "";

    const sql = getDb();

    const qPattern = `%${q}%`;
    const branchPattern = `%${branch}%`;
    const dateFromBound = dateFrom === "" ? "1970-01-01" : dateFrom;
    const dateToBound = dateTo === "" ? "2099-12-31" : dateTo;
    const sentTplId = sentTemplateId === "" ? 0 : Number(sentTemplateId);
    const notSentTplId = notSentTemplateId === "" ? 0 : Number(notSentTemplateId);

    const orders = await sql`
      SELECT 
        o.id, 
        o.invoice_number as "invoiceNumber", 
        o.customer_name as "customerName",
        o.customer_phone as "customerPhone",
        o.status,
        o.created_at as "createdAt",
        b.name as "branchName"
      FROM orders o
      JOIN branches b ON b.id = o.branch_id
      WHERE 
        (${q === ""} OR o.invoice_number ILIKE ${qPattern} OR o.customer_name ILIKE ${qPattern} OR o.customer_phone ILIKE ${qPattern})
        AND (${branch === ""} OR b.name ILIKE ${branchPattern})
        AND (${branchId === ""} OR o.branch_id = ${branchId === "" ? 0 : Number(branchId)})
        AND (${status === ""} OR o.status = ${status})
        AND (${dateFrom === ""} OR o.created_at >= ${dateFromBound}::date)
        AND (${dateTo === ""} OR o.created_at <= ${dateToBound}::date + INTERVAL '1 day')
        AND (${sentTemplateId === ""} OR EXISTS (
          SELECT 1 FROM notif_logs nl_sent
          WHERE nl_sent.order_id = o.id
            AND nl_sent.template_id = ${sentTplId}
            AND nl_sent.status = 'SENT'
        ))
        AND (${notSentTemplateId === ""} OR NOT EXISTS (
          SELECT 1 FROM notif_logs nl_not
          WHERE nl_not.order_id = o.id
            AND nl_not.template_id = ${notSentTplId}
            AND nl_not.status = 'SENT'
        ))
      ORDER BY o.created_at DESC
      LIMIT ${pageSize}
    `;

    // Fetch items for each order with allocation info
    const results = await Promise.all((orders as any[]).map(async (o: any) => {
      const items = await sql`
        SELECT 
          oi.id, 
          oi.item_name as "itemName", 
          oi.item_type as "itemType", 
          oi.quantity,
          COUNT(ia.id) as "allocationCount"
        FROM order_items oi
        LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
        WHERE oi.order_id = ${o.id} AND oi.catalog_offer_id IS NOT NULL
        GROUP BY oi.id, oi.item_name, oi.item_type, oi.quantity
      `;
      
      const hasMatches = (items as any[]).some((it: any) => Number(it.allocationCount) > 0);
      
      return { 
        ...o, 
        items: (items as any[]).map((it: any) => ({
          ...it,
          allocationCount: Number(it.allocationCount)
        })),
        hasMatches 
      };
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("API Search Orders Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
