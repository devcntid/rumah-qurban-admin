import { NextResponse } from "next/server";
import { listAvailableAnimalsForOrderItem } from "@/lib/db/queries/farm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const { orderItemId } = await params;
    const items = await listAvailableAnimalsForOrderItem(Number(orderItemId));
    return NextResponse.json(items);
  } catch (error) {
    console.error("API Available Animals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
