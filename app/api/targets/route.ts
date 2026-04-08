import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { asNumber, asString } from "@/lib/db/filters";
import { getPageParams } from "@/lib/db/pagination";
import {
  deleteSalesTarget,
  listSalesTargets,
  upsertSalesTarget,
} from "@/lib/db/queries/targets";

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const { limit, offset } = getPageParams(sp);

  const year = asNumber(sp.year);
  const species = asString(sp.species, 50);
  const category = asString(sp.category, 20);

  const rows = await listSalesTargets({
    branchId: session.branchId,
    year: year ? Math.trunc(year) : undefined,
    species: species || undefined,
    category: category || undefined,
    limit,
    offset,
  });

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as any;
  const year = Number(body?.year);
  const season = typeof body?.season === "string" ? body.season.trim() : null;
  const species = typeof body?.species === "string" ? body.species.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const targetEkor = Number(body?.targetEkor ?? 0);
  const targetOmset = Number(body?.targetOmset ?? 0);
  const targetHpp = Number(body?.targetHpp ?? 0);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  if (!species || !category) {
    return NextResponse.json({ error: "Invalid species/category" }, { status: 400 });
  }

  await upsertSalesTarget({
    branchId: session.branchId,
    year: Math.trunc(year),
    season: season || null,
    species,
    category,
    targetEkor: Math.max(0, Math.trunc(targetEkor || 0)),
    targetOmset: Math.max(0, targetOmset || 0),
    targetHpp: Math.max(0, targetHpp || 0),
    notes: notes || null,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await deleteSalesTarget(Math.trunc(id));
  return NextResponse.json({ ok: true });
}

