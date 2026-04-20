import { NextResponse } from "next/server";
import { verifyReceipt } from "@/lib/db/queries/transactions";
import { flushRedisCache } from "@/lib/cache/redis";

export async function POST(req: Request) {
  try {
    const { receiptId, status, notes } = await req.json();
    
    if (!receiptId || !status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await verifyReceipt(Number(receiptId), status, notes);
    await flushRedisCache();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify receipt error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
