import { getDb } from "@/lib/db/client";

export type OrderListRow = {
  id: number;
  createdAt: string;
  invoiceNumber: string;
  branchId: number | null;
  customerName: string;
  customerPhone: string | null;
  customerType: string | null;
  subtotal: string;
  discount: string;
  grandTotal: string;
  dpPaid: string;
  remainingBalance: string;
  status: string;
  totalAnimalItems: number;
  allocatedCount: number;
  slaughteredCount: number;
};

export async function listOrders(params: {
  branchId?: number;
  customerType?: string;
  status?: string;
  q?: string;
  startDate?: string;
  endDate?: string;
  allocationStatus?: string;
  slaughterStatus?: string;
  limit: number;
  offset: number;
}) {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const having: string[] = [];
  const values: unknown[] = [];

  if (params.branchId) {
    values.push(params.branchId);
    where.push(`o.branch_id = $${values.length}`);
  }

  if (params.customerType) {
    values.push(params.customerType);
    where.push(`o.customer_type = $${values.length}`);
  }

  if (params.status) {
    values.push(params.status);
    where.push(`o.status = $${values.length}`);
  }

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`o.created_at >= $${values.length}::timestamp`);
  }

  if (params.endDate) {
    values.push(`${params.endDate} 23:59:59`);
    where.push(`o.created_at <= $${values.length}::timestamp`);
  }

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(
      `(o.invoice_number ILIKE $${p} OR o.customer_name ILIKE $${p} OR o.customer_phone ILIKE $${p})`
    );
  }

  if (params.allocationStatus === "allocated") {
    having.push(`COALESCE(COUNT(DISTINCT ia.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT ia.order_item_id), 0) >= COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.allocationStatus === "partial") {
    having.push(`COALESCE(COUNT(DISTINCT ia.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT ia.order_item_id), 0) < COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.allocationStatus === "unallocated") {
    having.push(`COALESCE(COUNT(DISTINCT ia.order_item_id), 0) = 0 AND COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END) > 0`);
  }

  if (params.slaughterStatus === "slaughtered") {
    having.push(`COALESCE(COUNT(DISTINCT sr.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT sr.order_item_id), 0) >= COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.slaughterStatus === "partial") {
    having.push(`COALESCE(COUNT(DISTINCT sr.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT sr.order_item_id), 0) < COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.slaughterStatus === "not_slaughtered") {
    having.push(`COALESCE(COUNT(DISTINCT sr.order_item_id), 0) = 0 AND COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END) > 0`);
  }

  const havingClause = having.length > 0 ? `HAVING ${having.join(" AND ")}` : "";

  const query = `
    SELECT
      o.id,
      o.created_at as "createdAt",
      o.invoice_number as "invoiceNumber",
      o.branch_id as "branchId",
      o.customer_name as "customerName",
      o.customer_phone as "customerPhone",
      o.customer_type as "customerType",
      o.subtotal::text as subtotal,
      o.discount::text as discount,
      o.grand_total::text as "grandTotal",
      o.dp_paid::text as "dpPaid",
      o.remaining_balance::text as "remainingBalance",
      o.status,
      COALESCE(COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END), 0)::int as "totalAnimalItems",
      COALESCE(COUNT(DISTINCT ia.order_item_id), 0)::int as "allocatedCount",
      COALESCE(COUNT(DISTINCT sr.order_item_id), 0)::int as "slaughteredCount"
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id AND oi.item_type = 'ANIMAL'
    LEFT JOIN slaughter_records sr ON sr.order_item_id = oi.id AND oi.item_type = 'ANIMAL'
    WHERE ${where.join(" AND ")}
    GROUP BY o.id
    ${havingClause}
    ORDER BY o.created_at DESC, o.id DESC
    LIMIT ${params.limit} OFFSET ${params.offset}
  `;

  const rows = await sql.query(query, values);
  return rows as unknown as OrderListRow[];
}

export async function countOrders(params: {
  branchId?: number;
  customerType?: string;
  status?: string;
  q?: string;
  startDate?: string;
  endDate?: string;
  allocationStatus?: string;
  slaughterStatus?: string;
}) {
  const sql = getDb();
  const where: string[] = ["1=1"];
  const having: string[] = [];
  const values: unknown[] = [];

  if (params.branchId) {
    values.push(params.branchId);
    where.push(`o.branch_id = $${values.length}`);
  }

  if (params.customerType) {
    values.push(params.customerType);
    where.push(`o.customer_type = $${values.length}`);
  }

  if (params.status) {
    values.push(params.status);
    where.push(`o.status = $${values.length}`);
  }

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`o.created_at >= $${values.length}::timestamp`);
  }

  if (params.endDate) {
    values.push(`${params.endDate} 23:59:59`);
    where.push(`o.created_at <= $${values.length}::timestamp`);
  }

  if (params.q) {
    values.push(`%${params.q}%`);
    const p = values.length;
    where.push(
      `(o.invoice_number ILIKE $${p} OR o.customer_name ILIKE $${p} OR o.customer_phone ILIKE $${p})`
    );
  }

  if (params.allocationStatus === "allocated") {
    having.push(`COALESCE(COUNT(DISTINCT ia.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT ia.order_item_id), 0) >= COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.allocationStatus === "partial") {
    having.push(`COALESCE(COUNT(DISTINCT ia.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT ia.order_item_id), 0) < COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.allocationStatus === "unallocated") {
    having.push(`COALESCE(COUNT(DISTINCT ia.order_item_id), 0) = 0 AND COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END) > 0`);
  }

  if (params.slaughterStatus === "slaughtered") {
    having.push(`COALESCE(COUNT(DISTINCT sr.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT sr.order_item_id), 0) >= COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.slaughterStatus === "partial") {
    having.push(`COALESCE(COUNT(DISTINCT sr.order_item_id), 0) > 0 AND COALESCE(COUNT(DISTINCT sr.order_item_id), 0) < COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END)`);
  } else if (params.slaughterStatus === "not_slaughtered") {
    having.push(`COALESCE(COUNT(DISTINCT sr.order_item_id), 0) = 0 AND COUNT(DISTINCT CASE WHEN oi.item_type = 'ANIMAL' THEN oi.id END) > 0`);
  }

  const havingClause = having.length > 0 ? `HAVING ${having.join(" AND ")}` : "";

  const query = `
    SELECT COUNT(*) as count FROM (
      SELECT o.id
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id AND oi.item_type = 'ANIMAL'
      LEFT JOIN slaughter_records sr ON sr.order_item_id = oi.id AND oi.item_type = 'ANIMAL'
      WHERE ${where.join(" AND ")}
      GROUP BY o.id
      ${havingClause}
    ) sub
  `;

  const rows = await sql.query(query, values);
  return parseInt((rows as unknown as Array<{ count: string }>)[0].count);
}

export async function deleteOrder(id: number) {
  const sql = getDb();
  // Cascade delete handles order_items, order_participants, inventory_allocations
  // but we should reset farm_inventories status if any were linked
  await sql`
    UPDATE farm_inventories 
    SET status = 'AVAILABLE', order_item_id = NULL 
    WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ${id})
  `;
  await sql`DELETE FROM orders WHERE id = ${id}`;
}

export async function listOrdersByBranch(branchId: number) {
  return listOrders({ branchId, limit: 200, offset: 0 });
}


export type OrderItemRow = {
  id: number;
  itemType: string;
  itemName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  catalogOfferId: number | null;
  serviceId: number | null;
  coaCode: string | null;
};

export type OrderParticipantRow = {
  id: number;
  orderItemId: number;
  participantName: string;
  fatherName: string | null;
};

export type OrderDetail = {
  id: number;
  invoiceNumber: string;
  branchId: number | null;
  customerType: string | null;
  customerName: string;
  companyName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  subtotal: string;
  discount: string;
  grandTotal: string;
  dpPaid: string;
  remainingBalance: string;
  status: string;
  createdAt: string;
};

export type TransactionRow = {
  id: number;
  transactionType: string;
  amount: string;
  status: string;
  createdAt: string;
  paymentMethodCode: string | null;
};

export async function getTransactionsByOrderId(orderId: number) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      transaction_type as "transactionType",
      amount::text as amount,
      status,
      created_at as "createdAt",
      payment_method_code as "paymentMethodCode"
    FROM transactions
    WHERE order_id = ${orderId}
    ORDER BY created_at DESC
  `;
  return rows as unknown as TransactionRow[];
}

/**
 * @param branchFilter - Isolasi multi-tenant: wajib `branchId` untuk admin cabang.
 *   Gunakan `null` hanya untuk SUPER_ADMIN agar pesanan semua cabang (dan `branch_id` NULL) bisa dibuka.
 */
export async function getOrderWithItems(orderId: number, branchFilter: number | null) {
  const sql = getDb();
  const orderRows =
    branchFilter === null
      ? await sql`
    SELECT
      id,
      invoice_number as "invoiceNumber",
      branch_id as "branchId",
      customer_type as "customerType",
      customer_name as "customerName",
      company_name as "companyName",
      customer_phone as "customerPhone",
      customer_email as "customerEmail",
      delivery_address as "deliveryAddress",
      latitude,
      longitude,
      subtotal::text as subtotal,
      discount::text as discount,
      grand_total::text as "grandTotal",
      dp_paid::text as "dpPaid",
      remaining_balance::text as "remainingBalance",
      status,
      created_at as "createdAt"
    FROM orders
    WHERE id = ${orderId}
    LIMIT 1
  `
      : await sql`
    SELECT
      id,
      invoice_number as "invoiceNumber",
      branch_id as "branchId",
      customer_type as "customerType",
      customer_name as "customerName",
      company_name as "companyName",
      customer_phone as "customerPhone",
      customer_email as "customerEmail",
      delivery_address as "deliveryAddress",
      latitude,
      longitude,
      subtotal::text as subtotal,
      discount::text as discount,
      grand_total::text as "grandTotal",
      dp_paid::text as "dpPaid",
      remaining_balance::text as "remainingBalance",
      status,
      created_at as "createdAt"
    FROM orders
    WHERE id = ${orderId} AND branch_id = ${branchFilter}
    LIMIT 1
  `;
  const order = (orderRows as unknown as OrderDetail[])[0];
  if (!order) return null;

  const itemRows = await sql`
    SELECT
      id,
      item_type as "itemType",
      item_name as "itemName",
      quantity,
      unit_price::text as "unitPrice",
      total_price::text as "totalPrice",
      catalog_offer_id as "catalogOfferId",
      service_id as "serviceId",
      coa_code as "coaCode"
    FROM order_items
    WHERE order_id = ${orderId}
    ORDER BY id ASC
  `;
  const items = itemRows as unknown as OrderItemRow[];

  const itemIds = items.map((r) => r.id);
  let participants: OrderParticipantRow[] = [];
  if (itemIds.length > 0) {
    const ph = itemIds.map((_, i) => `$${i + 1}`).join(", ");
    const pq = `
      SELECT
        id,
        order_item_id as "orderItemId",
        participant_name as "participantName",
        father_name as "fatherName"
      FROM order_participants
      WHERE order_item_id IN (${ph})
    `;
    const plist = await sql.query(pq, itemIds);
    participants = plist as unknown as OrderParticipantRow[];
  }

  const transactions = await getTransactionsByOrderId(orderId);

  return {
    order,
    items,
    participants,
    transactions,
  };
}

export async function searchOrders(term: string) {
  const sql = getDb();
  const search = `%${term}%`;
  const rows = await sql`
    SELECT 
      id,
      invoice_number as "invoiceNumber",
      customer_name as "customerName",
      grand_total::text as "grandTotal",
      status
    FROM orders
    WHERE invoice_number ILIKE ${search} OR customer_name ILIKE ${search}
    ORDER BY created_at DESC
    LIMIT 20
  `;
  return rows as unknown as {
    id: number;
    invoiceNumber: string;
    customerName: string;
    grandTotal: string;
    status: string;
  }[];
}
