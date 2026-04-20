import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { deleteSalesAgent, listSalesAgents, upsertSalesAgent } from "@/lib/db/queries/master";
import { flushRedisCache } from "@/lib/cache/redis";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listSalesAgents();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body?.id ? Number(body.id) : undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!name || !category || !phone) {
    return NextResponse.json({ error: "Nama, kategori, dan telepon wajib diisi" }, { status: 400 });
  }

  await upsertSalesAgent({ id, name, category, phone });
  await flushRedisCache();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await deleteSalesAgent(Math.trunc(id));
  await flushRedisCache();
  return NextResponse.json({ ok: true });
}
