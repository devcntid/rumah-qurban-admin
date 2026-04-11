"use client";

import { useTransition } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  Eye, 
  Receipt, 
  Search, 
  Download, 
  Plus,
  Package,
  Trash2,
  Loader2
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { FiltersBar } from "@/components/ui/FiltersBar";
import * as XLSX from "xlsx";
import { OrderListRow } from "@/lib/db/queries/orders";
import { deleteOrderAction } from "@/lib/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function formatIDR(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  DP_PAID: "bg-blue-100 text-blue-700 border-blue-200",
  FULL_PAID: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export default function OrdersClient({
  initialData,
  totalCount,
  branches,
  page,
  pageSize,
}: {
  initialData: OrderListRow[];
  totalCount: number;
  branches: { id: number; name: string }[];
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: number, invoice: string) => {
    if (!window.confirm(`Hapus pesanan ${invoice}? Tindakan ini tidak dapat dibatalkan.`)) return;
    
    startTransition(async () => {
      const res = await deleteOrderAction(id);
      if (res.success) {
        toast.success(`Pesanan ${invoice} berhasil dihapus`);
      } else {
        toast.error(res.error || "Gagal menghapus pesanan");
      }
    });
  };

  const handleExport = () => {
    const data = initialData.map((o, index) => ({
      "NO": (page - 1) * pageSize + index + 1,
      "TANGGAL": new Date(o.createdAt).toLocaleString("id-ID"),
      "INVOICE": o.invoiceNumber,
      "PELANGGAN": o.customerName,
      "TIPE": o.customerType || "B2C",
      "TELEPON": o.customerPhone || "-",
      "TOTAL": Number(o.grandTotal),
      "DP": Number(o.dpPaid),
      "SISA": Number(o.remainingBalance),
      "STATUS": o.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filterFields: any[] = [
    { key: "q", label: "Cari Invoice/Nama/HP", type: "text", placeholder: "Cari..." },
    { key: "startDate", label: "Dari Tanggal", type: "date" },
    { key: "endDate", label: "Hingga Tanggal", type: "date" },
    { 
      key: "branchId", 
      label: "Cabang", 
      type: "select", 
      options: [
        { label: "SEMUA CABANG", value: "" },
        ...branches.map(b => ({ label: b.name, value: String(b.id) }))
      ]
    },
    { 
      key: "status", 
      label: "Status Bayar", 
      type: "select", 
      options: [
        { label: "SEMUA STATUS", value: "" },
        { label: "PENDING", value: "PENDING" },
        { label: "DP PAID", value: "DP_PAID" },
        { label: "FULL PAID", value: "FULL_PAID" },
        { label: "CANCELLED", value: "CANCELLED" }
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#102a43] tracking-tight flex items-center gap-2">
            <Package className="text-blue-600" size={24} />
            Manajemen Pesanan
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Daftar seluruh transaksi masuk dari POS dan Online.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
          >
            <Download size={14} /> Export Excel
          </button>
          <Link 
            href="/pos"
            className="flex items-center gap-1.5 bg-[#102a43] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
          >
            <Plus size={14} /> Tambah Pesanan
          </Link>
        </div>
      </div>

      <FiltersBar fields={filterFields} />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200 font-black tracking-widest">
                <th className="px-6 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">No. Invoice</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Metrik Finansial</th>
                <th className="px-6 py-4 text-center">Status Bayar</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 relative">
              {initialData.map((o, index) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-center text-slate-400 font-mono">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-[#102a43] text-sm">{o.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{o.customerName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${o.customerType === 'B2B' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {o.customerType ?? "B2C"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium font-mono">{o.customerPhone ?? "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                        <span className="font-black text-[#102a43]">{formatIDR(o.grandTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[9px] font-black text-slate-400 uppercase">DP</span>
                        <span className="text-[10px] font-bold text-green-600">{formatIDR(o.dpPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Sisa</span>
                        <span className="text-[10px] font-bold text-red-500">{formatIDR(o.remainingBalance)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[o.status] || "bg-slate-100 text-slate-600"}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-slate-300 group-hover:text-slate-400 transition-colors">
                      <a
                        href={`/api/orders/${o.id}/invoice`}
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-200 hover:border-slate-300 transition-all hover:text-blue-600"
                        title="Cetak Invoice"
                      >
                        <Receipt size={14} />
                      </a>
                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-[#102a43] px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105"
                        title="Detail Pesanan"
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(o.id, o.invoiceNumber)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all hover:scale-105 disabled:opacity-50"
                        title="Hapus Pesanan"
                      >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center opacity-30">
                    <ShoppingCart size={64} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-black text-xl text-slate-400">Belum ada pesanan ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t bg-slate-50/50">
          <Pagination page={page} pageSize={pageSize} totalItems={totalCount} />
        </div>
      </div>
    </div>
  );
}
