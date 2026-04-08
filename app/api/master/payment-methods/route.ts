import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import {
  deletePaymentMethod,
  listPaymentMethods,
  upsertPaymentMethod,
} from "@/lib/db/queries/master";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listPaymentMethods();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const id = body?.id ? Number(body.id) : undefined;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const coaCode = typeof body?.coaCode === "string" ? body.coaCode.trim() : null;
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : true;

  if (!code || !name || !category) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await upsertPaymentMethod({
    id,
    code,
    name,
    category,
    coaCode: coaCode || null,
    isActive,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await deletePaymentMethod(Math.trunc(id));
  return NextResponse.json({ ok: true });
}

