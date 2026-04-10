import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const template = [
    {
      "Order ID (Opsional)": "[ID Pesanan]",
      "Tanggal": "2026-05-20",
      "Metode Pembayaran": "TF_MANDIRI",
      "Tipe Transaksi": "PELUNASAN",
      "Nominal": 2500000,
      "Bank / Rekening": "Mandiri - 1234567890",
      "Status": "PAID"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Transaksi");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template_transaksi.xlsx"',
    },
  });
}
