import { NextResponse } from "next/server";
import { toPublicErrorResponse } from "@/app/api/_utils/route-error";
import { requireSession } from "@/app/api/_utils/session";
import { deleteVendor, listVendors, upsertVendor } from "@/lib/db/queries/master";
import { flushRedisCache } from "@/lib/cache/redis";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listVendors();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const id = body?.id ? Number(body.id) : undefined;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const location = typeof body?.location === "string" ? body.location.trim() : null;

    if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

    await upsertVendor({ id, name, location: location || null });
    await flushRedisCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toPublicErrorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await deleteVendor(Math.trunc(id));
    await flushRedisCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toPublicErrorResponse(err);
  }
}
