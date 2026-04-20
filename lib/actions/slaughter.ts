"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth/session";
import { flushRedisCache } from "@/lib/cache/redis";
import {
  createSlaughterRecord,
  updateSlaughterRecord,
  addSlaughterPhotos as addPhotosToRecord,
  getSlaughterRecordById,
} from "@/lib/db/queries/slaughter-records";
import type { DocumentationPhoto } from "@/types/notifications";

export async function recordSlaughterAction(data: {
  farmInventoryId: number;
  orderItemId: number;
  slaughteredAt: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  performedBy?: string;
}): Promise<{ success: boolean; slaughterRecordId?: number; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const recordId = await createSlaughterRecord({
      farmInventoryId: data.farmInventoryId,
      orderItemId: data.orderItemId,
      slaughteredAt: data.slaughteredAt,
      slaughterLocation: data.location,
      slaughterLatitude: data.latitude,
      slaughterLongitude: data.longitude,
      notes: data.notes,
      performedBy: data.performedBy || session.name,
      documentationPhotos: [],
    });

    await flushRedisCache();
    revalidatePath("/orders");

    return { success: true, slaughterRecordId: recordId };
  } catch (error) {
    console.error("Error recording slaughter:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record slaughter",
    };
  }
}

export async function updateSlaughterAction(
  id: number,
  data: {
    slaughteredAt?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    performedBy?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await updateSlaughterRecord(id, {
      slaughteredAt: data.slaughteredAt,
      slaughterLocation: data.location,
      slaughterLatitude: data.latitude,
      slaughterLongitude: data.longitude,
      notes: data.notes,
      performedBy: data.performedBy,
    });

    await flushRedisCache();
    revalidatePath("/orders");

    return { success: true };
  } catch (error) {
    console.error("Error updating slaughter record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update record",
    };
  }
}

export async function uploadSlaughterPhotosAction(
  slaughterRecordId: number,
  formData: FormData
): Promise<{ success: boolean; uploadedUrls?: string[]; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const record = await getSlaughterRecordById(slaughterRecordId);
  if (!record) {
    return { success: false, error: "Record not found" };
  }

  try {
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return { success: false, error: "No photos provided" };
    }

    const uploadedPhotos: DocumentationPhoto[] = [];
    const uploadedUrls: string[] = [];

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
      uploadedUrls.push(blob.url);
    }

    if (uploadedPhotos.length === 0) {
      return { success: false, error: "No valid images uploaded" };
    }

    await addPhotosToRecord(slaughterRecordId, uploadedPhotos);
    await flushRedisCache();
    revalidatePath("/orders");

    return { success: true, uploadedUrls };
  } catch (error) {
    console.error("Error uploading photos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload photos",
    };
  }
}

export async function recordSlaughterWithPhotosAction(
  data: {
    farmInventoryId: number;
    orderItemId: number;
    slaughteredAt: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    performedBy?: string;
  },
  formData: FormData | null
): Promise<{ success: boolean; slaughterRecordId?: number; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const uploadedPhotos: DocumentationPhoto[] = [];

    if (formData) {
      const files = formData.getAll("photos") as File[];
      
      for (const file of files) {
        if (!file.type.startsWith("image/") || file.size === 0) {
          continue;
        }

        const blob = await put(
          `slaughter-docs/temp/${Date.now()}-${file.name}`,
          file,
          { access: "public" }
        );

        uploadedPhotos.push({
          url: blob.url,
          uploadedAt: new Date().toISOString(),
        });
      }
    }

    const recordId = await createSlaughterRecord({
      farmInventoryId: data.farmInventoryId,
      orderItemId: data.orderItemId,
      slaughteredAt: data.slaughteredAt,
      slaughterLocation: data.location,
      slaughterLatitude: data.latitude,
      slaughterLongitude: data.longitude,
      notes: data.notes,
      performedBy: data.performedBy || session.name,
      documentationPhotos: uploadedPhotos,
    });

    await flushRedisCache();
    revalidatePath("/orders");

    return { success: true, slaughterRecordId: recordId };
  } catch (error) {
    console.error("Error recording slaughter with photos:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record slaughter",
    };
  }
}
