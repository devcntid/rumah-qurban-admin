import { NextResponse } from "next/server";
import { listStandaloneTransactions } from "@/lib/db/queries/transactions";

export async function GET() {
  const transactions = await listStandaloneTransactions();
  return NextResponse.json(transactions);
}
