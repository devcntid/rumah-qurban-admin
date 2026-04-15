import { getDb } from "@/lib/db/client";
import type { NotifLog, NotifLogInput } from "@/types/notifications";

export async function createNotifLog(data: NotifLogInput): Promise<number> {
  const sql = getDb();

  const result = await sql`
    INSERT INTO notif_logs (
      order_id,
      template_id,
      target_number,
      status,
      payload,
      provider_response
    ) VALUES (
      ${data.orderId},
      ${data.templateId},
      ${data.targetNumber},
      ${data.status},
      ${JSON.stringify(data.payload)}::jsonb,
      ${data.providerResponse ? JSON.stringify(data.providerResponse) : null}::jsonb
    )
    RETURNING id
  ` as unknown as Array<{ id: number }>;

  return result[0].id;
}

export async function updateNotifLogStatus(
  id: number,
  status: string,
  providerResponse: Record<string, unknown> | null
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE notif_logs
    SET 
      status = ${status},
      provider_response = ${providerResponse ? JSON.stringify(providerResponse) : null}::jsonb
    WHERE id = ${id}
  `;
}

export async function listNotifLogs(params: {
  orderId?: number;
  targetNumber?: string;
  status?: string;
  templateId?: number;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}): Promise<NotifLog[]> {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.orderId) {
    values.push(params.orderId);
    where.push(`nl.order_id = $${values.length}`);
  }

  if (params.targetNumber) {
    values.push(`%${params.targetNumber}%`);
    where.push(`nl.target_number ILIKE $${values.length}`);
  }

  if (params.status) {
    values.push(params.status);
    where.push(`nl.status = $${values.length}`);
  }

  if (params.templateId) {
    values.push(params.templateId);
    where.push(`nl.template_id = $${values.length}`);
  }

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`nl.created_at >= $${values.length}::timestamp`);
  }

  if (params.endDate) {
    values.push(`${params.endDate} 23:59:59`);
    where.push(`nl.created_at <= $${values.length}::timestamp`);
  }

  values.push(params.limit);
  values.push(params.offset);

  const query = `
    SELECT
      nl.id,
      nl.order_id as "orderId",
      nl.template_id as "templateId",
      nt.name as "templateName",
      nl.target_number as "targetNumber",
      nl.status,
      nl.payload,
      nl.provider_response as "providerResponse",
      nl.created_at as "createdAt"
    FROM notif_logs nl
    LEFT JOIN notif_templates nt ON nt.id = nl.template_id
    WHERE ${where.join(" AND ")}
    ORDER BY nl.created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
  `;

  const rows = await sql.query(query, values) as unknown as NotifLog[];
  return rows;
}

export async function countNotifLogs(params: {
  orderId?: number;
  targetNumber?: string;
  status?: string;
  templateId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<number> {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.orderId) {
    values.push(params.orderId);
    where.push(`order_id = $${values.length}`);
  }

  if (params.targetNumber) {
    values.push(`%${params.targetNumber}%`);
    where.push(`target_number ILIKE $${values.length}`);
  }

  if (params.status) {
    values.push(params.status);
    where.push(`status = $${values.length}`);
  }

  if (params.templateId) {
    values.push(params.templateId);
    where.push(`template_id = $${values.length}`);
  }

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`created_at >= $${values.length}::timestamp`);
  }

  if (params.endDate) {
    values.push(`${params.endDate} 23:59:59`);
    where.push(`created_at <= $${values.length}::timestamp`);
  }

  const query = `
    SELECT COUNT(*)::int as count
    FROM notif_logs
    WHERE ${where.join(" AND ")}
  `;

  const result = await sql.query(query, values) as unknown as Array<{ count: number }>;
  return result[0]?.count ?? 0;
}

export async function getNotifLogById(id: number): Promise<NotifLog | null> {
  const sql = getDb();

  const rows = await sql`
    SELECT
      nl.id,
      nl.order_id as "orderId",
      nl.template_id as "templateId",
      nt.name as "templateName",
      nl.target_number as "targetNumber",
      nl.status,
      nl.payload,
      nl.provider_response as "providerResponse",
      nl.created_at as "createdAt"
    FROM notif_logs nl
    LEFT JOIN notif_templates nt ON nt.id = nl.template_id
    WHERE nl.id = ${id}
  `;

  return (rows as unknown as NotifLog[])[0] ?? null;
}

export async function getNotifLogsByOrderId(orderId: number): Promise<NotifLog[]> {
  const sql = getDb();

  const rows = await sql`
    SELECT
      nl.id,
      nl.order_id as "orderId",
      nl.template_id as "templateId",
      nt.name as "templateName",
      nl.target_number as "targetNumber",
      nl.status,
      nl.payload,
      nl.provider_response as "providerResponse",
      nl.created_at as "createdAt"
    FROM notif_logs nl
    LEFT JOIN notif_templates nt ON nt.id = nl.template_id
    WHERE nl.order_id = ${orderId}
    ORDER BY nl.created_at DESC
  `;

  return rows as unknown as NotifLog[];
}
