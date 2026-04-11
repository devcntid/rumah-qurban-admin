"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { z } from "zod";
import { 
  saveCatalogOffer, 
  deleteCatalogOffer, 
  listCatalogOffers, 
  countCatalogOffers,
  getCatalogFilterOptions
} from "@/lib/db/queries/catalog";

const catalogOfferSchema = z.object({
  id: z.number().optional(),
  productId: z.number("Produk wajib dipilih"),
  animalVariantId: z.number("Varian hewan wajib dipilih"),
  branchId: z.number().nullable(),
  vendorId: z.number().nullable(),
  displayName: z.string().min(1, "Nama penawaran wajib diisi"),
  subType: z.string().nullable(),
  skuCode: z.string().nullable(),
  projectedWeight: z.string().nullable(),
  weightRange: z.string().nullable(),
  description: z.string().nullable(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  imageUrl: z.string().nullable(),
  isActive: z.boolean().default(true),
});

export async function saveCatalogOfferAction(data: any) {
  try {
    const validated = catalogOfferSchema.parse(data);
    const result = await saveCatalogOffer(validated);
    revalidatePath("/pricing");
    return { success: true, id: result.id };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", fieldErrors: error.flatten().fieldErrors };
    }
    return { success: false, error: error.message || "Gagal menyimpan data" };
  }
}

export async function deleteCatalogOfferAction(id: number) {
  try {
    await deleteCatalogOffer(id);
    revalidatePath("/pricing");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus data" };
  }
}

export async function uploadCatalogImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const blob = await put(`catalog/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengunggah gambar" };
  }
}

export async function bulkSaveCatalogAction(offers: any[]) {
  try {
    for (const offer of offers) {
      // Basic validation for bulk
      if (!offer.displayName || !offer.price) continue;
      await saveCatalogOffer(offer);
    }
    revalidatePath("/pricing");
    return { success: true, count: offers.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan data massal" };
  }
}

export async function searchCatalogAction(params: {
  branchId?: number;
  productCode?: string;
  species?: string;
  classGrade?: string;
  animalVariantId?: number;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;
    
    const [data, total] = await Promise.all([
      listCatalogOffers({ ...params, limit, offset }),
      countCatalogOffers(params)
    ]);
    
    return { success: true, data, total };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mencari katalog" };
  }
}

export async function getCatalogFiltersAction() {
  try {
    const filters = await getCatalogFilterOptions();
    return { success: true, ...filters };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengambil filter" };
  }
}
