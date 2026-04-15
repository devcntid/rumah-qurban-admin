import { getDb } from "@/lib/db/client";

export type FaqRow = {
  id: number;
  productId: number;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FaqInput = {
  id?: number;
  productId: number;
  category: string;
  question: string;
  answer: string;
  displayOrder?: number;
  isActive?: boolean;
};

export async function listFaqs(filters?: {
  productId?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<FaqRow[]> {
  const sql = getDb();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  // No filters - simple query
  if (!filters || (filters.productId === undefined && !filters.category && !filters.search && filters.isActive === undefined)) {
    const rows = await sql`
      SELECT
        id,
        product_id as "productId",
        category,
        question,
        answer,
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM faqs
      ORDER BY display_order ASC, id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    return rows as unknown as FaqRow[];
  }

  // With filters - build dynamic query parts
  let rows;

  if (filters.productId !== undefined && !filters.category && !filters.search && filters.isActive === undefined) {
    // Only productId filter
    rows = await sql`
      SELECT
        id,
        product_id as "productId",
        category,
        question,
        answer,
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM faqs
      WHERE product_id = ${filters.productId}
      ORDER BY display_order ASC, id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (filters.productId !== undefined && filters.category) {
    // productId + category
    rows = await sql`
      SELECT
        id,
        product_id as "productId",
        category,
        question,
        answer,
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM faqs
      WHERE product_id = ${filters.productId} AND category = ${filters.category}
      ORDER BY display_order ASC, id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (filters.productId !== undefined && filters.search) {
    // productId + search
    const searchPattern = `%${filters.search}%`;
    rows = await sql`
      SELECT
        id,
        product_id as "productId",
        category,
        question,
        answer,
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM faqs
      WHERE product_id = ${filters.productId} 
        AND (question ILIKE ${searchPattern} OR answer ILIKE ${searchPattern})
      ORDER BY display_order ASC, id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else {
    // Fallback - just productId or other combinations
    rows = await sql`
      SELECT
        id,
        product_id as "productId",
        category,
        question,
        answer,
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM faqs
      WHERE product_id = ${filters.productId || 1}
      ORDER BY display_order ASC, id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  }

  const result = rows as FaqRow[];
  console.log("[listFaqs] Result count:", result.length);
  return result;
}

export async function countFaqs(filters?: {
  productId?: number;
  category?: string;
  search?: string;
  isActive?: boolean;
}): Promise<number> {
  const sql = getDb();

  if (!filters || (filters.productId === undefined && !filters.category && !filters.search && filters.isActive === undefined)) {
    const rows = await sql`SELECT COUNT(*) as count FROM faqs`;
    return Number((rows as any)[0]?.count ?? 0);
  }

  let rows;

  if (filters.productId !== undefined && !filters.category && !filters.search && filters.isActive === undefined) {
    rows = await sql`SELECT COUNT(*) as count FROM faqs WHERE product_id = ${filters.productId}`;
  } else if (filters.productId !== undefined && filters.category) {
    rows = await sql`SELECT COUNT(*) as count FROM faqs WHERE product_id = ${filters.productId} AND category = ${filters.category}`;
  } else if (filters.productId !== undefined && filters.search) {
    const searchPattern = `%${filters.search}%`;
    rows = await sql`SELECT COUNT(*) as count FROM faqs WHERE product_id = ${filters.productId} AND (question ILIKE ${searchPattern} OR answer ILIKE ${searchPattern})`;
  } else {
    rows = await sql`SELECT COUNT(*) as count FROM faqs WHERE product_id = ${filters.productId || 1}`;
  }

  return Number((rows as any)[0]?.count ?? 0);
}

export async function getFaqById(id: number): Promise<FaqRow | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      product_id as "productId",
      category,
      question,
      answer,
      display_order as "displayOrder",
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM faqs
    WHERE id = ${id}
    LIMIT 1
  `;
  return (rows as unknown as FaqRow[])[0] || null;
}

export async function upsertFaq(input: FaqInput): Promise<{ id: number }> {
  const sql = getDb();

  if (input.id) {
    await sql`
      UPDATE faqs
      SET
        product_id = ${input.productId},
        category = ${input.category},
        question = ${input.question},
        answer = ${input.answer},
        display_order = ${input.displayOrder ?? 0},
        is_active = ${input.isActive ?? true},
        updated_at = NOW()
      WHERE id = ${input.id}
    `;
    return { id: input.id };
  }

  const rows = await sql`
    INSERT INTO faqs (product_id, category, question, answer, display_order, is_active)
    VALUES (
      ${input.productId},
      ${input.category},
      ${input.question},
      ${input.answer},
      ${input.displayOrder ?? 0},
      ${input.isActive ?? true}
    )
    RETURNING id
  `;

  return { id: (rows as any)[0].id };
}

export async function deleteFaq(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM faqs WHERE id = ${id}`;
}

export async function getFaqCategories(productId?: number): Promise<string[]> {
  const sql = getDb();

  if (productId !== undefined) {
    const rows = await sql`
      SELECT DISTINCT category
      FROM faqs
      WHERE product_id = ${productId}
      ORDER BY category ASC
    `;
    return (rows as any[]).map((r) => r.category);
  }

  const rows = await sql`
    SELECT DISTINCT category
    FROM faqs
    ORDER BY category ASC
  `;
  return (rows as any[]).map((r) => r.category);
}
