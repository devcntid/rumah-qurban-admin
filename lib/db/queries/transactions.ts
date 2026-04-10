import { getDb } from "@/lib/db/client";

export type TransactionRow = {
  id: number;
  orderId: number | null;
  invoiceNumber?: string | null;
  paymentMethodCode: string | null;
  paymentMethodName?: string | null;
  paymentMethodCategory?: string | null;
  transactionType: string;
  amount: number;
  vaNumber: string | null;
  qrCodeUrl: string | null;
  status: string;
  transactionDate: Date;
  createdAt: Date;
};

export type PaymentLogRow = {
  id: number;
  transactionId: number;
  referenceId: string | null;
  logType: string | null;
  payload: any;
  response: any;
  createdAt: Date;
};

export type TransactionWithDetails = TransactionRow & {
  receipts: PaymentReceiptRow[];
  logs: PaymentLogRow[];
};

export type PaymentReceiptRow = {
  id: number;
  transactionId: number;
  fileUrl: string;
  status: string;
  verifierNotes: string | null;
  uploadedAt: Date;
  verifiedAt: Date | null;
};

export async function listTransactions(filters: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  search?: string;
}) {
  const sql = getDb();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const where = [];
  if (filters.status) where.push(sql`t.status = ${filters.status}`);
  if (filters.type) where.push(sql`t.transaction_type = ${filters.type}`);
  if (filters.search) {
    const search = `%${filters.search}%`;
    where.push(sql`(t.va_number ILIKE ${search} OR o.invoice_number ILIKE ${search})`);
  }

  const whereClause = where.length > 0 ? sql`WHERE ${where.reduce((a, b) => sql`${a} AND ${b}`)}` : sql``;

    const rows = await sql`
    SELECT 
      t.id,
      t.order_id as "orderId",
      o.invoice_number as "invoiceNumber",
      t.payment_method_code as "paymentMethodCode",
      pm.name as "paymentMethodName",
      pm.category as "paymentMethodCategory",
      t.transaction_type as "transactionType",
      t.amount,
      t.va_number as "vaNumber",
      t.qr_code_url as "qrCodeUrl",
      t.status,
      t.transaction_date as "transactionDate",
      t.created_at as "createdAt"
    FROM transactions t
    LEFT JOIN orders o ON t.order_id = o.id
    LEFT JOIN payment_methods pm ON t.payment_method_code = pm.code
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const countRes = await sql`
    SELECT COUNT(*) as total
    FROM transactions t
    LEFT JOIN orders o ON t.order_id = o.id
    ${whereClause}
  `;

  return {
    rows: rows as unknown as TransactionRow[],
    total: Number(countRes[0].total),
  };
}

export async function listAllTransactions(filters: {
  status?: string;
  type?: string;
  search?: string;
}) {
  const sql = getDb();
  const where = [];
  if (filters.status) where.push(sql`t.status = ${filters.status}`);
  if (filters.type) where.push(sql`t.transaction_type = ${filters.type}`);
  if (filters.search) {
    const search = `%${filters.search}%`;
    where.push(sql`(t.va_number ILIKE ${search} OR o.invoice_number ILIKE ${search})`);
  }

  const whereClause = where.length > 0 ? sql`WHERE ${where.reduce((a, b) => sql`${a} AND ${b}`)}` : sql``;

  const rows = await sql`
    SELECT 
      t.id,
      t.order_id as "orderId",
      o.invoice_number as "invoiceNumber",
      t.payment_method_code as "paymentMethodCode",
      pm.name as "paymentMethodName",
      pm.category as "paymentMethodCategory",
      t.transaction_type as "transactionType",
      t.amount,
      t.va_number as "vaNumber",
      t.status,
      t.transaction_date as "transactionDate",
      t.created_at as "createdAt"
    FROM transactions t
    LEFT JOIN orders o ON t.order_id = o.id
    LEFT JOIN payment_methods pm ON t.payment_method_code = pm.code
    ${whereClause}
    ORDER BY t.created_at DESC
  `;

  return rows as unknown as TransactionRow[];
}

export async function getTransactionById(id: number): Promise<TransactionWithDetails | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT 
      t.id,
      t.order_id as "orderId",
      o.invoice_number as "invoiceNumber",
      t.payment_method_code as "paymentMethodCode",
      pm.name as "paymentMethodName",
      pm.category as "paymentMethodCategory",
      t.transaction_type as "transactionType",
      t.amount,
      t.va_number as "vaNumber",
      t.qr_code_url as "qrCodeUrl",
      t.status,
      t.transaction_date as "transactionDate",
      t.created_at as "createdAt"
    FROM transactions t
    LEFT JOIN orders o ON t.order_id = o.id
    LEFT JOIN payment_methods pm ON t.payment_method_code = pm.code
    WHERE t.id = ${id}
  `;

  if (rows.length === 0) return null;

  const receipts = await sql`
    SELECT 
      id,
      transaction_id as "transactionId",
      file_url as "fileUrl",
      status,
      verifier_notes as "verifierNotes",
      uploaded_at as "uploadedAt",
      verified_at as "verifiedAt"
    FROM payment_receipts
    WHERE transaction_id = ${id}
    ORDER BY uploaded_at DESC
  `;

  const logs = await sql`
    SELECT 
      id,
      transaction_id as "transactionId",
      reference_id as "referenceId",
      log_type as "logType",
      payload,
      response,
      created_at as "createdAt"
    FROM payment_logs
    WHERE transaction_id = ${id}
    ORDER BY created_at DESC
  `;

  return {
    ...(rows[0] as unknown as TransactionRow),
    receipts: receipts as unknown as PaymentReceiptRow[],
    logs: logs as unknown as PaymentLogRow[],
  };
}

export async function upsertTransaction(input: Partial<TransactionRow>) {
  const sql = getDb();
  if (input.id) {
    await sql`
      UPDATE transactions
      SET 
        order_id = ${input.orderId ?? null},
        payment_method_code = ${input.paymentMethodCode ?? null},
        transaction_type = ${input.transactionType ?? "PELUNASAN"},
        amount = ${input.amount ?? 0},
        va_number = ${input.vaNumber ?? null},
        status = ${input.status ?? "PENDING"},
        transaction_date = ${input.transactionDate ?? new Date()}
      WHERE id = ${input.id}
    `;
    return input.id;
  }
  
  const res = await sql`
    INSERT INTO transactions (order_id, payment_method_code, transaction_type, amount, va_number, status, transaction_date)
    VALUES (
      ${input.orderId ?? null},
      ${input.paymentMethodCode ?? null},
      ${input.transactionType ?? "PELUNASAN"},
      ${input.amount ?? 0},
      ${input.vaNumber ?? null},
      ${input.status ?? "PENDING"},
      ${input.transactionDate ?? new Date()}
    )
    RETURNING id
  `;
  return res[0].id as number;
}

export async function deleteTransaction(id: number) {
  const sql = getDb();
  await sql`DELETE FROM transactions WHERE id = ${id}`;
}

export async function matchTransactionToOrder(transactionId: number, orderId: number) {
  const sql = getDb();
  await sql`
    UPDATE transactions
    SET order_id = ${orderId}
    WHERE id = ${transactionId}
  `;
}

export async function unmatchTransaction(transactionId: number) {
  const sql = getDb();
  await sql`
    UPDATE transactions
    SET order_id = NULL
    WHERE id = ${transactionId}
  `;
}

export async function verifyReceipt(receiptId: number, status: string, notes: string | null) {
  const sql = getDb();
  await sql.begin(async (sql) => {
    // Update receipt status
    await sql`
      UPDATE payment_receipts
      SET 
        status = ${status},
        verifier_notes = ${notes},
        verified_at = CURRENT_TIMESTAMP
      WHERE id = ${receiptId}
    `;

    // If approved, optionally update transaction status
    if (status === "APPROVED") {
      const res = await sql`
        SELECT transaction_id FROM payment_receipts WHERE id = ${receiptId}
      `;
      if (res.length > 0) {
        await sql`
          UPDATE transactions
          SET status = 'PAID'
          WHERE id = ${res[0].transaction_id}
        `;
      }
    }
  });
}

export async function listStandaloneTransactions() {
  const sql = getDb();
  const rows = await sql`
    SELECT 
      t.id,
      t.payment_method_code as "paymentMethodCode",
      pm.name as "paymentMethodName",
      pm.category as "paymentMethodCategory",
      t.transaction_type as "transactionType",
      t.amount,
      t.va_number as "vaNumber",
      t.status,
      t.transaction_date as "transactionDate",
      t.created_at as "createdAt"
    FROM transactions t
    LEFT JOIN payment_methods pm ON t.payment_method_code = pm.code
    WHERE t.order_id IS NULL
    ORDER BY t.created_at DESC
    LIMIT 50
  `;
  return rows as unknown as TransactionRow[];
}
