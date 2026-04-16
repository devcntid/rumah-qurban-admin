"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { z } from "zod";
import { 
  saveCatalogOffer, 
  deleteCatalogOffer, 
  listCatalogOffers, 
  countCatalogOffers,
  getCatalogFilterOptions,
  getCatalogOfferById
} from "@/lib/db/queries/catalog";
import { invalidateCatalogCache } from "@/lib/cache/redis";

const catalogOfferSchema = z.object({
  id: z.coerce.number().optional(),
  productId: z.coerce.number({ message: "Produk wajib dipilih" }),
  animalVariantId: z.coerce.number({ message: "Varian hewan wajib dipilih" }),
  branchId: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? null : Number(v)),
    z.number().nullable()
  ),
  vendorId: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? null : Number(v)),
    z.number().nullable()
  ),
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
    
    // Invalidate Redis cache
    const productCode = data.productCode || undefined;
    await invalidateCatalogCache(
      validated.branchId || undefined,
      productCode
    );
    
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
    // Get offer data before delete untuk invalidate specific cache
    const offer = await getCatalogOfferById(id);
    
    await deleteCatalogOffer(id);
    
    // Invalidate Redis cache
    await invalidateCatalogCache(
      offer?.branchId || undefined,
      offer?.productCode || undefined
    );
    
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
    
    // Invalidate all catalog cache after bulk save
    await invalidateCatalogCache();
    
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
