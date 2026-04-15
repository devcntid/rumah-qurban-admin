import { getDb } from "@/lib/db/client";

export type AdminUserRow = {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  branchId: number | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminUserInput = {
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  branchId?: number | null;
  isActive?: boolean;
};

export async function listAdminUsers(filters?: {
  role?: string;
  branchId?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserRow[]> {
  const sql = getDb();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  if (!filters || (!filters.role && filters.branchId === undefined && !filters.search && filters.isActive === undefined)) {
    const rows = await sql`
      SELECT
        id,
        email,
        password_hash as "passwordHash",
        full_name as "fullName",
        role,
        branch_id as "branchId",
        is_active as "isActive",
        last_login_at as "lastLoginAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM admin_users
      ORDER BY id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    return rows as unknown as AdminUserRow[];
  }

  // With filters - use tagged template for common cases
  let rows;

  if (filters.role && !filters.branchId && !filters.search && filters.isActive === undefined) {
    rows = await sql`
      SELECT
        id, email, full_name as "fullName", role, branch_id as "branchId",
        is_active as "isActive", last_login_at as "lastLoginAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM admin_users
      WHERE role = ${filters.role}
      ORDER BY id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (filters.branchId !== undefined && !filters.role && !filters.search && filters.isActive === undefined) {
    rows = await sql`
      SELECT
        id, email, full_name as "fullName", role, branch_id as "branchId",
        is_active as "isActive", last_login_at as "lastLoginAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM admin_users
      WHERE branch_id = ${filters.branchId}
      ORDER BY id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (filters.search && !filters.role && filters.branchId === undefined && filters.isActive === undefined) {
    const searchPattern = `%${filters.search}%`;
    rows = await sql`
      SELECT
        id, email, full_name as "fullName", role, branch_id as "branchId",
        is_active as "isActive", last_login_at as "lastLoginAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM admin_users
      WHERE (full_name ILIKE ${searchPattern} OR email ILIKE ${searchPattern})
      ORDER BY id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else {
    rows = await sql`
      SELECT
        id, email, full_name as "fullName", role, branch_id as "branchId",
        is_active as "isActive", last_login_at as "lastLoginAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM admin_users
      ORDER BY id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
  }

  return rows as AdminUserRow[];
}

export async function countAdminUsers(filters?: {
  role?: string;
  branchId?: number;
  search?: string;
  isActive?: boolean;
}): Promise<number> {
  const sql = getDb();

  if (!filters || (!filters.role && filters.branchId === undefined && !filters.search && filters.isActive === undefined)) {
    const rows = await sql`SELECT COUNT(*) as count FROM admin_users`;
    return Number((rows as any)[0]?.count ?? 0);
  }

  let rows;

  if (filters.role && !filters.branchId && !filters.search && filters.isActive === undefined) {
    rows = await sql`SELECT COUNT(*) as count FROM admin_users WHERE role = ${filters.role}`;
  } else if (filters.branchId !== undefined && !filters.role && !filters.search && filters.isActive === undefined) {
    rows = await sql`SELECT COUNT(*) as count FROM admin_users WHERE branch_id = ${filters.branchId}`;
  } else if (filters.search && !filters.role && filters.branchId === undefined && filters.isActive === undefined) {
    const searchPattern = `%${filters.search}%`;
    rows = await sql`SELECT COUNT(*) as count FROM admin_users WHERE (full_name ILIKE ${searchPattern} OR email ILIKE ${searchPattern})`;
  } else {
    rows = await sql`SELECT COUNT(*) as count FROM admin_users`;
  }

  return Number((rows as { count: number }[])[0]?.count ?? 0);
}

export async function getAdminUserById(
  id: number
): Promise<AdminUserRow | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      email,
      password_hash as "passwordHash",
      full_name as "fullName",
      role,
      branch_id as "branchId",
      is_active as "isActive",
      last_login_at as "lastLoginAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM admin_users
    WHERE id = ${id}
    LIMIT 1
  `;
  return (rows as unknown as AdminUserRow[])[0] || null;
}

export async function getAdminUserByEmail(
  email: string
): Promise<AdminUserRow | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      email,
      password_hash as "passwordHash",
      full_name as "fullName",
      role,
      branch_id as "branchId",
      is_active as "isActive",
      last_login_at as "lastLoginAt",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM admin_users
    WHERE email = ${email}
    LIMIT 1
  `;
  return (rows as unknown as AdminUserRow[])[0] || null;
}

export async function createAdminUser(
  data: AdminUserInput
): Promise<{ id: number }> {
  const sql = getDb();

  const rows = await sql`
    INSERT INTO admin_users (
      email,
      password_hash,
      full_name,
      role,
      branch_id,
      is_active
    )
    VALUES (
      ${data.email},
      ${data.passwordHash},
      ${data.fullName},
      ${data.role},
      ${data.branchId ?? null},
      ${data.isActive ?? true}
    )
    RETURNING id
  `;

  return { id: (rows as any)[0].id };
}

export async function updateAdminUser(
  id: number,
  data: Partial<Omit<AdminUserInput, "passwordHash">>
): Promise<void> {
  const sql = getDb();

  // Use tagged template with all fields
  await sql`
    UPDATE admin_users
    SET 
      email = ${data.email ?? sql`email`},
      full_name = ${data.fullName ?? sql`full_name`},
      role = ${data.role ?? sql`role`},
      branch_id = ${data.branchId !== undefined ? data.branchId : sql`branch_id`},
      is_active = ${data.isActive !== undefined ? data.isActive : sql`is_active`},
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateAdminPassword(
  id: number,
  passwordHash: string
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE admin_users
    SET password_hash = ${passwordHash}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function deleteAdminUser(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM admin_users WHERE id = ${id}`;
}

export async function updateLastLogin(id: number): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE admin_users
    SET last_login_at = NOW()
    WHERE id = ${id}
  `;
}
