import { NextResponse } from "next/server";
import { unmatchTransaction } from "@/lib/db/queries/transactions";

export async function POST(req: Request) {
  try {
    const { transactionId } = await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    await unmatchTransaction(transactionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to unmatch transaction", err);
    return NextResponse.json({ error: "Failed to unmatch transaction" }, { status: 500 });
  }
}
