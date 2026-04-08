import { getDb } from "@/lib/db/client";

export type BranchRow = {
  id: number;
  name: string;
  coaCode: string | null;
  isActive: boolean;
};

export async function listBranches() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      name,
      coa_code as "coaCode",
      is_active as "isActive"
    FROM branches
    ORDER BY id ASC
  `;
  return rows as unknown as BranchRow[];
}

export async function upsertBranch(input: {
  id?: number;
  name: string;
  coaCode?: string | null;
  isActive?: boolean;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      INSERT INTO branches (id, name, coa_code, is_active)
      VALUES (${input.id}, ${input.name}, ${input.coaCode ?? null}, ${input.isActive ?? true})
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          coa_code = EXCLUDED.coa_code,
          is_active = EXCLUDED.is_active
    `;
    return;
  }
  await sql`
    INSERT INTO branches (name, coa_code, is_active)
    VALUES (${input.name}, ${input.coaCode ?? null}, ${input.isActive ?? true})
    ON CONFLICT (name) DO UPDATE
    SET coa_code = EXCLUDED.coa_code,
        is_active = EXCLUDED.is_active
  `;
}

export async function deleteBranch(id: number) {
  const sql = getDb();
  await sql`DELETE FROM branches WHERE id = ${id}`;
}

export type VendorRow = {
  id: number;
  name: string;
  location: string | null;
};

export async function listVendors() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, location
    FROM vendors
    ORDER BY id ASC
  `;
  return rows as unknown as VendorRow[];
}

export async function upsertVendor(input: {
  id?: number;
  name: string;
  location?: string | null;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      INSERT INTO vendors (id, name, location)
      VALUES (${input.id}, ${input.name}, ${input.location ?? null})
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          location = EXCLUDED.location
    `;
    return;
  }
  await sql`
    INSERT INTO vendors (name, location)
    VALUES (${input.name}, ${input.location ?? null})
    ON CONFLICT (name) DO UPDATE
    SET location = EXCLUDED.location
  `;
}

export async function deleteVendor(id: number) {
  const sql = getDb();
  await sql`DELETE FROM vendors WHERE id = ${id}`;
}

export type SalesAgentRow = {
  id: number;
  name: string;
  category: string;
  phone: string;
};

export async function listSalesAgents() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, category, phone
    FROM sales_agents
    ORDER BY id ASC
  `;
  return rows as unknown as SalesAgentRow[];
}

export async function upsertSalesAgent(input: {
  id?: number;
  name: string;
  category: string;
  phone: string;
}) {
  const sql = getDb();
  const phone = input.phone.trim() || "-";
  if (input.id) {
    await sql`
      INSERT INTO sales_agents (id, name, category, phone)
      VALUES (${input.id}, ${input.name}, ${input.category}, ${phone})
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          category = EXCLUDED.category,
          phone = EXCLUDED.phone
    `;
    return;
  }
  await sql`
    INSERT INTO sales_agents (name, category, phone)
    VALUES (${input.name}, ${input.category}, ${phone})
    ON CONFLICT (name) DO UPDATE
    SET category = EXCLUDED.category,
        phone = EXCLUDED.phone
  `;
}

export async function deleteSalesAgent(id: number) {
  const sql = getDb();
  await sql`DELETE FROM sales_agents WHERE id = ${id}`;
}

export type AnimalVariantRow = {
  id: number;
  species: string;
  classGrade: string | null;
  weightRange: string | null;
  description: string | null;
};

export async function listAnimalVariants() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      species,
      class_grade as "classGrade",
      weight_range as "weightRange",
      description
    FROM animal_variants
    ORDER BY id ASC
  `;
  return rows as unknown as AnimalVariantRow[];
}

export async function upsertAnimalVariant(input: {
  id?: number;
  species: string;
  classGrade?: string | null;
  weightRange?: string | null;
  description?: string | null;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      INSERT INTO animal_variants (id, species, class_grade, weight_range, description)
      VALUES (
        ${input.id},
        ${input.species},
        ${input.classGrade ?? null},
        ${input.weightRange ?? null},
        ${input.description ?? null}
      )
      ON CONFLICT (id) DO UPDATE
      SET species = EXCLUDED.species,
          class_grade = EXCLUDED.class_grade,
          weight_range = EXCLUDED.weight_range,
          description = EXCLUDED.description
    `;
    return;
  }
  await sql`
    INSERT INTO animal_variants (species, class_grade, weight_range, description)
    VALUES (
      ${input.species},
      ${input.classGrade ?? null},
      ${input.weightRange ?? null},
      ${input.description ?? null}
    )
  `;
}

export async function deleteAnimalVariant(id: number) {
  const sql = getDb();
  await sql`DELETE FROM animal_variants WHERE id = ${id}`;
}

export type PaymentMethodRow = {
  id: number;
  code: string;
  name: string;
  category: string;
  coaCode: string | null;
  isActive: boolean;
};

export async function listPaymentMethods() {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      code,
      name,
      category,
      coa_code as "coaCode",
      is_active as "isActive"
    FROM payment_methods
    ORDER BY id ASC
  `;
  return rows as unknown as PaymentMethodRow[];
}

export async function upsertPaymentMethod(input: {
  id?: number;
  code: string;
  name: string;
  category: string;
  coaCode?: string | null;
  isActive?: boolean;
}) {
  const sql = getDb();
  if (input.id) {
    await sql`
      INSERT INTO payment_methods (id, code, name, category, coa_code, is_active)
      VALUES (${input.id}, ${input.code}, ${input.name}, ${input.category}, ${input.coaCode ?? null}, ${input.isActive ?? true})
      ON CONFLICT (id) DO UPDATE
      SET code = EXCLUDED.code,
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          coa_code = EXCLUDED.coa_code,
          is_active = EXCLUDED.is_active
    `;
    return;
  }
  await sql`
    INSERT INTO payment_methods (code, name, category, coa_code, is_active)
    VALUES (${input.code}, ${input.name}, ${input.category}, ${input.coaCode ?? null}, ${input.isActive ?? true})
    ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name,
        category = EXCLUDED.category,
        coa_code = EXCLUDED.coa_code,
        is_active = EXCLUDED.is_active
  `;
}

export async function deletePaymentMethod(id: number) {
  const sql = getDb();
  await sql`DELETE FROM payment_methods WHERE id = ${id}`;
}
