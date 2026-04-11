"use server";

import { getDb } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  } catch (error) {
    console.error("Create Order Error:", error);
    return { success: false, message: "Gagal membuat pesanan di database" };
  }
  
  revalidatePath("/orders");
  revalidatePath("/pos");
  return { success: true, orderId: orderId, invoiceNumber: invoiceNumber };
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

