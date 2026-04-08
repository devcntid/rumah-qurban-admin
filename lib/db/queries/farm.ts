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
