import { getDb } from "@/lib/db/client";

export type CatalogOfferRow = {
  id: number;
  branchId: number | null;
  vendorId: number | null;
  productId: number | null;
  productCode: string | null;
  productName: string | null;
  animalVariantId: number | null;
  species: string | null;
  classGrade: string | null;
  weightRange: string | null;
  displayName: string;
  subType: string | null;
  skuCode: string | null;
  projectedWeight: string | null;
  imageUrl: string | null;
  price: string;
  isActive: boolean;
};

export async function listCatalogOffers(params: {
  branchId: number;
  productCode?: string;
  species?: string;
  q?: string;
  limit: number;
  offset: number;
}) {
  const sql = getDb();
  const where: string[] = ["(co.branch_id = $1 OR co.branch_id IS NULL)"];
  const values: unknown[] = [params.branchId];

  if (params.productCode) {
    values.push(params.productCode);
    where.push(`p.code = $${values.length}`);
  }

  if (params.species) {
    values.push(params.species);
    where.push(`av.species ILIKE $${values.length}`);
  }

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(
      `(co.display_name ILIKE $${p} OR co.sku_code ILIKE $${p} OR co.sub_type ILIKE $${p})`
    );
  }

  const q = `
    SELECT
      co.id,
      co.branch_id as "branchId",
      co.vendor_id as "vendorId",
      co.product_id as "productId",
      p.code as "productCode",
      p.name as "productName",
      co.animal_variant_id as "animalVariantId",
      av.species,
      av.class_grade as "classGrade",
      av.weight_range as "weightRange",
      co.display_name as "displayName",
      co.sub_type as "subType",
      co.sku_code as "skuCode",
      co.projected_weight as "projectedWeight",
      co.image_url as "imageUrl",
      co.price::text as price,
      co.is_active as "isActive"
    FROM catalog_offers co
    LEFT JOIN products p ON p.id = co.product_id
    LEFT JOIN animal_variants av ON av.id = co.animal_variant_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.code ASC NULLS LAST, av.species ASC NULLS LAST, co.display_name ASC, co.id ASC
    LIMIT ${params.limit} OFFSET ${params.offset}
  `;

  const rows = await sql.query(q, values);
  return rows as unknown as CatalogOfferRow[];
}

export async function updateCatalogOffer(id: number, patch: { isActive?: boolean }) {
  const sql = getDb();
  if (typeof patch.isActive === "boolean") {
    await sql`
      UPDATE catalog_offers
      SET is_active = ${patch.isActive}
      WHERE id = ${id}
    `;
  }
}
