import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { deleteBranch, listBranches, upsertBranch } from "@/lib/db/queries/master";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listBranches();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body?.id ? Number(body.id) : undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const coaCode = typeof body?.coaCode === "string" ? body.coaCode.trim() : null;
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : true;

  if (!name) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  await upsertBranch({ id, name, coaCode: coaCode || null, isActive });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await deleteBranch(Math.trunc(id));
  return NextResponse.json({ ok: true });
}
