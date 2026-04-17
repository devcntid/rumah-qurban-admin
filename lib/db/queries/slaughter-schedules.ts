import { getDb } from "@/lib/db/client";
import type {
  SlaughterSchedule,
  SlaughterScheduleInput,
  AssignableOrderItem,
} from "@/types/slaughter-schedule";

export async function listSlaughterSchedules(params: {
  branchId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}): Promise<{ rows: SlaughterSchedule[]; total: number }> {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.branchId) {
    values.push(params.branchId);
    where.push(`ss.branch_id = $${values.length}`);
  }
  if (params.status) {
    values.push(params.status);
    where.push(`ss.status = $${values.length}`);
  }
  if (params.startDate) {
    values.push(params.startDate);
    where.push(`ss.scheduled_date >= $${values.length}::date`);
  }
  if (params.endDate) {
    values.push(params.endDate);
    where.push(`ss.scheduled_date <= $${values.length}::date`);
  }

  const countQuery = `
    SELECT COUNT(*)::int as count
    FROM slaughter_schedules ss
    WHERE ${where.join(" AND ")}
  `;
  const countResult = await sql.query(countQuery, values) as unknown as Array<{ count: number }>;
  const total = countResult[0]?.count ?? 0;

  values.push(params.limit);
  values.push(params.offset);

  const query = `
    SELECT
      ss.id,
      ss.branch_id as "branchId",
      b.name as "branchName",
      ss.scheduled_date::text as "scheduledDate",
      ss.location_name as "locationName",
      ss.location_lat::text as "locationLat",
      ss.location_lng::text as "locationLng",
      ss.notes,
      ss.status,
      ss.created_at as "createdAt",
      ss.updated_at as "updatedAt",
      COALESCE(ac.cnt, 0)::int as "assignedCount"
    FROM slaughter_schedules ss
    JOIN branches b ON b.id = ss.branch_id
    LEFT JOIN (
      SELECT slaughter_schedule_id, COUNT(*)::int as cnt
      FROM order_items
      WHERE slaughter_schedule_id IS NOT NULL
      GROUP BY slaughter_schedule_id
    ) ac ON ac.slaughter_schedule_id = ss.id
    WHERE ${where.join(" AND ")}
    ORDER BY ss.scheduled_date DESC, ss.id DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `;

  const rows = await sql.query(query, values) as unknown as SlaughterSchedule[];
  return { rows, total };
}

export async function getSlaughterScheduleById(id: number): Promise<SlaughterSchedule | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      ss.id,
      ss.branch_id as "branchId",
      b.name as "branchName",
      ss.scheduled_date::text as "scheduledDate",
      ss.location_name as "locationName",
      ss.location_lat::text as "locationLat",
      ss.location_lng::text as "locationLng",
      ss.notes,
      ss.status,
      ss.created_at as "createdAt",
      ss.updated_at as "updatedAt",
      COALESCE(ac.cnt, 0)::int as "assignedCount"
    FROM slaughter_schedules ss
    JOIN branches b ON b.id = ss.branch_id
    LEFT JOIN (
      SELECT slaughter_schedule_id, COUNT(*)::int as cnt
      FROM order_items
      WHERE slaughter_schedule_id IS NOT NULL
      GROUP BY slaughter_schedule_id
    ) ac ON ac.slaughter_schedule_id = ss.id
    WHERE ss.id = ${id}
  ` as unknown as SlaughterSchedule[];
  return rows[0] || null;
}

export async function createSlaughterSchedule(data: SlaughterScheduleInput): Promise<number> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO slaughter_schedules (
      branch_id, scheduled_date, location_name,
      location_lat, location_lng, notes, status
    ) VALUES (
      ${data.branchId},
      ${data.scheduledDate}::date,
      ${data.locationName},
      ${data.locationLat ?? null},
      ${data.locationLng ?? null},
      ${data.notes ?? null},
      ${data.status || "PLANNED"}
    )
    RETURNING id
  ` as unknown as Array<{ id: number }>;
  return result[0].id;
}

export async function updateSlaughterSchedule(
  id: number,
  data: Partial<SlaughterScheduleInput>
): Promise<void> {
  const sql = getDb();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.branchId !== undefined) {
    values.push(data.branchId);
    updates.push(`branch_id = $${values.length}`);
  }
  if (data.scheduledDate !== undefined) {
    values.push(data.scheduledDate);
    updates.push(`scheduled_date = $${values.length}::date`);
  }
  if (data.locationName !== undefined) {
    values.push(data.locationName);
    updates.push(`location_name = $${values.length}`);
  }
  if (data.locationLat !== undefined) {
    values.push(data.locationLat);
    updates.push(`location_lat = $${values.length}`);
  }
  if (data.locationLng !== undefined) {
    values.push(data.locationLng);
    updates.push(`location_lng = $${values.length}`);
  }
  if (data.notes !== undefined) {
    values.push(data.notes);
    updates.push(`notes = $${values.length}`);
  }
  if (data.status !== undefined) {
    values.push(data.status);
    updates.push(`status = $${values.length}`);
  }

  if (updates.length === 0) return;

  updates.push("updated_at = NOW()");
  values.push(id);

  const query = `
    UPDATE slaughter_schedules
    SET ${updates.join(", ")}
    WHERE id = $${values.length}
  `;
  await sql.query(query, values);
}

export async function deleteSlaughterSchedule(id: number): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE order_items SET slaughter_schedule_id = NULL
    WHERE slaughter_schedule_id = ${id}
  `;
  await sql`DELETE FROM slaughter_schedules WHERE id = ${id}`;
}

export async function getAssignedOrderItems(scheduleId: number): Promise<AssignableOrderItem[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      oi.id as "orderItemId",
      o.id as "orderId",
      o.invoice_number as "invoiceNumber",
      o.customer_name as "customerName",
      o.customer_phone as "customerPhone",
      oi.item_name as "itemName",
      o.branch_id as "branchId",
      b.name as "branchName",
      ia.farm_inventory_id as "farmInventoryId",
      fi.eartag_id as "eartagId",
      oi.slaughter_schedule_id as "currentScheduleId"
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN branches b ON b.id = o.branch_id
    LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
    LEFT JOIN farm_inventories fi ON fi.id = ia.farm_inventory_id
    WHERE oi.slaughter_schedule_id = ${scheduleId}
      AND oi.item_type = 'ANIMAL'
    ORDER BY o.invoice_number
  ` as unknown as Array<Record<string, unknown>>;

  const results: AssignableOrderItem[] = [];
  for (const row of rows) {
    const participants = await sql`
      SELECT participant_name FROM order_participants
      WHERE order_item_id = ${row.orderItemId}
    ` as unknown as Array<{ participant_name: string }>;

    results.push({
      ...row,
      participantNames: participants.map((p) => p.participant_name),
    } as AssignableOrderItem);
  }
  return results;
}

export async function getUnassignedOrderItems(params: {
  branchId: number;
  q?: string;
}): Promise<AssignableOrderItem[]> {
  const sql = getDb();
  const where: string[] = [
    "oi.item_type = 'ANIMAL'",
    "oi.slaughter_schedule_id IS NULL",
    "o.branch_id = $1",
    "o.status IN ('FULL_PAID', 'DP_PAID', 'CONFIRMED')",
  ];
  const values: unknown[] = [params.branchId];

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(
      `(o.invoice_number ILIKE $${p} OR o.customer_name ILIKE $${p} OR fi.eartag_id ILIKE $${p})`
    );
  }

  const query = `
    SELECT
      oi.id as "orderItemId",
      o.id as "orderId",
      o.invoice_number as "invoiceNumber",
      o.customer_name as "customerName",
      o.customer_phone as "customerPhone",
      oi.item_name as "itemName",
      o.branch_id as "branchId",
      b.name as "branchName",
      ia.farm_inventory_id as "farmInventoryId",
      fi.eartag_id as "eartagId",
      oi.slaughter_schedule_id as "currentScheduleId"
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN branches b ON b.id = o.branch_id
    LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
    LEFT JOIN farm_inventories fi ON fi.id = ia.farm_inventory_id
    LEFT JOIN slaughter_records sr ON sr.order_item_id = oi.id
    WHERE ${where.join(" AND ")}
      AND sr.id IS NULL
    ORDER BY o.invoice_number
    LIMIT 100
  `;

  const rows = await sql.query(query, values) as unknown as Array<Record<string, unknown>>;

  const results: AssignableOrderItem[] = [];
  for (const row of rows) {
    const participants = await sql`
      SELECT participant_name FROM order_participants
      WHERE order_item_id = ${row.orderItemId}
    ` as unknown as Array<{ participant_name: string }>;

    results.push({
      ...row,
      participantNames: participants.map((p) => p.participant_name),
    } as AssignableOrderItem);
  }
  return results;
}

export async function assignOrderItemsToSchedule(
  scheduleId: number,
  orderItemIds: number[]
): Promise<void> {
  const sql = getDb();
  for (const orderItemId of orderItemIds) {
    await sql`
      UPDATE order_items
      SET slaughter_schedule_id = ${scheduleId}
      WHERE id = ${orderItemId} AND item_type = 'ANIMAL'
    `;
  }
}

export async function unassignOrderItemsFromSchedule(orderItemIds: number[]): Promise<void> {
  const sql = getDb();
  for (const orderItemId of orderItemIds) {
    await sql`
      UPDATE order_items
      SET slaughter_schedule_id = NULL
      WHERE id = ${orderItemId}
    `;
  }
}

export async function getScheduleByOrderItemId(
  orderItemId: number
): Promise<SlaughterSchedule | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      ss.id,
      ss.branch_id as "branchId",
      b.name as "branchName",
      ss.scheduled_date::text as "scheduledDate",
      ss.location_name as "locationName",
      ss.location_lat::text as "locationLat",
      ss.location_lng::text as "locationLng",
      ss.notes,
      ss.status,
      ss.created_at as "createdAt",
      ss.updated_at as "updatedAt"
    FROM slaughter_schedules ss
    JOIN branches b ON b.id = ss.branch_id
    JOIN order_items oi ON oi.slaughter_schedule_id = ss.id
    WHERE oi.id = ${orderItemId}
  ` as unknown as SlaughterSchedule[];
  return rows[0] || null;
}

export async function listAllSchedulesForBranch(branchId: number): Promise<SlaughterSchedule[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      ss.id,
      ss.branch_id as "branchId",
      b.name as "branchName",
      ss.scheduled_date::text as "scheduledDate",
      ss.location_name as "locationName",
      ss.status,
      ss.created_at as "createdAt",
      ss.updated_at as "updatedAt",
      COALESCE(ac.cnt, 0)::int as "assignedCount"
    FROM slaughter_schedules ss
    JOIN branches b ON b.id = ss.branch_id
    LEFT JOIN (
      SELECT slaughter_schedule_id, COUNT(*)::int as cnt
      FROM order_items
      WHERE slaughter_schedule_id IS NOT NULL
      GROUP BY slaughter_schedule_id
    ) ac ON ac.slaughter_schedule_id = ss.id
    WHERE ss.branch_id = ${branchId}
      AND ss.status IN ('PLANNED', 'ONGOING')
    ORDER BY ss.scheduled_date ASC
  ` as unknown as SlaughterSchedule[];
  return rows;
}
