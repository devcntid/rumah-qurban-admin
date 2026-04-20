import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import {
  listNotifTemplates,
  countNotifTemplates,
  getAllNotifTemplates,
  upsertNotifTemplate,
  deleteNotifTemplate,
} from "@/lib/db/queries/notif-templates";
import { revalidatePath } from "next/cache";
import { flushRedisCache } from "@/lib/cache/redis";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || undefined;
  const all = searchParams.get("all") === "true";

  if (all) {
    const templates = await getAllNotifTemplates();
    return NextResponse.json({ templates });
  }

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));
  const offset = (page - 1) * pageSize;

  const [templates, totalCount] = await Promise.all([
    listNotifTemplates({ q, limit: pageSize, offset }),
    countNotifTemplates({ q }),
  ]);

  return NextResponse.json({
    templates,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, templateText } = body;

    if (!name || !templateText) {
      return NextResponse.json(
        { error: "Name and templateText are required" },
        { status: 400 }
      );
    }

    const resultId = await upsertNotifTemplate({
      id: id || undefined,
      name: name.trim(),
      templateText: templateText.trim(),
    });

    await flushRedisCache();
    revalidatePath("/notif-templates");

    return NextResponse.json({
      success: true,
      id: resultId,
      message: id ? "Template updated" : "Template created",
    });
  } catch (error) {
    console.error("Error upserting notif template:", error);
    const message = error instanceof Error ? error.message : "Failed to save template";
    
    if (message.includes("duplicate key") || message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "Template name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = Number(searchParams.get("id"));

  if (!id || !Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
  }

  try {
    await deleteNotifTemplate(id);
    await flushRedisCache();
    revalidatePath("/notif-templates");
    return NextResponse.json({ success: true, message: "Template deleted" });
  } catch (error) {
    console.error("Error deleting notif template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
