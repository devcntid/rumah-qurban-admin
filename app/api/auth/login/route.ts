import { NextResponse } from "next/server";
import { encodeSession, sessionCookie, type AdminSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";

export async function POST() {
  const sql = getDb();
  const rows = (await sql`
    SELECT id FROM branches WHERE name = ${"Bandung Raya"} LIMIT 1
  `) as { id: number }[];
  const row = rows[0];
  const branchId =
    row && typeof (row as { id: number }).id === "number"
      ? (row as { id: number }).id
      : 1;

  const session: AdminSession = {
    name: "Super Admin",
    role: "SUPER_ADMIN",
    branchId,
  };

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie.name, encodeSession(session), sessionCookie.options);
  return res;
}
