import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { put } from "@vercel/blob";
import { addSlaughterPhotos, getSlaughterRecordById } from "@/lib/db/queries/slaughter-records";
import { revalidatePath } from "next/cache";
import { flushRedisCache } from "@/lib/cache/redis";
import type { DocumentationPhoto } from "@/types/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const slaughterRecordId = Number(id);

  if (!Number.isFinite(slaughterRecordId)) {
    return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
  }

  const record = await getSlaughterRecordById(slaughterRecordId);
  if (!record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const uploadedPhotos: DocumentationPhoto[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const blob = await put(
        `slaughter-docs/${slaughterRecordId}/${Date.now()}-${file.name}`,
        file,
        { access: "public" }
      );

      uploadedPhotos.push({
        url: blob.url,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (uploadedPhotos.length === 0) {
      return NextResponse.json({ error: "No valid images uploaded" }, { status: 400 });
    }

    await addSlaughterPhotos(slaughterRecordId, uploadedPhotos);
    await flushRedisCache();
    revalidatePath(`/orders`);

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedPhotos.length,
      photos: uploadedPhotos,
    });
  } catch (error) {
    console.error("Error uploading photos:", error);
    const message = error instanceof Error ? error.message : "Failed to upload photos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
