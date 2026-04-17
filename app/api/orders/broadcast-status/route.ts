import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderIdsParam = searchParams.get("orderIds") || "";

    if (!orderIdsParam) {
      return NextResponse.json({});
    }

    const orderIds = orderIdsParam
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);

    if (orderIds.length === 0) {
      return NextResponse.json({});
    }

    const sql = getDb();

    const rows = await sql`
      SELECT DISTINCT ON (nl.order_id, nl.template_id)
        nl.order_id AS "orderId",
        nl.template_id AS "templateId",
        nt.name AS "templateName",
        nl.status,
        nl.created_at AS "sentAt"
      FROM notif_logs nl
      LEFT JOIN notif_templates nt ON nt.id = nl.template_id
      WHERE nl.order_id = ANY(${orderIds})
        AND nl.status = 'SENT'
      ORDER BY nl.order_id, nl.template_id, nl.created_at DESC
    `;

    const statusMap: Record<
      number,
      Array<{ templateId: number; templateName: string; sentAt: string }>
    > = {};

    for (const row of rows as any[]) {
      const oid = Number(row.orderId);
      if (!statusMap[oid]) statusMap[oid] = [];
      statusMap[oid].push({
        templateId: Number(row.templateId),
        templateName: row.templateName || `Template #${row.templateId}`,
        sentAt: row.sentAt,
      });
    }

    return NextResponse.json(statusMap);
  } catch (error) {
    console.error("API Broadcast Status Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
