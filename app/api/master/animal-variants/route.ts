import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import {
  deleteAnimalVariant,
  listAnimalVariants,
  upsertAnimalVariant,
} from "@/lib/db/queries/master";
import { flushRedisCache } from "@/lib/cache/redis";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listAnimalVariants();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body?.id ? Number(body.id) : undefined;
  const species = typeof body?.species === "string" ? body.species.trim() : "";
  const classGrade =
    typeof body?.classGrade === "string" ? body.classGrade.trim() || null : null;
  const weightRange =
    typeof body?.weightRange === "string" ? body.weightRange.trim() || null : null;
  const description =
    typeof body?.description === "string" ? body.description.trim() || null : null;

  if (!species) return NextResponse.json({ error: "Species wajib diisi" }, { status: 400 });

  await upsertAnimalVariant({ id, species, classGrade, weightRange, description });
  await flushRedisCache();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await deleteAnimalVariant(Math.trunc(id));
  await flushRedisCache();
  return NextResponse.json({ ok: true });
}
