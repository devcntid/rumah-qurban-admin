import { getDb } from "@/lib/db/client";

export type ServiceRow = {
  id: number;
  name: string;
  serviceType: string;
  basePrice: string;
  branchId: number | null;
  animalVariantId: number | null;
  coaCode: string | null;
};

export async function listServices() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      name,
      service_type as "serviceType",
      base_price::text as "basePrice",
      branch_id as "branchId",
      animal_variant_id as "animalVariantId",
      coa_code as "coaCode"
    FROM services
    ORDER BY id ASC
  `;
  return rows as unknown as ServiceRow[];
}

export async function upsertService(input: {
  id?: number;
  name: string;
  serviceType: string;
  basePrice: number;
  branchId?: number | null;
  animalVariantId?: number | null;
  coaCode?: string | null;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      INSERT INTO services (id, name, service_type, base_price, branch_id, animal_variant_id, coa_code)
      VALUES (
        ${input.id},
        ${input.name},
        ${input.serviceType},
        ${input.basePrice},
        ${input.branchId ?? null},
        ${input.animalVariantId ?? null},
        ${input.coaCode ?? null}
      )
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          service_type = EXCLUDED.service_type,
          base_price = EXCLUDED.base_price,
          branch_id = EXCLUDED.branch_id,
          animal_variant_id = EXCLUDED.animal_variant_id,
          coa_code = EXCLUDED.coa_code
    `;
    return;
  }
  await sql`
    INSERT INTO services (name, service_type, base_price, branch_id, animal_variant_id, coa_code)
    VALUES (
      ${input.name},
      ${input.serviceType},
      ${input.basePrice},
      ${input.branchId ?? null},
      ${input.animalVariantId ?? null},
      ${input.coaCode ?? null}
    )
  `;
}

export async function deleteService(id: number) {
  const sql = getDb();
  await sql`DELETE FROM services WHERE id = ${id}`;
}
