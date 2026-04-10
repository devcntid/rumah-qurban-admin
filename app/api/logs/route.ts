import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { listGlobalLogs } from "@/lib/db/queries/logs";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await listGlobalLogs(100);
    return NextResponse.json({ rows: logs });
  } catch (err) {
    console.error("Fetch global logs error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
