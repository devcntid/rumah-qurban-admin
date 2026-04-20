import { NextResponse } from "next/server";
import { matchTransactionToOrder } from "@/lib/db/queries/transactions";
import { flushRedisCache } from "@/lib/cache/redis";

export async function POST(req: Request) {
  try {
    const { transactionId, orderId } = await req.json();
    
    if (!transactionId || !orderId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await matchTransactionToOrder(Number(transactionId), Number(orderId));
    await flushRedisCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Match transaction error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
