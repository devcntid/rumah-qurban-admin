import { getDb } from "@/lib/db/client";
import { normalizePhoneNumber } from "@/lib/utils/phone";

export type CustomerRow = {
  id: number;
  phoneNormalized: string;
  name: string;
  email: string | null;
  customerType: string | null;
  companyName: string | null;
  totalOrders: number;
  totalSpent: string;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  createdAt: string;
};

export async function getOrCreateCustomer(params: {
  name: string;
  phone: string;
  email?: string | null;
  customerType?: string;
  companyName?: string | null;
  orderTotal: number;
  orderDate: string | Date;
}) {
  const sql = getDb();
  const phoneNorm = normalizePhoneNumber(params.phone);
  
  if (!phoneNorm) {
    throw new Error("Invalid phone number format");
  }
  
  const orderDateStr = typeof params.orderDate === 'string' 
    ? params.orderDate 
    : params.orderDate.toISOString();
  
  const existing = await sql`
    SELECT id, phone_normalized, name, total_orders, total_spent
    FROM customers
    WHERE phone_normalized = ${phoneNorm}
    LIMIT 1
  ` as any[];
  
  if (existing.length > 0) {
    const customer = existing[0];
    
    await sql`
      UPDATE customers
      SET 
        name = ${params.name},
        email = COALESCE(${params.email}, email),
        customer_type = ${params.customerType || 'B2C'},
        company_name = ${params.companyName},
        total_orders = total_orders + 1,
        total_spent = total_spent + ${params.orderTotal},
        last_order_date = ${orderDateStr}::timestamp,
        updated_at = NOW()
      WHERE id = ${customer.id}
    `;
    
    return customer.id;
  } else {
    const newCustomer = await sql`
      INSERT INTO customers (
        phone_normalized, name, email, customer_type, company_name,
        total_orders, total_spent, first_order_date, last_order_date
      ) VALUES (
        ${phoneNorm}, ${params.name}, ${params.email}, 
        ${params.customerType || 'B2C'}, ${params.companyName},
        1, ${params.orderTotal}, ${orderDateStr}::timestamp, ${orderDateStr}::timestamp
      )
      RETURNING id
    ` as any[];
    
    return Number(newCustomer[0].id);
  }
}

export async function listCustomers(params: {
  q?: string;
  customerType?: string;
  limit: number;
  offset: number;
}) {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(`(name ILIKE $${p} OR phone_normalized ILIKE $${p} OR email ILIKE $${p})`);
  }

  if (params.customerType) {
    values.push(params.customerType);
    where.push(`customer_type = $${values.length}`);
  }

  const query = `
    SELECT
      id,
      phone_normalized as "phoneNormalized",
      name,
      email,
      customer_type as "customerType",
      company_name as "companyName",
      total_orders as "totalOrders",
      total_spent::text as "totalSpent",
      first_order_date as "firstOrderDate",
      last_order_date as "lastOrderDate",
      created_at as "createdAt"
    FROM customers
    WHERE ${where.join(" AND ")}
    ORDER BY last_order_date DESC NULLS LAST, id DESC
    LIMIT ${params.limit} OFFSET ${params.offset}
  `;

  const rows = await sql.query(query, values);
  return rows as unknown as CustomerRow[];
}

export async function countCustomers(params: {
  q?: string;
  customerType?: string;
}) {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(`(name ILIKE $${p} OR phone_normalized ILIKE $${p} OR email ILIKE $${p})`);
  }

  if (params.customerType) {
    values.push(params.customerType);
    where.push(`customer_type = $${values.length}`);
  }

  const query = `SELECT count(*) FROM customers WHERE ${where.join(" AND ")}`;
  const rows = await sql.query(query, values);
  return parseInt((rows as any)[0].count);
}

export async function getCustomerRetentionStats(params: {
  startDate?: string;
  endDate?: string;
}) {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const values: unknown[] = [];

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`first_order_date >= $${values.length}::timestamp`);
  }

  if (params.endDate) {
    values.push(`${params.endDate} 23:59:59`);
    where.push(`first_order_date <= $${values.length}::timestamp`);
  }

  const query = `
    SELECT
      COUNT(*) FILTER (WHERE total_orders = 1) as new_customers,
      COUNT(*) FILTER (WHERE total_orders > 1) as returning_customers,
      COUNT(*) as total_customers,
      AVG(total_orders) as avg_orders_per_customer,
      AVG(total_spent) as avg_spent_per_customer
    FROM customers
    WHERE ${where.join(" AND ")}
  `;

  const rows = await sql.query(query, values);
  return (rows as any)[0];
}
