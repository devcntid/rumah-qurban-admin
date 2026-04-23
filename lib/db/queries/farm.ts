import { getDb } from "@/lib/db/client";

export type StockSummaryRow = {
  branchId: number | null;
  animalVariantId: number | null;
  species: string | null;
  classGrade: string | null;
  weightRange: string | null;
  status: string | null;
  headCount: string;
  assignedCount: string;
  availableUnassignedCount: string;
};

export async function listStockByBranchVariant(branchId: number) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      branch_id as "branchId",
      animal_variant_id as "animalVariantId",
      species,
      class_grade as "classGrade",
      weight_range as "weightRange",
      status,
      head_count::text as "headCount",
      assigned_count::text as "assignedCount",
      available_unassigned_count::text as "availableUnassignedCount"
    FROM stock_by_branch_variant
    WHERE branch_id = ${branchId}
    ORDER BY species ASC NULLS LAST, class_grade ASC NULLS LAST, status ASC
  `;
  return rows as unknown as StockSummaryRow[];
}

export type FarmInventoryRow = {
  id: number;
  generatedId: string;
  farmAnimalId: string | null;
  eartagId: string;
  animalVariantId: number | null;
  branchId: number | null;
  vendorId: number | null;
  entryDate: string | null;
  acquisitionType: string | null;
  initialProductType: string | null;
  penId: number | null;
  panName: string | null;
  purchasePrice: string | null;
  initialWeightSource: string | null;
  pricePerKg: string | null;
  shippingCost: string | null;
  totalHpp: string | null;
  hornType: string | null;
  initialWeight: string | null;
  initialType: string | null;
  finalType: string | null;
  weightActual: string | null;
  photoUrl: string | null;
  status: string;
  orderItemId: number | null;
  exitDate: string | null;
  createdAt: string;
  // Joins
  vendorName: string | null;
  penName: string | null;
  species: string | null;
  classGrade: string | null;
  weightRange: string | null;
};

export async function listFarmInventories(params: {
  branchId?: number;
  vendorId?: number;
  penId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const sql = getDb();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = sql`
    SELECT 
      fi.*,
      fi.generated_id as "generatedId",
      fi.farm_animal_id as "farmAnimalId",
      fi.eartag_id as "eartagId",
      fi.animal_variant_id as "animalVariantId",
      fi.branch_id as "branchId",
      fi.vendor_id as "vendorId",
      fi.entry_date as "entryDate",
      fi.acquisition_type as "acquisitionType",
      fi.initial_product_type as "initialProductType",
      fi.pen_id as "penId",
      fi.pan_name as "panName",
      fi.purchase_price as "purchasePrice",
      fi.initial_weight_source as "initialWeightSource",
      fi.price_per_kg as "pricePerKg",
      fi.shipping_cost as "shippingCost",
      fi.total_hpp as "totalHpp",
      fi.horn_type as "hornType",
      fi.initial_weight as "initialWeight",
      fi.initial_type as "initialType",
      fi.final_type as "finalType",
      fi.weight_actual as "weightActual",
      fi.photo_url as "photoUrl",
      fi.order_item_id as "orderItemId",
      fi.exit_date as "exitDate",
      fi.created_at as "createdAt",
      v.name as "vendorName",
      fp.name as "penName",
      av.species,
      av.class_grade as "classGrade",
      av.weight_range as "weightRange"
    FROM farm_inventories fi
    LEFT JOIN vendors v ON fi.vendor_id = v.id
    LEFT JOIN farm_pens fp ON fi.pen_id = fp.id
    LEFT JOIN animal_variants av ON fi.animal_variant_id = av.id
    WHERE 1=1
  `;

  if (params.branchId) {
    query = sql`${query} AND fi.branch_id = ${params.branchId}`;
  }
  if (params.vendorId) {
    query = sql`${query} AND fi.vendor_id = ${params.vendorId}`;
  }
  if (params.penId) {
    query = sql`${query} AND fi.pen_id = ${params.penId}`;
  }
  if (params.search) {
    const s = `%${params.search}%`;
    query = sql`${query} AND (fi.eartag_id ILIKE ${s} OR fi.farm_animal_id ILIKE ${s} OR fi.generated_id ILIKE ${s})`;
  }

  query = sql`${query} ORDER BY fi.id DESC LIMIT ${limit} OFFSET ${offset}`;

  const rows = await query;

  return rows as unknown as FarmInventoryRow[];
}

export async function countFarmInventories(params: {
  branchId?: number;
  vendorId?: number;
  penId?: number;
  search?: string;
}) {
  const sql = getDb();
  let query = sql`SELECT count(*) FROM farm_inventories fi WHERE 1=1`;

  if (params.branchId) {
    query = sql`${query} AND fi.branch_id = ${params.branchId}`;
  }
  if (params.vendorId) {
    query = sql`${query} AND fi.vendor_id = ${params.vendorId}`;
  }
  if (params.penId) {
    query = sql`${query} AND fi.pen_id = ${params.penId}`;
  }
  if (params.search) {
    const s = `%${params.search}%`;
    query = sql`${query} AND (fi.eartag_id ILIKE ${s} OR fi.farm_animal_id ILIKE ${s} OR fi.generated_id ILIKE ${s})`;
  }

  const res = await query;
  return parseInt((res as any)[0].count);
}

export type FarmPenRow = {
  id: number;
  branchId: number | null;
  name: string;
  createdAt: string;
};

export async function listFarmPens(branchId?: number) {
  const sql = getDb();
  if (branchId) {
    return (await sql`
      SELECT id, branch_id as "branchId", name, created_at as "createdAt"
      FROM farm_pens
      WHERE branch_id = ${branchId}
      ORDER BY name ASC
    `) as unknown as FarmPenRow[];
  }
  return (await sql`
    SELECT id, branch_id as "branchId", name, created_at as "createdAt"
    FROM farm_pens
    ORDER BY name ASC
  `) as unknown as FarmPenRow[];
}

export async function upsertFarmInventory(input: Partial<FarmInventoryRow>) {
  const sql = getDb();
  if (input.id) {
    await sql`
      UPDATE farm_inventories SET
        generated_id = ${input.generatedId},
        farm_animal_id = ${input.farmAnimalId ?? null},
        eartag_id = ${input.eartagId},
        animal_variant_id = ${input.animalVariantId ?? null},
        branch_id = ${input.branchId ?? null},
        vendor_id = ${input.vendorId ?? null},
        entry_date = ${input.entryDate ?? null},
        acquisition_type = ${input.acquisitionType ?? null},
        initial_product_type = ${input.initialProductType ?? null},
        pen_id = ${input.penId ?? null},
        pan_name = ${input.panName ?? null},
        purchase_price = ${input.purchasePrice ?? null},
        initial_weight_source = ${input.initialWeightSource ?? null},
        price_per_kg = ${input.pricePerKg ?? null},
        shipping_cost = ${input.shippingCost ?? null},
        total_hpp = ${input.totalHpp ?? null},
        horn_type = ${input.hornType ?? null},
        initial_weight = ${input.initialWeight ?? null},
        initial_type = ${input.initialType ?? null},
        final_type = ${input.finalType ?? null},
        weight_actual = ${input.weightActual ?? null},
        photo_url = ${input.photoUrl ?? null},
        status = ${input.status},
        order_item_id = ${input.orderItemId ?? null},
        exit_date = ${input.exitDate ?? null}
      WHERE id = ${input.id}
    `;
    return input.id;
  } else {
    const res = await sql`
      INSERT INTO farm_inventories (
        generated_id, farm_animal_id, eartag_id, animal_variant_id, branch_id, vendor_id,
        entry_date, acquisition_type, initial_product_type, pen_id, pan_name,
        purchase_price, initial_weight_source, price_per_kg, shipping_cost, total_hpp,
        horn_type, initial_weight, initial_type, final_type, weight_actual,
        photo_url, status, order_item_id, exit_date
      ) VALUES (
        ${input.generatedId}, ${input.farmAnimalId ?? null}, ${input.eartagId}, 
        ${input.animalVariantId ?? null}, ${input.branchId ?? null}, ${input.vendorId ?? null},
        ${input.entryDate ?? null}, ${input.acquisitionType ?? null}, ${input.initialProductType ?? null},
        ${input.penId ?? null}, ${input.panName ?? null},
        ${input.purchasePrice ?? null}, ${input.initialWeightSource ?? null},
        ${input.pricePerKg ?? null}, ${input.shippingCost ?? null}, ${input.totalHpp ?? null},
        ${input.hornType ?? null}, ${input.initialWeight ?? null},
        ${input.initialType ?? null}, ${input.finalType ?? null},
        ${input.weightActual ?? null}, ${input.photoUrl ?? null},
        ${input.status ?? "AVAILABLE"}, ${input.orderItemId ?? null}, ${input.exitDate ?? null}
      )
      RETURNING id
    `;
    return (res as any)[0].id;
  }
}

export async function deleteFarmInventory(id: number) {
  const sql = getDb();
  await sql`DELETE FROM farm_inventories WHERE id = ${id}`;
}

export async function upsertFarmPen(input: { id?: number; branchId: number; name: string }) {
  const sql = getDb();
  if (input.id) {
    await sql`
      UPDATE farm_pens SET
        branch_id = ${input.branchId},
        name = ${input.name}
      WHERE id = ${input.id}
    `;
    return input.id;
  } else {
    const res = await sql`
      INSERT INTO farm_pens (branch_id, name)
      VALUES (${input.branchId}, ${input.name})
      ON CONFLICT (name, branch_id) DO UPDATE
      SET name = EXCLUDED.name
      RETURNING id
    `;
    return (res as any)[0].id;
  }
}

export async function deleteFarmPen(id: number) {
  const sql = getDb();
  await sql`DELETE FROM farm_pens WHERE id = ${id}`;
}
export async function updateFarmEartag(id: number, eartagId: string) {
  const sql = getDb();
  await sql`
    UPDATE farm_inventories 
    SET eartag_id = ${eartagId} 
    WHERE id = ${id}
  `;
}

export async function listAvailableAnimalsForOrderItem(orderItemId: number) {
  const sql = getDb();
  // Get variant from order item
  const variantRows = (await sql`
    SELECT co.animal_variant_id, o.branch_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN catalog_offers co ON co.id = oi.catalog_offer_id
    WHERE oi.id = ${orderItemId}
  `) as { animal_variant_id: number; branch_id: number }[];
  if (variantRows.length === 0) return [];
  const { animal_variant_id, branch_id } = variantRows[0];

  return (await sql`
    SELECT fi.*, av.species, av.class_grade as "classGrade", av.weight_range as "weightRange"
    FROM farm_inventories fi
    LEFT JOIN animal_variants av ON av.id = fi.animal_variant_id
    WHERE fi.animal_variant_id = ${animal_variant_id}
      AND fi.branch_id = ${branch_id}
      AND fi.status = 'AVAILABLE'
      AND fi.order_item_id IS NULL
    ORDER BY fi.eartag_id ASC
  `) as unknown as FarmInventoryRow[];
}

export async function getAllocatedAnimalsForOrderItem(orderItemId: number) {
  const sql = getDb();
  return (await sql`
    SELECT 
      fi.*, 
      av.species, 
      av.class_grade as "classGrade", 
      av.weight_range as "weightRange", 
      ia.id as "allocationId",
      v.name as "vendorName"
    FROM farm_inventories fi
    JOIN inventory_allocations ia ON ia.farm_inventory_id = fi.id
    LEFT JOIN animal_variants av ON av.id = fi.animal_variant_id
    LEFT JOIN vendors v ON v.id = fi.vendor_id
    WHERE ia.order_item_id = ${orderItemId}
    ORDER BY fi.eartag_id ASC
  `) as unknown as (FarmInventoryRow & { allocationId: number, vendorName: string | null })[];
}

export async function getFarmInventoryById(id: number) {
  const sql = getDb();
  const rows = (await sql`
    SELECT 
      fi.*,
      fi.generated_id as "generatedId",
      fi.farm_animal_id as "farmAnimalId",
      fi.eartag_id as "eartagId",
      fi.animal_variant_id as "animalVariantId",
      fi.branch_id as "branchId",
      fi.vendor_id as "vendorId",
      fi.entry_date as "entryDate",
      fi.acquisition_type as "acquisitionType",
      fi.initial_product_type as "initialProductType",
      fi.pen_id as "penId",
      fi.pan_name as "panName",
      fi.purchase_price as "purchasePrice",
      fi.initial_weight_source as "initialWeightSource",
      fi.price_per_kg as "pricePerKg",
      fi.shipping_cost as "shippingCost",
      fi.total_hpp as "totalHpp",
      fi.horn_type as "hornType",
      fi.initial_weight as "initialWeight",
      fi.initial_type as "initialType",
      fi.final_type as "finalType",
      fi.weight_actual as "weightActual",
      fi.photo_url as "photoUrl",
      fi.order_item_id as "orderItemId",
      fi.exit_date as "exitDate",
      fi.created_at as "createdAt",
      v.name as "vendorName",
      fp.name as "penName",
      av.species,
      av.class_grade as "classGrade",
      av.weight_range as "weightRange",
      b.name as "branchName"
    FROM farm_inventories fi
    LEFT JOIN vendors v ON fi.vendor_id = v.id
    LEFT JOIN farm_pens fp ON fi.pen_id = fp.id
    LEFT JOIN animal_variants av ON fi.animal_variant_id = av.id
    LEFT JOIN branches b ON fi.branch_id = b.id
    WHERE fi.id = ${id}
    LIMIT 1
  `) as unknown as (FarmInventoryRow & { branchName: string | null })[];
  return rows.length > 0 ? rows[0] : null;
}

export type AnimalTrackingRow = {
  id: number;
  farmInventoryId: number;
  milestone: string;
  description: string | null;
  locationLat: string | null;
  locationLng: string | null;
  mediaUrl: string | null;
  loggedAt: string;
};

export async function getAnimalTrackingsByFarmInventoryId(farmInventoryId: number) {
  const sql = getDb();
  const rows = await sql`
    SELECT 
      id,
      farm_inventory_id as "farmInventoryId",
      milestone,
      description,
      location_lat as "locationLat",
      location_lng as "locationLng",
      media_url as "mediaUrl",
      logged_at as "loggedAt"
    FROM animal_trackings
    WHERE farm_inventory_id = ${farmInventoryId}
    ORDER BY logged_at DESC
  `;
  return rows as unknown as AnimalTrackingRow[];
}

