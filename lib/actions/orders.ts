"use server";

import { getDb } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  updateOrderFormSchema,
  type UpdateOrderFormValues,
} from "@/lib/validations/order-edit";

const OrderItemSchema = z.object({
  itemType: z.string(),
  catalogOfferId: z.number().optional().nullable(),
  serviceId: z.number().optional().nullable(),
  itemName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  totalPrice: z.number(),
  coaCode: z.string().optional().nullable(),
  participants: z.array(
    z.object({
      name: z.string(),
      fatherName: z.string().optional().nullable(),
    })
  ).optional().default([]),
});

const CreateOrderSchema = z.object({
  branchId: z.number(),
  customerType: z.enum(["B2B", "B2C"]),
  customerName: z.string(),
  companyName: z.string().optional().nullable(),
  customerPhone: z.string(),
  customerEmail: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  subtotal: z.number(),
  discount: z.number().default(0),
  grandTotal: z.number(),
  dpPaid: z.number().default(0),
  remainingBalance: z.number(),
  status: z.string().default("PENDING"),
  items: z.array(OrderItemSchema),
});

export async function createOrderAction(data: z.infer<typeof CreateOrderSchema>) {
  const sql = getDb();
  
  // 1. Generate Invoice Number
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  const invoiceNumber = `INV-${date}-${Date.now().toString().slice(-4)}-${random}`;
  
  try {
    // 2. Insert Order
    // Using Neon SQL tagged template literal returns an array of rows
    const rows = await sql`
      INSERT INTO orders (
        invoice_number, 
        branch_id, 
        customer_type, 
        customer_name, 
        company_name, 
        customer_phone, 
        customer_email, 
        delivery_address, 
        latitude, 
        longitude, 
        subtotal, 
        discount, 
        grand_total, 
        dp_paid, 
        remaining_balance, 
        status
      ) VALUES (
        ${invoiceNumber}, 
        ${data.branchId}, 
        ${data.customerType}, 
        ${data.customerName}, 
        ${data.companyName}, 
        ${data.customerPhone}, 
        ${data.customerEmail}, 
        ${data.deliveryAddress}, 
        ${data.latitude}, 
        ${data.longitude}, 
        ${data.subtotal}, 
        ${data.discount}, 
        ${data.grandTotal}, 
        ${data.dpPaid}, 
        ${data.remainingBalance}, 
        ${data.status}
      )
      RETURNING id
    ` as any[];
    
    if (rows.length === 0) throw new Error("Gagal menyimpan header pesanan");
    const orderId = Number(rows[0].id);
    
    // 3. Insert Items and Participants
    for (const item of data.items) {
      const itemRows = await sql`
        INSERT INTO order_items (
          order_id, 
          item_type, 
          catalog_offer_id, 
          service_id, 
          item_name, 
          quantity, 
          unit_price, 
          total_price, 
          coa_code
        ) VALUES (
          ${orderId}, 
          ${item.itemType}, 
          ${item.catalogOfferId}, 
          ${item.serviceId}, 
          ${item.itemName}, 
          ${item.quantity}, 
          ${item.unitPrice}, 
          ${item.totalPrice}, 
          ${item.coaCode}
        )
        RETURNING id
      ` as any[];
      
      if (itemRows.length === 0) continue;
      const orderItemId = Number(itemRows[0].id);
      
      if (item.participants && item.participants.length > 0) {
        for (const p of item.participants) {
          if (!p.name) continue;
          await sql`
            INSERT INTO order_participants (
              order_item_id, 
              participant_name, 
              father_name
            ) VALUES (
              ${orderItemId}, 
              ${p.name}, 
              ${p.fatherName}
            )
          `;
        }
      }
    }
    
    // 4. Record Initial Transaction if DP/Full paid
    if (data.dpPaid > 0) {
      const txType = data.dpPaid >= data.grandTotal ? "FULL_PAYMENT" : "DOWN_PAYMENT";
      await sql`
        INSERT INTO transactions (
          order_id, 
          transaction_type, 
          amount, 
          status
        ) VALUES (
          ${orderId}, 
          ${txType}, 
          ${data.dpPaid}, 
          'SUCCESS'
        )
      `;
    }

    revalidatePath("/orders");
    revalidatePath("/pos");
    return { success: true, orderId, invoiceNumber };
  } catch (error) {
    console.error("Create Order Error:", error);
    return { success: false, message: "Gagal membuat pesanan di database" };
  }
}

export async function deleteOrderAction(id: number) {
  const { deleteOrder } = await import("@/lib/db/queries/orders");
  try {
    await deleteOrder(id);
    revalidatePath("/orders");
    return { success: true };
  } catch (error) {
    console.error("Delete Order Error:", error);
    return { success: false, error: "Gagal menghapus pesanan" };
  }
}

export async function updateOrderAction(
  input: UpdateOrderFormValues
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Sesi tidak valid." };
  }
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_CABANG") {
    return { success: false, error: "Anda tidak punya izin mengubah pesanan." };
  }

  const parsed = updateOrderFormSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: msg };
  }
  const d = parsed.data;

  const sql = getDb();
  const existing = (await sql`
    SELECT id, branch_id FROM orders WHERE id = ${d.orderId} LIMIT 1
  `) as { id: number; branch_id: number | null }[];
  if (existing.length === 0) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }

  const superAdmin = session.role === "SUPER_ADMIN";
  const row = existing[0];
  if (!superAdmin) {
    if (row.branch_id == null || row.branch_id !== session.branchId) {
      return { success: false, error: "Akses ditolak untuk pesanan ini." };
    }
  }

  const branchId = superAdmin ? d.branchId : session.branchId;
  const companyName =
    d.customerType === "B2B" ? (d.companyName?.trim() ? d.companyName.trim() : null) : null;

  const grandTotal = Math.max(0, d.subtotal - d.discount);
  const remainingBalance = Math.max(0, grandTotal - d.dpPaid);

  try {
    await sql`
      UPDATE orders SET
        branch_id = ${branchId},
        customer_type = ${d.customerType},
        customer_name = ${d.customerName.trim()},
        company_name = ${companyName},
        customer_phone = ${d.customerPhone?.trim() ? d.customerPhone.trim() : null},
        customer_email = ${d.customerEmail},
        delivery_address = ${d.deliveryAddress?.trim() ? d.deliveryAddress.trim() : null},
        latitude = ${d.latitude ?? null},
        longitude = ${d.longitude ?? null},
        subtotal = ${d.subtotal},
        discount = ${d.discount},
        grand_total = ${grandTotal},
        dp_paid = ${d.dpPaid},
        remaining_balance = ${remainingBalance},
        status = ${d.status}
      WHERE id = ${d.orderId}
    `;
    revalidatePath(`/orders/${d.orderId}`);
    revalidatePath("/orders");
    return { success: true };
  } catch (e) {
    console.error("updateOrderAction", e);
    return { success: false, error: "Gagal menyimpan perubahan pesanan." };
  }
}

const ViaPosItemSchema = z.object({
  orderItemId: z.number().int().positive().optional(),
  itemType: z.string(),
  catalogOfferId: z.number().optional().nullable(),
  serviceId: z.number().optional().nullable(),
  itemName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  totalPrice: z.number(),
  coaCode: z.string().optional().nullable(),
  participants: z
    .array(
      z.object({
        name: z.string(),
        fatherName: z.string().optional().nullable(),
      })
    )
    .default([]),
});

const UpdateViaPosSchema = z.object({
  orderId: z.number().int().positive(),
  customerType: z.enum(["B2B", "B2C"]),
  customerName: z.string().min(1),
  companyName: z.string().optional().nullable(),
  customerPhone: z.string().min(1),
  customerEmail: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  discount: z.number().nonnegative(),
  dpPaid: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  status: z.enum(["PENDING", "DP_PAID", "FULL_PAID", "CANCELLED"]),
  items: z.array(ViaPosItemSchema).min(1),
});

/** Server Actions / RSC kadang mengirim angka sebagai string — normalkan sebelum Zod. */
function normalizeUpdateViaPosInput(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const o = { ...(input as Record<string, unknown>) };

  const coerceTop = (key: string, nullIfEmpty = false) => {
    const v = o[key];
    if (v === null || v === undefined) return;
    if (v === "") {
      if (nullIfEmpty) o[key] = null;
      return;
    }
    if (typeof v === "number" && Number.isFinite(v)) return;
    const n = Number(v);
    if (Number.isFinite(n)) o[key] = n;
    else if (nullIfEmpty) o[key] = null;
  };

  coerceTop("orderId", false);
  coerceTop("discount", false);
  coerceTop("dpPaid", false);
  coerceTop("subtotal", false);
  coerceTop("latitude", true);
  coerceTop("longitude", true);

  if (Array.isArray(o.items)) {
    o.items = o.items.map((rawItem) => {
      if (!rawItem || typeof rawItem !== "object") return rawItem;
      const it = { ...(rawItem as Record<string, unknown>) };

      const vOid = it.orderItemId;
      if (vOid === "" || vOid === null || vOid === undefined) {
        delete it.orderItemId;
      } else {
        const n = Number(vOid);
        if (Number.isFinite(n) && n > 0) it.orderItemId = Math.trunc(n);
        else delete it.orderItemId;
      }

      for (const key of ["catalogOfferId", "serviceId"] as const) {
        const v = it[key];
        if (v === "" || v === null || v === undefined) {
          it[key] = null;
          continue;
        }
        if (typeof v === "number" && Number.isFinite(v)) continue;
        const n = Number(v);
        it[key] = Number.isFinite(n) ? Math.trunc(n) : null;
      }

      for (const key of ["quantity", "unitPrice", "totalPrice"] as const) {
        const v = it[key];
        if (v === null || v === undefined) continue;
        const n = Number(v);
        if (Number.isFinite(n)) it[key] = key === "quantity" ? Math.trunc(n) : n;
      }

      return it;
    });
  }

  return o;
}

export async function updateOrderViaPosAction(
  input: unknown
): Promise<{ success: true; orderId: number } | { success: false; error: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Sesi tidak valid." };
  }
  if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_CABANG") {
    return { success: false, error: "Anda tidak punya izin mengubah pesanan." };
  }

  const parsed = UpdateViaPosSchema.safeParse(normalizeUpdateViaPosInput(input));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { success: false, error: msg };
  }
  const d = parsed.data;

  const sql = getDb();
  const existing = (await sql`
    SELECT id, branch_id FROM orders WHERE id = ${d.orderId} LIMIT 1
  `) as { id: number; branch_id: number | null }[];
  if (existing.length === 0) {
    return { success: false, error: "Pesanan tidak ditemukan." };
  }

  const superAdmin = session.role === "SUPER_ADMIN";
  const row = existing[0];
  if (!superAdmin) {
    if (row.branch_id == null || row.branch_id !== session.branchId) {
      return { success: false, error: "Akses ditolak untuk pesanan ini." };
    }
  }

  const existingItems = (await sql`
    SELECT id FROM order_items WHERE order_id = ${d.orderId} ORDER BY id ASC
  `) as { id: string | number }[];
  const existingSortedIds = [...existingItems.map((r) => Number(r.id))].sort((a, b) => a - b);

  /** Jika id baris tidak ikut di payload (BigInt/serialisasi), samakan urutan dengan DB. */
  let workItems = d.items.map((it) => ({ ...it }));
  const anyMissingOrderItemId = workItems.some(
    (it) =>
      it.orderItemId == null ||
      typeof it.orderItemId !== "number" ||
      !Number.isFinite(it.orderItemId) ||
      it.orderItemId <= 0
  );
  if (anyMissingOrderItemId && existingSortedIds.length === workItems.length) {
    workItems = workItems.map((it, idx) => ({
      ...it,
      orderItemId: existingSortedIds[idx],
    }));
  }

  const existingIds = new Set(existingItems.map((r) => Number(r.id)));
  const cartDbIds = new Set(
    workItems.map((i) => i.orderItemId).filter((x): x is number => typeof x === "number" && x > 0)
  );

  for (const id of existingIds) {
    if (cartDbIds.has(id)) continue;
    const locked = await sql`
      SELECT 1 FROM farm_inventories WHERE order_item_id = ${id} LIMIT 1
    `;
    if ((locked as unknown[]).length > 0) {
      return {
        success: false,
        error:
          "Tidak bisa menghapus baris yang sudah terhubung ke inventori hewan. Kembalikan item tersebut ke keranjang.",
      };
    }
  }

  const grandTotal = Math.max(0, d.subtotal - d.discount);
  const remainingBalance = Math.max(0, grandTotal - d.dpPaid);
  const companyName =
    d.customerType === "B2B" ? (d.companyName?.trim() ? d.companyName.trim() : null) : null;
  const email =
    d.customerEmail && String(d.customerEmail).trim() !== ""
      ? String(d.customerEmail).trim()
      : null;
  const lat =
    typeof d.latitude === "number" && Number.isFinite(d.latitude) ? d.latitude : null;
  const lng =
    typeof d.longitude === "number" && Number.isFinite(d.longitude) ? d.longitude : null;

  const syncParticipants = async (
    orderItemId: number,
    participants: { name: string; fatherName?: string | null }[]
  ) => {
    await sql`DELETE FROM order_participants WHERE order_item_id = ${orderItemId}`;
    for (const p of participants) {
      const nm = p.name?.trim();
      if (!nm) continue;
      await sql`
        INSERT INTO order_participants (order_item_id, participant_name, father_name)
        VALUES (${orderItemId}, ${nm}, ${p.fatherName ?? null})
      `;
    }
  };

  try {
    await sql`
      UPDATE orders SET
        customer_type = ${d.customerType},
        customer_name = ${d.customerName.trim()},
        company_name = ${companyName},
        customer_phone = ${d.customerPhone.trim()},
        customer_email = ${email},
        delivery_address = ${d.deliveryAddress?.trim() ? d.deliveryAddress.trim() : null},
        latitude = ${lat},
        longitude = ${lng},
        subtotal = ${d.subtotal},
        discount = ${d.discount},
        grand_total = ${grandTotal},
        dp_paid = ${d.dpPaid},
        remaining_balance = ${remainingBalance},
        status = ${d.status}
      WHERE id = ${d.orderId}
    `;

    const savedIds: number[] = [];

    for (const item of workItems) {
      if (item.orderItemId) {
        const upd = await sql`
          UPDATE order_items SET
            item_type = ${item.itemType},
            catalog_offer_id = ${item.catalogOfferId},
            service_id = ${item.serviceId},
            item_name = ${item.itemName},
            quantity = ${item.quantity},
            unit_price = ${item.unitPrice},
            total_price = ${item.totalPrice},
            coa_code = ${item.coaCode}
          WHERE id = ${item.orderItemId} AND order_id = ${d.orderId}
          RETURNING id
        `;
        const rows = upd as { id: number }[];
        if (rows.length === 0) {
          return { success: false, error: "Salah satu baris pesanan tidak valid (bukan milik order ini)." };
        }
        const oid = Number(rows[0].id);
        savedIds.push(oid);
        await syncParticipants(oid, item.participants ?? []);
      } else {
        const ins = await sql`
          INSERT INTO order_items (
            order_id,
            item_type,
            catalog_offer_id,
            service_id,
            item_name,
            quantity,
            unit_price,
            total_price,
            coa_code
          ) VALUES (
            ${d.orderId},
            ${item.itemType},
            ${item.catalogOfferId},
            ${item.serviceId},
            ${item.itemName},
            ${item.quantity},
            ${item.unitPrice},
            ${item.totalPrice},
            ${item.coaCode}
          )
          RETURNING id
        `;
        const insRows = ins as { id: number }[];
        if (insRows.length === 0) continue;
        const oid = Number(insRows[0].id);
        savedIds.push(oid);
        await syncParticipants(oid, item.participants ?? []);
      }
    }

    for (const row of existingItems) {
      const id = Number(row.id);
      if (savedIds.includes(id)) continue;
      await sql`DELETE FROM order_items WHERE id = ${id} AND order_id = ${d.orderId}`;
    }

    revalidatePath(`/orders/${d.orderId}`);
    revalidatePath("/orders");
    revalidatePath("/pos");
    return { success: true, orderId: d.orderId };
  } catch (e) {
    console.error("updateOrderViaPosAction", e);
    return { success: false, error: "Gagal menyimpan perubahan pesanan (POS)." };
  }
}

