"use server";

import { getDb } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import { flushRedisCache } from "@/lib/cache/redis";
import * as XLSX from "xlsx";
import { 
  getBranchLookupMap, 
  getSalesAgentLookupMap, 
  getCatalogOfferLookupMap,
  getPaymentMethodLookupMap 
} from "@/lib/db/queries/order-upload";
import { getOrCreateCustomer } from "@/lib/db/queries/customers";

type ExcelRow = {
  Invoice?: string;
  Cabang: string;
  Sales: string;
  "Nama Customer": string;
  Telepon?: string;
  Email?: string;
  "Alamat Pengiriman"?: string;
  Produk: string;
  Jumlah: number;
  "Harga Satuan": number;
  Diskon?: number;
  Total: number;
  "DP Dibayar"?: number;
  "Status Bayar": string;
  "Tanggal Order": string;
  "Metode Pembayaran"?: string;
};

type ValidationResult = {
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  data?: any;
};

export async function uploadOrdersAction(fileBuffer: ArrayBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  // Build lookup maps
  const [branchMap, salesMap, productMap, paymentMap] = await Promise.all([
    getBranchLookupMap(),
    getSalesAgentLookupMap(),
    getCatalogOfferLookupMap(),
    getPaymentMethodLookupMap(),
  ]);

  // Validate all rows
  const validationResults: ValidationResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors: string[] = [];
    
    // Validate Cabang
    const branchKey = row.Cabang?.toLowerCase().trim();
    const branchId = branchKey ? branchMap.get(branchKey) : undefined;
    if (!branchId) {
      const suggestions = Array.from(branchMap.keys()).slice(0, 3);
      errors.push(`Cabang "${row.Cabang}" tidak ditemukan. Pilihan: ${suggestions.join(", ")}`);
    }
    
    // Validate Sales
    const salesKey = row.Sales?.toLowerCase().trim();
    const salesId = salesKey ? salesMap.get(salesKey) : undefined;
    if (!salesId) {
      const suggestions = Array.from(salesMap.keys()).slice(0, 3);
      errors.push(`Sales "${row.Sales}" tidak ditemukan. Pilihan: ${suggestions.join(", ")}`);
    }
    
    // Validate Produk
    const productKey = row.Produk?.toLowerCase().trim();
    const catalogOfferId = productKey ? productMap.get(productKey) : undefined;
    if (!catalogOfferId) {
      errors.push(`Produk "${row.Produk}" tidak ditemukan.`);
    }
    
    // Validate required fields
    if (!row["Nama Customer"]) errors.push("Nama Customer wajib diisi");
    if (!row["Harga Satuan"] || row["Harga Satuan"] <= 0) errors.push("Harga Satuan harus > 0");
    if (!row.Total || row.Total <= 0) errors.push("Total harus > 0");
    
    validationResults.push({
      rowIndex: i + 2, // +2 karena Excel mulai dari row 1, dan row 1 adalah header
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? {
        invoice: row.Invoice || `AUTO-${Date.now()}-${i}`,
        branchId,
        salesId,
        catalogOfferId,
        customerName: row["Nama Customer"],
        customerPhone: row.Telepon,
        customerEmail: row.Email,
        deliveryAddress: row["Alamat Pengiriman"],
        productName: row.Produk,
        quantity: row.Jumlah || 1,
        unitPrice: row["Harga Satuan"],
        discount: row.Diskon || 0,
        total: row.Total,
        dpPaid: row["DP Dibayar"] || 0,
        statusBayar: row["Status Bayar"],
        orderDate: row["Tanggal Order"],
        paymentMethodCode: row["Metode Pembayaran"] 
          ? paymentMap.get(row["Metode Pembayaran"].toLowerCase().trim())
          : null,
      } : undefined,
    });
  }

  const validRows = validationResults.filter(r => r.isValid);
  const invalidRows = validationResults.filter(r => !r.isValid);

  // Return validation preview if there are errors
  if (invalidRows.length > 0) {
    return {
      success: false,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      errors: invalidRows.map(r => ({
        row: r.rowIndex,
        errors: r.errors,
      })),
    };
  }

  // Process insert (all valid)
  const sql = getDb();
  const inserted: string[] = [];
  
  for (const result of validRows) {
    const d = result.data!;
    
    try {
      // Generate invoice if needed
      const invoiceNumber = d.invoice.startsWith("AUTO-") 
        ? `INV-${new Date(d.orderDate).toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`
        : d.invoice;
      
      const subtotal = d.unitPrice * d.quantity;
      const grandTotal = Math.max(0, subtotal - d.discount);
      const remainingBalance = Math.max(0, grandTotal - d.dpPaid);
      
      let status = "PENDING";
      if (d.statusBayar.toLowerCase().includes("lunas") || d.dpPaid >= grandTotal) {
        status = "FULL_PAID";
      } else if (d.dpPaid > 0) {
        status = "DP_PAID";
      }
      
      // Insert Order
      const orderRows = await sql`
        INSERT INTO orders (
          invoice_number, branch_id, sales_agent_id, customer_type, 
          customer_name, customer_phone, customer_email, delivery_address,
          subtotal, discount, grand_total, dp_paid, remaining_balance, 
          status, created_at
        ) VALUES (
          ${invoiceNumber}, ${d.branchId}, ${d.salesId}, 'B2C',
          ${d.customerName}, ${d.customerPhone}, ${d.customerEmail}, ${d.deliveryAddress},
          ${subtotal}, ${d.discount}, ${grandTotal}, ${d.dpPaid}, ${remainingBalance},
          ${status}, ${d.orderDate}::timestamp
        )
        RETURNING id
      ` as any[];
      
      const orderId = Number(orderRows[0].id);
      
      // Insert Order Item
      await sql`
        INSERT INTO order_items (
          order_id, item_type, catalog_offer_id, item_name,
          quantity, unit_price, total_price
        ) VALUES (
          ${orderId}, 'PRODUCT', ${d.catalogOfferId}, ${d.productName},
          ${d.quantity}, ${d.unitPrice}, ${d.total}
        )
      `;
      
      // Auto-create transaction if paid
      if (status === "FULL_PAID" || status === "DP_PAID") {
        const txType = status === "FULL_PAID" ? "PELUNASAN" : "DOWN_PAYMENT";
        await sql`
          INSERT INTO transactions (
            order_id, payment_method_code, transaction_type, 
            amount, status, transaction_date
          ) VALUES (
            ${orderId}, ${d.paymentMethodCode}, ${txType},
            ${d.dpPaid}, 'SUCCESS', ${d.orderDate}::timestamp
          )
        `;
      }
      
      // Create/update customer
      if (d.customerPhone) {
        try {
          const customerId = await getOrCreateCustomer({
            name: d.customerName,
            phone: d.customerPhone,
            email: d.customerEmail,
            customerType: 'B2C',
            companyName: null,
            orderTotal: grandTotal,
            orderDate: d.orderDate,
          });
          
          await sql`UPDATE orders SET customer_id = ${customerId} WHERE id = ${orderId}`;
        } catch (error) {
          console.error(`Error creating customer for row ${result.rowIndex}:`, error);
        }
      }
      
      inserted.push(invoiceNumber);
    } catch (error) {
      console.error(`Error inserting row ${result.rowIndex}:`, error);
    }
  }

  await flushRedisCache();
  revalidatePath("/orders");
  
  return {
    success: true,
    insertedCount: inserted.length,
    invoices: inserted,
  };
}

export async function generateTemplateAction() {
  const [branches, sales, products, paymentMethods] = await Promise.all([
    getDb()`SELECT name FROM branches WHERE is_active = TRUE ORDER BY name`,
    getDb()`SELECT name FROM sales_agents ORDER BY name`,
    getDb()`SELECT display_name FROM catalog_offers WHERE is_active = TRUE ORDER BY display_name`,
    getDb()`SELECT name FROM payment_methods WHERE is_active = TRUE ORDER BY name`,
  ]);

  const exampleData = [
    {
      Invoice: "RQD/2024/001",
      Cabang: (branches as any[])[0]?.name || "Rumah Qurban Depok",
      Sales: (sales as any[])[0]?.name || "Zainudin",
      "Nama Customer": "Budi Santoso",
      Telepon: "081234567890",
      Email: "budi@email.com",
      "Alamat Pengiriman": "Jl. Margonda Raya No. 100",
      Produk: (products as any[])[0]?.display_name || "Sapi Kurban Kelas A",
      Jumlah: 1,
      "Harga Satuan": 18500000,
      Diskon: 0,
      Total: 18500000,
      "DP Dibayar": 18500000,
      "Status Bayar": "Lunas",
      "Tanggal Order": new Date().toISOString().slice(0, 10),
      "Metode Pembayaran": (paymentMethods as any[])[0]?.name || "Bank Mandiri",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(exampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
