"use server";

import { 
  upsertFarmInventory, 
  deleteFarmInventory, 
  upsertFarmPen, 
  deleteFarmPen,
  updateFarmEartag
} from "@/lib/db/queries/farm";
import { revalidatePath } from "next/cache";
import { generateAlphanumericId } from "@/lib/utils/id";
import { flushRedisCache } from "@/lib/cache/redis";
import { z } from "zod";

const FarmInventorySchema = z.object({
  id: z.number().optional(),
  branchId: z.number(),
  generatedId: z.string().optional(),
  farmAnimalId: z.string().optional().nullable(),
  eartagId: z.string().min(1, "ID Tag (Eartag) wajib diisi"),
  animalVariantId: z.number("Varian hewan wajib dipilih").min(1, "Varian hewan wajib dipilih"),
  vendorId: z.number().optional().nullable(),
  entryDate: z.string().optional().nullable(),
  acquisitionType: z.string().optional().nullable(),
  initialProductType: z.string().optional().nullable(),
  penId: z.number().optional().nullable(),
  panName: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().optional().nullable(),
  initialWeightSource: z.coerce.number().optional().nullable(),
  pricePerKg: z.coerce.number().optional().nullable(),
  shippingCost: z.coerce.number().optional().nullable(),
  totalHpp: z.coerce.number().optional().nullable(),
  hornType: z.string().optional().nullable(),
  initialWeight: z.coerce.number().optional().nullable(),
  initialType: z.string().optional().nullable(),
  finalType: z.string().optional().nullable(),
  weightActual: z.coerce.number().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  status: z.string().default("AVAILABLE"),
  orderItemId: z.number().optional().nullable(),
  exitDate: z.string().optional().nullable(),
});

export async function saveInventoryAction(data: any) {
  const result = FarmInventorySchema.safeParse(data);
  
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = result.error.flatten().fieldErrors;
    return { 
      success: false, 
      error: "Validasi gagal", 
      fieldErrors 
    };
  }

  const formData = result.data;
  
  if (!formData.generatedId) {
    formData.generatedId = `RQ${generateAlphanumericId(6)}`;
  }
  
  try {
    await upsertFarmInventory(formData as any);
    await flushRedisCache();
    revalidatePath("/farm");
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error);
    return { success: false, error: error.message || "Gagal menyimpan ke database" };
  }
}

export async function bulkSaveInventoryAction(commonData: any, items: any[]) {
  for (const item of items) {
    const data = {
      ...commonData,
      ...item,
      generatedId: `RQ${generateAlphanumericId(6)}`,
      status: "AVAILABLE",
    };
    await upsertFarmInventory(data);
  }
  await flushRedisCache();
  revalidatePath("/farm");
}

export async function deleteInventoryAction(id: number) {
  await deleteFarmInventory(id);
  await flushRedisCache();
  revalidatePath("/farm");
}

export async function savePenAction(formData: { id?: number; branchId: number; name: string }) {
  await upsertFarmPen(formData);
  await flushRedisCache();
  revalidatePath("/farm");
}

export async function deletePenAction(id: number) {
  await deleteFarmPen(id);
  await flushRedisCache();
  revalidatePath("/farm");
}

export async function patchEartagAction(id: number, eartagId: string) {
  if (!eartagId) {
    return { success: false, error: "ID Tag (Eartag) wajib diisi" };
  }
  
  try {
    await updateFarmEartag(id, eartagId);
    await flushRedisCache();
    revalidatePath("/farm");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memperbarui Tag ID" };
  }
}

// Animal Tracking Actions
import { getDb } from "@/lib/db/client";

const AnimalTrackingSchema = z.object({
  farmInventoryId: z.number(),
  milestone: z.string().min(1, "Milestone wajib diisi").max(50, "Milestone maksimal 50 karakter"),
  description: z.string().optional().nullable(),
  locationLat: z.string().optional().nullable(),
  locationLng: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
});

export async function addAnimalTrackingAction(data: any) {
  const result = AnimalTrackingSchema.safeParse(data);
  
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = result.error.flatten().fieldErrors;
    return { 
      success: false, 
      error: "Validasi gagal", 
      fieldErrors 
    };
  }

  const { farmInventoryId, milestone, description, locationLat, locationLng, mediaUrl } = result.data;
  
  try {
    const sql = getDb();
    await sql`
      INSERT INTO animal_trackings (
        farm_inventory_id, milestone, description, location_lat, location_lng, media_url, logged_at
      )
      VALUES (
        ${farmInventoryId},
        ${milestone},
        ${description ?? null},
        ${locationLat ?? null},
        ${locationLng ?? null},
        ${mediaUrl ?? null},
        NOW()
      )
    `;
    
    await flushRedisCache();
    revalidatePath("/farm");
    revalidatePath(`/farm/${farmInventoryId}`);
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/logistics");
    
    return { success: true };
  } catch (error: any) {
    console.error("Add Tracking Error:", error);
    return { success: false, error: error.message || "Gagal menambah tracking" };
  }
}

const UpdateTrackingSchema = z.object({
  milestone: z.string().min(1, "Milestone wajib diisi").max(50, "Milestone maksimal 50 karakter"),
  description: z.string().optional().nullable(),
  locationLat: z.string().optional().nullable(),
  locationLng: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
});

export async function updateAnimalTrackingAction(trackingId: number, data: any) {
  const result = UpdateTrackingSchema.safeParse(data);
  
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = result.error.flatten().fieldErrors;
    return { 
      success: false, 
      error: "Validasi gagal", 
      fieldErrors 
    };
  }

  const { milestone, description, locationLat, locationLng, mediaUrl } = result.data;
  
  try {
    const sql = getDb();
    
    // Get farm_inventory_id for revalidation
    const tracking = (await sql`
      SELECT farm_inventory_id FROM animal_trackings WHERE id = ${trackingId}
    `) as { farm_inventory_id: number }[];
    
    if (tracking.length === 0) {
      return { success: false, error: "Tracking tidak ditemukan" };
    }
    
    await sql`
      UPDATE animal_trackings
      SET 
        milestone = ${milestone},
        description = ${description ?? null},
        location_lat = ${locationLat ?? null},
        location_lng = ${locationLng ?? null},
        media_url = ${mediaUrl ?? null}
      WHERE id = ${trackingId}
    `;
    
    const farmInventoryId = tracking[0].farm_inventory_id;
    await flushRedisCache();
    revalidatePath("/farm");
    revalidatePath(`/farm/${farmInventoryId}`);
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/logistics");
    
    return { success: true };
  } catch (error: any) {
    console.error("Update Tracking Error:", error);
    return { success: false, error: error.message || "Gagal memperbarui tracking" };
  }
}

export async function deleteAnimalTrackingAction(trackingId: number) {
  try {
    const sql = getDb();
    
    // Get farm_inventory_id for revalidation
    const tracking = (await sql`
      SELECT farm_inventory_id FROM animal_trackings WHERE id = ${trackingId}
    `) as { farm_inventory_id: number }[];
    
    if (tracking.length === 0) {
      return { success: false, error: "Tracking tidak ditemukan" };
    }
    
    await sql`DELETE FROM animal_trackings WHERE id = ${trackingId}`;
    
    const farmInventoryId = tracking[0].farm_inventory_id;
    await flushRedisCache();
    revalidatePath("/farm");
    revalidatePath(`/farm/${farmInventoryId}`);
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/logistics");
    
    return { success: true };
  } catch (error: any) {
    console.error("Delete Tracking Error:", error);
    return { success: false, error: error.message || "Gagal menghapus tracking" };
  }
}
