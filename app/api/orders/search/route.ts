import { NextResponse } from "next/server";
import { searchOrders } from "@/lib/db/queries/orders";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const term = searchParams.get("term");

  if (!term || term.length < 3) {
    return NextResponse.json([]);
  }

  const orders = await searchOrders(term);
  return NextResponse.json(orders);
}
