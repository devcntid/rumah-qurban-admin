import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import {
  listFaqs,
  countFaqs,
  upsertFaq,
  deleteFaq,
} from "@/lib/db/queries/faqs";
import { flushRedisCache } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    const filters = {
      productId: productId ? Number(productId) : undefined,
      category: category || undefined,
      search: search || undefined,
      isActive: isActive ? isActive === "true" : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
    };

    console.log("[FAQ API GET] Filters:", filters);

    const [rows, total] = await Promise.all([
      listFaqs(filters),
      countFaqs(filters),
    ]);

    console.log("[FAQ API GET] Raw results:", { 
      rowsType: typeof rows,
      rowsIsArray: Array.isArray(rows),
      rowsCount: rows?.length, 
      total,
      firstRow: rows?.[0]
    });

    return NextResponse.json({ 
      rows: Array.isArray(rows) ? rows : [], 
      total: total || 0 
    });
  } catch (error) {
    console.error("Error in GET /api/faqs:", error);
    return NextResponse.json({ 
      rows: [], 
      total: 0,
      error: "Failed to fetch FAQs" 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const id = body.id ? Number(body.id) : undefined;
  const productId = body.productId ? Number(body.productId) : undefined;
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const displayOrder =
    typeof body.displayOrder === "number" ? body.displayOrder : 0;
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;

  if (!productId || !category || !question || !answer) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const result = await upsertFaq({
    id,
    productId,
    category,
    question,
    answer,
    displayOrder,
    isActive,
  });

  await flushRedisCache();
  revalidatePath("/faqs");

  return NextResponse.json({ ok: true, id: result.id });
}

export async function DELETE(req: Request) {
  const session = await requireSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const productId = searchParams.get("productId");

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await deleteFaq(Math.trunc(id));
  await flushRedisCache();
  revalidatePath("/faqs");

  return NextResponse.json({ ok: true });
}
