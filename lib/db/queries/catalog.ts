import { getDb } from "@/lib/db/client";

export type CatalogOfferRow = {
  id: number;
  branchId: number | null;
  branchName: string | null;
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
  offerWeightRange: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string;
  isActive: boolean;
};

export async function listCatalogOffers(params: {
  branchId?: number;
  productCode?: string;
  species?: string;
  classGrade?: string;
  animalVariantId?: number;
  q?: string;
  limit: number;
  offset: number;
}) {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.branchId) {
    values.push(params.branchId);
    where.push(`(co.branch_id = $${values.length} OR co.branch_id IS NULL)`);
  }

  if (params.productCode) {
    values.push(params.productCode);
    where.push(`p.code = $${values.length}`);
  }

  if (params.species) {
    values.push(params.species);
    where.push(`av.species ILIKE $${values.length}`);
  }

  if (params.classGrade) {
    values.push(params.classGrade);
    where.push(`av.class_grade = $${values.length}`);
  }

  if (params.animalVariantId) {
    values.push(params.animalVariantId);
    where.push(`co.animal_variant_id = $${values.length}`);
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
      b.name as "branchName",
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
      co.weight_range as "offerWeightRange",
      co.description,
      co.image_url as "imageUrl",
      co.price::text as price,
      co.is_active as "isActive"
    FROM catalog_offers co
    LEFT JOIN branches b ON b.id = co.branch_id
    LEFT JOIN products p ON p.id = co.product_id
    LEFT JOIN animal_variants av ON av.id = co.animal_variant_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.code ASC NULLS LAST, av.species ASC NULLS LAST, co.display_name ASC, co.id ASC
    LIMIT ${params.limit} OFFSET ${params.offset}
  `;

  const rows = await sql.query(q, values);
  return rows as unknown as CatalogOfferRow[];
}

export async function countCatalogOffers(params: {
  branchId?: number;
  productCode?: string;
  species?: string;
  classGrade?: string;
  animalVariantId?: number;
  q?: string;
}) {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.branchId) {
    values.push(params.branchId);
    where.push(`(co.branch_id = $${values.length} OR co.branch_id IS NULL)`);
  }

  if (params.productCode) {
    values.push(params.productCode);
    where.push(`p.code = $${values.length}`);
  }

  if (params.species) {
    values.push(params.species);
    where.push(`av.species ILIKE $${values.length}`);
  }

  if (params.classGrade) {
    values.push(params.classGrade);
    where.push(`av.class_grade = $${values.length}`);
  }

  if (params.animalVariantId) {
    values.push(params.animalVariantId);
    where.push(`co.animal_variant_id = $${values.length}`);
  }

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(
      `(co.display_name ILIKE $${p} OR co.sku_code ILIKE $${p} OR co.sub_type ILIKE $${p})`
    );
  }

  const q = `
    SELECT count(*)
    FROM catalog_offers co
    LEFT JOIN products p ON p.id = co.product_id
    LEFT JOIN animal_variants av ON av.id = co.animal_variant_id
    WHERE ${where.join(" AND ")}
  `;

  const rows = await sql.query(q, values);
  return parseInt((rows as any)[0].count);
}

export async function getCatalogOfferById(id: number) {
  const sql = getDb();
  const rows = (await sql`
    SELECT 
      co.id, 
      co.product_id as "productId", 
      co.animal_variant_id as "animalVariantId", 
      co.branch_id as "branchId", 
      co.vendor_id as "vendorId", 
      co.display_name as "displayName", 
      co.sub_type as "subType", 
      co.sku_code as "skuCode", 
      co.projected_weight as "projectedWeight", 
      co.weight_range as "weightRange", 
      co.description, 
      co.price::text, 
      co.image_url as "imageUrl", 
      co.is_active as "isActive",
      p.code as "productCode"
    FROM catalog_offers co
    LEFT JOIN products p ON co.product_id = p.id
    WHERE co.id = ${id}
  `) as Record<string, unknown>[];
  return rows[0] as any;
}

export async function saveCatalogOffer(data: any) {
  const sql = getDb();
  const {
    id,
    productId,
    animalVariantId,
    branchId,
    vendorId,
    displayName,
    subType,
    skuCode,
    projectedWeight,
    weightRange,
    description,
    price,
    imageUrl,
    isActive = true,
  } = data;

  if (id) {
    await sql`
      UPDATE catalog_offers
      SET 
        product_id = ${productId},
        animal_variant_id = ${animalVariantId},
        branch_id = ${branchId},
        vendor_id = ${vendorId},
        display_name = ${displayName},
        sub_type = ${subType},
        sku_code = ${skuCode},
        projected_weight = ${projectedWeight},
        weight_range = ${weightRange},
        description = ${description},
        price = ${price},
        image_url = ${imageUrl},
        is_active = ${isActive}
      WHERE id = ${id}
    `;
    return { id };
  } else {
    const rows = (await sql`
      INSERT INTO catalog_offers (
        product_id, animal_variant_id, branch_id, vendor_id, 
        display_name, sub_type, sku_code, projected_weight, 
        weight_range, description, price, image_url, is_active
      ) VALUES (
        ${productId}, ${animalVariantId}, ${branchId}, ${vendorId}, 
        ${displayName}, ${subType}, ${skuCode}, ${projectedWeight}, 
        ${weightRange}, ${description}, ${price}, ${imageUrl}, ${isActive}
      )
      RETURNING id
    `) as { id: number }[];
    return rows[0];
  }
}

export async function deleteCatalogOffer(id: number) {
  const sql = getDb();
  await sql`DELETE FROM catalog_offers WHERE id = ${id}`;
}

export async function getCatalogFilterOptions() {
  const sql = getDb();
  const speciesRows = await sql`
    SELECT DISTINCT species 
    FROM animal_variants 
    WHERE species IS NOT NULL 
    ORDER BY species ASC
  `;
  const gradeRows = await sql`
    SELECT DISTINCT class_grade as "classGrade"
    FROM animal_variants
    WHERE class_grade IS NOT NULL
    ORDER BY class_grade ASC
  `;
  const productRows = await sql`
    SELECT DISTINCT p.id, p.name, p.code
    FROM products p
    JOIN catalog_offers co ON co.product_id = p.id
    ORDER BY p.name ASC
  `;
  return {
    species: (speciesRows as any[]).map(r => r.species),
    grades: (gradeRows as any[]).map(r => r.classGrade),
    products: productRows as any[]
  };
}

