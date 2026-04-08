import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { deleteService, listServices, upsertService } from "@/lib/db/queries/services";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listServices();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body?.id ? Number(body.id) : undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const serviceType = typeof body?.serviceType === "string" ? body.serviceType.trim() : "";
  const basePrice = Number(body?.basePrice);
  const branchRaw = body?.branchId;
  const branchId =
    branchRaw !== "" && branchRaw != null && Number.isFinite(Number(branchRaw))
      ? Number(branchRaw)
      : null;
  const variantRaw = body?.animalVariantId;
  const animalVariantId =
    variantRaw !== "" && variantRaw != null && Number.isFinite(Number(variantRaw))
      ? Number(variantRaw)
      : null;
  const coaCode =
    typeof body?.coaCode === "string" ? body.coaCode.trim() || null : null;

  if (!name || !serviceType || !Number.isFinite(basePrice)) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  await upsertService({
    id,
    name,
    serviceType,
    basePrice,
    branchId,
    animalVariantId,
    coaCode,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await deleteService(Math.trunc(id));
  return NextResponse.json({ ok: true });
}
