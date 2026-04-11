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
  revalidatePath("/farm");
}

export async function deleteInventoryAction(id: number) {
  await deleteFarmInventory(id);
  revalidatePath("/farm");
}

export async function savePenAction(formData: { id?: number; branchId: number; name: string }) {
  await upsertFarmPen(formData);
  revalidatePath("/farm");
}

export async function deletePenAction(id: number) {
  await deleteFarmPen(id);
  revalidatePath("/farm");
}

export async function patchEartagAction(id: number, eartagId: string) {
  if (!eartagId) {
    return { success: false, error: "ID Tag (Eartag) wajib diisi" };
  }
  
  try {
    await updateFarmEartag(id, eartagId);
    revalidatePath("/farm");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memperbarui Tag ID" };
  }
}
