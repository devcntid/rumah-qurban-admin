import { getDb } from "@/lib/db/client";
import type { NotifTemplate, NotifTemplateInput } from "@/types/notifications";

export async function listNotifTemplates(params: {
  q?: string;
  limit: number;
  offset: number;
}): Promise<NotifTemplate[]> {
  const sql = getDb();
  const { q, limit, offset } = params;

  if (q) {
    const searchTerm = `%${q}%`;
    const rows = await sql`
      SELECT 
        id,
        name,
        template_text as "templateText",
        created_at as "createdAt"
      FROM notif_templates
      WHERE name ILIKE ${searchTerm} OR template_text ILIKE ${searchTerm}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows as NotifTemplate[];
  }

  const rows = await sql`
    SELECT 
      id,
      name,
      template_text as "templateText",
      created_at as "createdAt"
    FROM notif_templates
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as NotifTemplate[];
}

export async function countNotifTemplates(params: { q?: string }): Promise<number> {
  const sql = getDb();
  const { q } = params;

  if (q) {
    const searchTerm = `%${q}%`;
    const result = await sql`
      SELECT COUNT(*)::int as count
      FROM notif_templates
      WHERE name ILIKE ${searchTerm} OR template_text ILIKE ${searchTerm}
    ` as unknown as Array<{ count: number }>;
    return result[0]?.count ?? 0;
  }

  const result = await sql`
    SELECT COUNT(*)::int as count FROM notif_templates
  ` as unknown as Array<{ count: number }>;
  return result[0]?.count ?? 0;
}

export async function getAllNotifTemplates(): Promise<NotifTemplate[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT 
      id,
      name,
      template_text as "templateText",
      created_at as "createdAt"
    FROM notif_templates
    ORDER BY name ASC
  `;
  return rows as NotifTemplate[];
}

export async function getNotifTemplateById(id: number): Promise<NotifTemplate | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT 
      id,
      name,
      template_text as "templateText",
      created_at as "createdAt"
    FROM notif_templates
    WHERE id = ${id}
  ` as unknown as NotifTemplate[];
  return rows[0] ?? null;
}

export async function getNotifTemplateByName(name: string): Promise<NotifTemplate | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT 
      id,
      name,
      template_text as "templateText",
      created_at as "createdAt"
    FROM notif_templates
    WHERE name = ${name}
  ` as unknown as NotifTemplate[];
  return rows[0] ?? null;
}

export async function upsertNotifTemplate(data: NotifTemplateInput): Promise<number> {
  const sql = getDb();

  if (data.id) {
    await sql`
      UPDATE notif_templates
      SET 
        name = ${data.name},
        template_text = ${data.templateText}
      WHERE id = ${data.id}
    `;
    return data.id;
  }

  const result = await sql`
    INSERT INTO notif_templates (name, template_text)
    VALUES (${data.name}, ${data.templateText})
    RETURNING id
  ` as unknown as Array<{ id: number }>;
  return result[0]?.id;
}

export async function deleteNotifTemplate(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM notif_templates WHERE id = ${id}`;
}
