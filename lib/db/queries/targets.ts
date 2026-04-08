import { getDb } from "@/lib/db/client";

export type SalesTargetRow = {
  id: number;
  branchId: number;
  year: number;
  season: string | null;
  species: string;
  category: string;
  targetEkor: number;
  targetOmset: string;
  targetHpp: string;
  notes: string | null;
};

export async function listSalesTargets(params: {
  branchId?: number;
  year?: number;
  species?: string;
  category?: string;
  limit: number;
  offset: number;
}) {
  const sql = getDb();

  const where: string[] = [];
  const values: unknown[] = [];

  const push = (cond: string, val?: unknown) => {
    where.push(cond);
    if (typeof val !== "undefined") values.push(val);
  };

  if (params.branchId) push(`branch_id = $${values.length + 1}`, params.branchId);
  if (params.year) push(`year = $${values.length + 1}`, params.year);
  if (params.species) push(`species = $${values.length + 1}`, params.species);
  if (params.category) push(`category = $${values.length + 1}`, params.category);

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const q = `
    SELECT
      id,
      branch_id as "branchId",
      year,
      season,
      species,
      category,
      target_ekor as "targetEkor",
      target_omset::text as "targetOmset",
      target_hpp::text as "targetHpp",
      notes
    FROM sales_targets
    ${whereSql}
    ORDER BY year DESC, branch_id ASC, species ASC, category ASC, id ASC
    LIMIT ${params.limit} OFFSET ${params.offset}
  `;

  const rows = await sql.query(q, values);
  return rows as unknown as SalesTargetRow[];
}

export async function upsertSalesTarget(input: {
  branchId: number;
  year: number;
  season?: string | null;
  species: string;
  category: string;
  targetEkor: number;
  targetOmset: number;
  targetHpp: number;
  notes?: string | null;
}) {
  const sql = getDb();
  await sql`
    INSERT INTO sales_targets (
      branch_id, year, season, species, category,
      target_ekor, target_omset, target_hpp, notes
    ) VALUES (
      ${input.branchId}, ${input.year}, ${input.season ?? null}, ${input.species}, ${input.category},
      ${input.targetEkor}, ${input.targetOmset}, ${input.targetHpp}, ${input.notes ?? null}
    )
    ON CONFLICT (branch_id, year, species, category) DO UPDATE
    SET season = EXCLUDED.season,
        target_ekor = EXCLUDED.target_ekor,
        target_omset = EXCLUDED.target_omset,
        target_hpp = EXCLUDED.target_hpp,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
  `;
}

export async function deleteSalesTarget(id: number) {
  const sql = getDb();
  await sql`DELETE FROM sales_targets WHERE id = ${id}`;
}

/** Baris dari view `target_vs_actual` — aktual hanya pesanan DP_PAID/FULL_PAID, baris ANIMAL + katalog. */
export type TargetVsActualRow = {
  salesTargetId: number;
  branchId: number;
  year: number;
  season: string | null;
  species: string;
  productCode: string;
  targetEkor: number;
  targetOmset: string;
  targetHpp: string;
  actualEkor: string;
  actualOmset: string;
};

export async function listTargetVsActual(branchId: number, year: number) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      sales_target_id as "salesTargetId",
      branch_id as "branchId",
      year,
      season,
      species,
      product_code as "productCode",
      target_ekor as "targetEkor",
      target_omset::text as "targetOmset",
      target_hpp::text as "targetHpp",
      actual_ekor::text as "actualEkor",
      actual_omset::text as "actualOmset"
    FROM target_vs_actual
    WHERE branch_id = ${branchId} AND year = ${year}
    ORDER BY species ASC, product_code ASC
  `;
  return rows as unknown as TargetVsActualRow[];
}

