import { getDb } from "@/lib/db/client";
import type {
  SlaughterRecord,
  SlaughterRecordInput,
  SlaughterRecordWithDetails,
  DocumentationPhoto,
  CertificateData,
} from "@/types/notifications";

export async function listSlaughterRecords(params: {
  orderId?: number;
  farmInventoryId?: number;
  orderItemId?: number;
  branchId?: number;
  q?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}): Promise<SlaughterRecordWithDetails[]> {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.orderId) {
    values.push(params.orderId);
    where.push(`o.id = $${values.length}`);
  }

  if (params.branchId) {
    values.push(params.branchId);
    where.push(`o.branch_id = $${values.length}`);
  }

  if (params.farmInventoryId) {
    values.push(params.farmInventoryId);
    where.push(`sr.farm_inventory_id = $${values.length}`);
  }

  if (params.orderItemId) {
    values.push(params.orderItemId);
    where.push(`sr.order_item_id = $${values.length}`);
  }

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(`(o.invoice_number ILIKE $${p} OR o.customer_name ILIKE $${p} OR fi.eartag_id ILIKE $${p})`);
  }

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`sr.slaughtered_at >= $${values.length}::timestamp`);
  }

  if (params.endDate) {
    values.push(`${params.endDate} 23:59:59`);
    where.push(`sr.slaughtered_at <= $${values.length}::timestamp`);
  }

  values.push(params.limit);
  values.push(params.offset);

  const query = `
    SELECT
      sr.id,
      sr.farm_inventory_id as "farmInventoryId",
      sr.order_item_id as "orderItemId",
      sr.slaughtered_at as "slaughteredAt",
      sr.slaughter_location as "slaughterLocation",
      sr.slaughter_latitude::text as "slaughterLatitude",
      sr.slaughter_longitude::text as "slaughterLongitude",
      sr.documentation_photos as "documentationPhotos",
      sr.certificate_url as "certificateUrl",
      sr.notes,
      sr.performed_by as "performedBy",
      sr.created_at as "createdAt",
      sr.updated_at as "updatedAt",
      fi.eartag_id as "eartagId",
      oi.item_name as "itemName",
      o.customer_name as "customerName",
      o.customer_phone as "customerPhone",
      o.invoice_number as "invoiceNumber",
      o.id as "orderId"
    FROM slaughter_records sr
    JOIN farm_inventories fi ON fi.id = sr.farm_inventory_id
    JOIN order_items oi ON oi.id = sr.order_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE ${where.join(" AND ")}
    ORDER BY sr.slaughtered_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `;

  const rows = await sql.query(query, values) as unknown as Array<Record<string, unknown>>;
  
  const results: SlaughterRecordWithDetails[] = [];
  for (const row of rows) {
    const participants = await sql`
      SELECT participant_name FROM order_participants 
      WHERE order_item_id = ${row.orderItemId}
    ` as unknown as Array<{ participant_name: string }>;
    results.push({
      ...row,
      documentationPhotos: (row.documentationPhotos as DocumentationPhoto[]) || [],
      participantNames: participants.map((p) => p.participant_name),
    } as SlaughterRecordWithDetails);
  }

  return results;
}

export async function countSlaughterRecords(params: {
  orderId?: number;
  farmInventoryId?: number;
  orderItemId?: number;
  branchId?: number;
  q?: string;
  startDate?: string;
  endDate?: string;
}): Promise<number> {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.orderId) {
    values.push(params.orderId);
    where.push(`o.id = $${values.length}`);
  }

  if (params.branchId) {
    values.push(params.branchId);
    where.push(`o.branch_id = $${values.length}`);
  }

  if (params.farmInventoryId) {
    values.push(params.farmInventoryId);
    where.push(`sr.farm_inventory_id = $${values.length}`);
  }

  if (params.orderItemId) {
    values.push(params.orderItemId);
    where.push(`sr.order_item_id = $${values.length}`);
  }

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(`(o.invoice_number ILIKE $${p} OR o.customer_name ILIKE $${p} OR fi.eartag_id ILIKE $${p})`);
  }

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`sr.slaughtered_at >= $${values.length}::timestamp`);
  }

  if (params.endDate) {
    values.push(`${params.endDate} 23:59:59`);
    where.push(`sr.slaughtered_at <= $${values.length}::timestamp`);
  }

  const query = `
    SELECT COUNT(*)::int as count
    FROM slaughter_records sr
    JOIN farm_inventories fi ON fi.id = sr.farm_inventory_id
    JOIN order_items oi ON oi.id = sr.order_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE ${where.join(" AND ")}
  `;

  const result = await sql.query(query, values) as unknown as Array<{ count: number }>;
  return result[0]?.count ?? 0;
}

export async function getSlaughterRecordById(id: number): Promise<SlaughterRecordWithDetails | null> {
  const sql = getDb();

  const rows = await sql`
    SELECT
      sr.id,
      sr.farm_inventory_id as "farmInventoryId",
      sr.order_item_id as "orderItemId",
      sr.slaughtered_at as "slaughteredAt",
      sr.slaughter_location as "slaughterLocation",
      sr.slaughter_latitude::text as "slaughterLatitude",
      sr.slaughter_longitude::text as "slaughterLongitude",
      sr.documentation_photos as "documentationPhotos",
      sr.certificate_url as "certificateUrl",
      sr.notes,
      sr.performed_by as "performedBy",
      sr.created_at as "createdAt",
      sr.updated_at as "updatedAt",
      fi.eartag_id as "eartagId",
      oi.item_name as "itemName",
      o.customer_name as "customerName",
      o.customer_phone as "customerPhone",
      o.invoice_number as "invoiceNumber",
      o.id as "orderId"
    FROM slaughter_records sr
    JOIN farm_inventories fi ON fi.id = sr.farm_inventory_id
    JOIN order_items oi ON oi.id = sr.order_item_id
    JOIN orders o ON o.id = oi.order_id
    WHERE sr.id = ${id}
  ` as unknown as Array<Record<string, unknown>>;

  if (!rows[0]) return null;

  const participants = await sql`
    SELECT participant_name FROM order_participants 
    WHERE order_item_id = ${rows[0].orderItemId}
  ` as unknown as Array<{ participant_name: string }>;

  return {
    ...rows[0],
    documentationPhotos: (rows[0].documentationPhotos as DocumentationPhoto[]) || [],
    participantNames: participants.map((p) => p.participant_name),
  } as SlaughterRecordWithDetails;
}

export async function getSlaughterRecordByFarmInventoryId(
  farmInventoryId: number
): Promise<SlaughterRecord | null> {
  const sql = getDb();

  const rows = await sql`
    SELECT
      id,
      farm_inventory_id as "farmInventoryId",
      order_item_id as "orderItemId",
      slaughtered_at as "slaughteredAt",
      slaughter_location as "slaughterLocation",
      slaughter_latitude::text as "slaughterLatitude",
      slaughter_longitude::text as "slaughterLongitude",
      documentation_photos as "documentationPhotos",
      certificate_url as "certificateUrl",
      notes,
      performed_by as "performedBy",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM slaughter_records
    WHERE farm_inventory_id = ${farmInventoryId}
  ` as unknown as Array<Record<string, unknown>>;

  if (!rows[0]) return null;
  return {
    ...rows[0],
    documentationPhotos: (rows[0].documentationPhotos as DocumentationPhoto[]) || [],
  } as SlaughterRecord;
}

export async function createSlaughterRecord(data: SlaughterRecordInput): Promise<number> {
  const sql = getDb();
  const photos = JSON.stringify(data.documentationPhotos || []);

  const result = await sql`
    INSERT INTO slaughter_records (
      farm_inventory_id,
      order_item_id,
      slaughtered_at,
      slaughter_location,
      slaughter_latitude,
      slaughter_longitude,
      documentation_photos,
      notes,
      performed_by
    ) VALUES (
      ${data.farmInventoryId},
      ${data.orderItemId},
      ${data.slaughteredAt}::timestamp,
      ${data.slaughterLocation || null},
      ${data.slaughterLatitude || null},
      ${data.slaughterLongitude || null},
      ${photos}::jsonb,
      ${data.notes || null},
      ${data.performedBy || null}
    )
    RETURNING id
  ` as unknown as Array<{ id: number }>;

  return result[0].id;
}

export async function updateSlaughterRecord(
  id: number,
  data: Partial<SlaughterRecordInput>
): Promise<void> {
  const sql = getDb();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.slaughteredAt !== undefined) {
    values.push(data.slaughteredAt);
    updates.push(`slaughtered_at = $${values.length}::timestamp`);
  }

  if (data.slaughterLocation !== undefined) {
    values.push(data.slaughterLocation);
    updates.push(`slaughter_location = $${values.length}`);
  }

  if (data.slaughterLatitude !== undefined) {
    values.push(data.slaughterLatitude);
    updates.push(`slaughter_latitude = $${values.length}`);
  }

  if (data.slaughterLongitude !== undefined) {
    values.push(data.slaughterLongitude);
    updates.push(`slaughter_longitude = $${values.length}`);
  }

  if (data.notes !== undefined) {
    values.push(data.notes);
    updates.push(`notes = $${values.length}`);
  }

  if (data.performedBy !== undefined) {
    values.push(data.performedBy);
    updates.push(`performed_by = $${values.length}`);
  }

  if (data.documentationPhotos !== undefined) {
    values.push(JSON.stringify(data.documentationPhotos));
    updates.push(`documentation_photos = $${values.length}::jsonb`);
  }

  if (updates.length === 0) return;

  updates.push("updated_at = NOW()");
  values.push(id);

  const query = `
    UPDATE slaughter_records
    SET ${updates.join(", ")}
    WHERE id = $${values.length}
  `;

  await sql.query(query, values);
}

export async function addSlaughterPhotos(
  id: number,
  photos: DocumentationPhoto[]
): Promise<void> {
  const sql = getDb();

  const currentRecord = await sql`
    SELECT documentation_photos FROM slaughter_records WHERE id = ${id}
  ` as unknown as Array<{ documentation_photos: DocumentationPhoto[] | null }>;

  const existingPhotos = currentRecord[0]?.documentation_photos || [];
  const allPhotos = [...existingPhotos, ...photos];

  await sql`
    UPDATE slaughter_records
    SET 
      documentation_photos = ${JSON.stringify(allPhotos)}::jsonb,
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateCertificateUrl(id: number, certificateUrl: string): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE slaughter_records
    SET certificate_url = ${certificateUrl}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function getSlaughterCertificateData(id: number): Promise<CertificateData | null> {
  const sql = getDb();

  const rows = await sql`
    SELECT
      sr.id,
      sr.farm_inventory_id as "farmInventoryId",
      sr.order_item_id as "orderItemId",
      sr.slaughtered_at as "slaughteredAt",
      sr.slaughter_location as "slaughterLocation",
      sr.slaughter_latitude::text as "slaughterLatitude",
      sr.slaughter_longitude::text as "slaughterLongitude",
      sr.documentation_photos as "documentationPhotos",
      sr.certificate_url as "certificateUrl",
      sr.notes,
      sr.performed_by as "performedBy",
      sr.created_at as "createdAt",
      sr.updated_at as "updatedAt",
      oi.item_name as "itemName",
      o.customer_name as "customerName",
      o.invoice_number as "invoiceNumber",
      b.name as "branchName"
    FROM slaughter_records sr
    JOIN order_items oi ON oi.id = sr.order_item_id
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN branches b ON b.id = o.branch_id
    WHERE sr.id = ${id}
  ` as unknown as Array<Record<string, unknown>>;

  if (!rows[0]) return null;

  const participants = await sql`
    SELECT participant_name FROM order_participants 
    WHERE order_item_id = ${rows[0].orderItemId}
  ` as unknown as Array<{ participant_name: string }>;

  const row = rows[0];

  return {
    slaughterRecord: {
      id: row.id as number,
      farmInventoryId: row.farmInventoryId as number,
      orderItemId: row.orderItemId as number,
      slaughteredAt: row.slaughteredAt as string,
      slaughterLocation: row.slaughterLocation as string | null,
      slaughterLatitude: row.slaughterLatitude as string | null,
      slaughterLongitude: row.slaughterLongitude as string | null,
      documentationPhotos: (row.documentationPhotos as DocumentationPhoto[]) || [],
      certificateUrl: row.certificateUrl as string | null,
      notes: row.notes as string | null,
      performedBy: row.performedBy as string | null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    },
    customerName: row.customerName as string,
    participantNames: participants.map((p) => p.participant_name),
    itemName: row.itemName as string,
    invoiceNumber: row.invoiceNumber as string,
    slaughterDate: row.slaughteredAt as string,
    slaughterLocation: (row.slaughterLocation as string) || "",
    documentationPhotos: (row.documentationPhotos as DocumentationPhoto[]) || [],
    branchName: (row.branchName as string) || "Rumah Qurban",
  };
}

export async function getSlaughterableItems(orderId: number): Promise<
  Array<{
    orderItemId: number;
    itemName: string;
    farmInventoryId: number | null;
    eartagId: string | null;
    hasSlaughterRecord: boolean;
    slaughterRecordId: number | null;
  }>
> {
  const sql = getDb();

  type SlaughterableItemRow = {
    orderItemId: number;
    itemName: string;
    farmInventoryId: number | null;
    eartagId: string | null;
    slaughterRecordId: number | null;
  };

  const rows = await sql`
    SELECT 
      oi.id as "orderItemId",
      oi.item_name as "itemName",
      fi.id as "farmInventoryId",
      fi.eartag_id as "eartagId",
      sr.id as "slaughterRecordId"
    FROM order_items oi
    LEFT JOIN farm_inventories fi ON fi.order_item_id = oi.id
    LEFT JOIN slaughter_records sr ON sr.order_item_id = oi.id AND sr.farm_inventory_id = fi.id
    WHERE oi.order_id = ${orderId}
      AND oi.item_type = 'ANIMAL'
    ORDER BY oi.id
  ` as unknown as SlaughterableItemRow[];

  return rows.map((row) => ({
    orderItemId: row.orderItemId,
    itemName: row.itemName,
    farmInventoryId: row.farmInventoryId,
    eartagId: row.eartagId,
    hasSlaughterRecord: !!row.slaughterRecordId,
    slaughterRecordId: row.slaughterRecordId,
  }));
}
