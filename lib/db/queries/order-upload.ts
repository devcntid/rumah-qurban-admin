import { getDb } from "@/lib/db/client";

export async function getBranchLookupMap() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name FROM branches WHERE is_active = TRUE
  `;
  const map = new Map<string, number>();
  for (const row of rows as any[]) {
    map.set(row.name.toLowerCase().trim(), row.id);
  }
  return map;
}

export async function getSalesAgentLookupMap() {
  const sql = getDb();
  const rows = await sql`SELECT id, name FROM sales_agents`;
  const map = new Map<string, number>();
  for (const row of rows as any[]) {
    map.set(row.name.toLowerCase().trim(), row.id);
  }
  return map;
}

export async function getCatalogOfferLookupMap() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, display_name FROM catalog_offers WHERE is_active = TRUE
  `;
  const map = new Map<string, number>();
  for (const row of rows as any[]) {
    map.set(row.display_name.toLowerCase().trim(), row.id);
  }
  return map;
}

export async function getPaymentMethodLookupMap() {
  const sql = getDb();
  const rows = await sql`
    SELECT code, name FROM payment_methods WHERE is_active = TRUE
  `;
  const map = new Map<string, string>();
  for (const row of rows as any[]) {
    map.set(row.name.toLowerCase().trim(), row.code);
  }
  return map;
}
