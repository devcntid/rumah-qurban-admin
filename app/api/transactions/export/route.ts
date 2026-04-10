import { NextResponse } from "next/server";
import { listAllTransactions } from "@/lib/db/queries/transactions";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await listAllTransactions({ status, type, search });

    const exportData = data.map((t) => ({
      "ID": t.id,
      "Tanggal": new Date(t.transactionDate).toLocaleDateString("id-ID"),
      "Waktu Catat": new Date(t.createdAt).toLocaleString("id-ID"),
      "Tipe": t.transactionType,
      "Invoice": t.invoiceNumber || "-",
      "VA": t.vaNumber || "-",
      "Metode": t.paymentMethodName || t.paymentMethodCode || "-",
      "Nominal": t.amount,
      "Status": t.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="ekspor_transaksi.xlsx"',
      },
    });
  } catch (err) {
    console.error("Export transactions error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
