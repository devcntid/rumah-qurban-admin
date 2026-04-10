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
};

export async function listOrdersByBranch(branchId: number) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      created_at as "createdAt",
      invoice_number as "invoiceNumber",
      branch_id as "branchId",
      customer_name as "customerName",
      customer_phone as "customerPhone",
      customer_type as "customerType",
      subtotal::text as subtotal,
      discount::text as discount,
      grand_total::text as "grandTotal",
      dp_paid::text as "dpPaid",
      remaining_balance::text as "remainingBalance",
      status
    FROM orders
    WHERE branch_id = ${branchId}
    ORDER BY created_at DESC, id DESC
    LIMIT 200
  `;
  return rows as unknown as OrderListRow[];
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

export async function getOrderWithItems(orderId: number, branchId: number) {
  const sql = getDb();
  const orderRows = await sql`
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
    WHERE id = ${orderId} AND branch_id = ${branchId}
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
      service_id as "serviceId"
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
