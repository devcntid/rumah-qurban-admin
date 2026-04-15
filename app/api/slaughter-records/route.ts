import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import {
  listSlaughterRecords,
  countSlaughterRecords,
  getSlaughterRecordById,
  createSlaughterRecord,
  updateSlaughterRecord,
  getSlaughterableItems,
} from "@/lib/db/queries/slaughter-records";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get("orderId") ? Number(searchParams.get("orderId")) : undefined;
  const farmInventoryId = searchParams.get("farmInventoryId")
    ? Number(searchParams.get("farmInventoryId"))
    : undefined;
  const orderItemId = searchParams.get("orderItemId")
    ? Number(searchParams.get("orderItemId"))
    : undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const id = searchParams.get("id") ? Number(searchParams.get("id")) : undefined;

  if (id) {
    const record = await getSlaughterRecordById(id);
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ record });
  }

  if (searchParams.get("slaughterable") === "true" && orderId) {
    const items = await getSlaughterableItems(orderId);
    return NextResponse.json({ items });
  }

  const branchId = searchParams.get("branchId") ? Number(searchParams.get("branchId")) : undefined;
  const q = searchParams.get("q") || undefined;

  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const [records, totalCount] = await Promise.all([
    listSlaughterRecords({
      orderId,
      farmInventoryId,
      orderItemId,
      branchId,
      q,
      startDate,
      endDate,
      limit,
      offset,
    }),
    countSlaughterRecords({
      orderId,
      farmInventoryId,
      orderItemId,
      branchId,
      q,
      startDate,
      endDate,
    }),
  ]);

  return NextResponse.json({
    records,
    total: totalCount,
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      farmInventoryId,
      orderItemId,
      slaughteredAt,
      slaughterLocation,
      slaughterLatitude,
      slaughterLongitude,
      documentationPhotos,
      notes,
      performedBy,
    } = body;

    if (id) {
      await updateSlaughterRecord(id, {
        slaughteredAt,
        slaughterLocation,
        slaughterLatitude,
        slaughterLongitude,
        documentationPhotos,
        notes,
        performedBy,
      });
      revalidatePath(`/orders`);
      return NextResponse.json({
        success: true,
        id,
        message: "Slaughter record updated",
      });
    }

    if (!farmInventoryId || !orderItemId || !slaughteredAt) {
      return NextResponse.json(
        { error: "farmInventoryId, orderItemId, and slaughteredAt are required" },
        { status: 400 }
      );
    }

    const resultId = await createSlaughterRecord({
      farmInventoryId,
      orderItemId,
      slaughteredAt,
      slaughterLocation,
      slaughterLatitude,
      slaughterLongitude,
      documentationPhotos: documentationPhotos || [],
      notes,
      performedBy,
    });

    revalidatePath(`/orders`);

    return NextResponse.json({
      success: true,
      id: resultId,
      message: "Slaughter record created",
    });
  } catch (error) {
    console.error("Error saving slaughter record:", error);
    const message = error instanceof Error ? error.message : "Failed to save record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
