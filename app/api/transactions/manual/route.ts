import { NextResponse } from "next/server";
import { upsertTransaction } from "@/lib/db/queries/transactions";
import { requireSession } from "@/app/api/_utils/session";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount, paymentMethodCode, transactionType, orderId, status, transactionDate } = body;

    if (!amount || !paymentMethodCode) {
      return NextResponse.json({ error: "Amount and payment method are required" }, { status: 400 });
    }

    const id = await upsertTransaction({
      amount: Number(amount),
      paymentMethodCode,
      transactionType: transactionType || "PELUNASAN",
      orderId: orderId ? Number(orderId) : null,
      status: status || "PAID",
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("Manual transaction error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
