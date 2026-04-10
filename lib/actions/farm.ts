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

export async function saveInventoryAction(formData: any) {
  // Simple check
  if (!formData.eartagId) throw new Error("Eartag ID is required");
  
  if (!formData.generatedId) {
    formData.generatedId = `RQ${generateAlphanumericId(6)}`;
  }
  
  await upsertFarmInventory(formData);
  revalidatePath("/farm");
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
  if (!eartagId) throw new Error("Eartag ID is required");
  await updateFarmEartag(id, eartagId);
  revalidatePath("/farm");
}
