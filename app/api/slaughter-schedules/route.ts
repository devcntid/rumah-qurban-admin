import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  listSlaughterSchedules,
  getUnassignedOrderItems,
} from "@/lib/db/queries/slaughter-schedules";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");

  if (action === "unassigned-items") {
    const branchId = Number(searchParams.get("branchId"));
    const q = searchParams.get("q") || undefined;
    if (!branchId) {
      return NextResponse.json({ error: "branchId required" }, { status: 400 });
    }
    const items = await getUnassignedOrderItems({ branchId, q });
    return NextResponse.json({ items });
  }

  const branchId = searchParams.get("branchId")
    ? Number(searchParams.get("branchId"))
    : session.role !== "SUPER_ADMIN"
      ? session.branchId
      : undefined;
  const status = searchParams.get("status") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const limit = Number(searchParams.get("limit")) || 20;
  const offset = Number(searchParams.get("offset")) || 0;

  const { rows, total } = await listSlaughterSchedules({
    branchId,
    status,
    startDate,
    endDate,
    limit,
    offset,
  });

  return NextResponse.json({ schedules: rows, total });
}
