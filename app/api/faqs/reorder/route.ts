import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { getDb } from "@/lib/db/client";
import { invalidateFaqCache } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updates = body.updates as Array<{ id: number; displayOrder: number }>;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Invalid updates array" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Update display_order for each FAQ
    for (const update of updates) {
      await sql`
        UPDATE faqs
        SET display_order = ${update.displayOrder}, updated_at = NOW()
        WHERE id = ${update.id}
      `;
    }

    // Invalidate cache for all affected products
    const productIds = await sql`
      SELECT DISTINCT product_id FROM faqs WHERE id = ANY(${updates.map(u => u.id)})
    `;
    
    for (const row of productIds as any[]) {
      await invalidateFaqCache(row.product_id);
    }

    revalidatePath("/faqs");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error reordering FAQs:", error);
    return NextResponse.json(
      { error: "Failed to reorder FAQs" },
      { status: 500 }
    );
  }
}
