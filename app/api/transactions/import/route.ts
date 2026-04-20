import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { upsertTransaction } from "@/lib/db/queries/transactions";
import { flushRedisCache } from "@/lib/cache/redis";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    const results = [];
    for (const row of jsonData) {
      try {
        let txDate = new Date();
        const rawDate = row["Tanggal"];
        if (rawDate) {
          // Handle Excel serial date or ISO string
          txDate = typeof rawDate === 'number' 
            ? new Date(Math.round((rawDate - 25569) * 86400 * 1000))
            : new Date(rawDate);
          
          if (isNaN(txDate.getTime())) txDate = new Date();
        }

        const id = await upsertTransaction({
          orderId: row["Order ID (Opsional)"] && !isNaN(Number(row["Order ID (Opsional)"])) ? Number(row["Order ID (Opsional)"]) : null,
          paymentMethodCode: row["Metode Pembayaran"] || "TF_MANDIRI",
          transactionType: row["Tipe Transaksi"] || "PELUNASAN",
          amount: Number(row["Nominal"] || 0),
          vaNumber: row["Bank / Rekening"]?.toString() || null,
          status: row["Status"] || "PAID",
          transactionDate: txDate,
        });
        results.push({ id, status: "success" });
      } catch (err) {
        results.push({ row, status: "error", error: String(err) });
      }
    }

    await flushRedisCache();
    return NextResponse.json({ success: true, count: results.filter(r => r.status === 'success').length, details: results });
  } catch (err) {
    console.error("Import transactions error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
