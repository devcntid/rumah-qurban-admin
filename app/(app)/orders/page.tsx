import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listOrdersByBranch } from "@/lib/db/queries/orders";
import { ShoppingCart, Eye, Filter, Download, Plus } from "lucide-react";

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

export default async function OrdersPage() {
  const session = await getSession();
  const branchId = session?.branchId ?? 1;
  const orders = await listOrdersByBranch(branchId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Pesanan</h2>
          <p className="text-slate-500 text-sm">
            Daftar seluruh transaksi masuk dari POS dan Online.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-green-700 transition-all">
            <Download size={16} /> Export Excel
          </button>
          <Link 
            href="/pos"
            className="flex items-center gap-2 bg-[#102a43] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-800 transition-all"
          >
            <Plus size={16} /> Tambah Pesanan
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <th className="p-5 font-bold tracking-wider">No. Invoice</th>
                <th className="p-5 font-bold tracking-wider">Pelanggan</th>
                <th className="p-5 font-bold tracking-wider">Metrik Finansial</th>
                <th className="p-5 font-bold tracking-wider text-center">Status Bayar</th>
                <th className="p-5 font-bold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5">
                    <div className="font-black text-[#102a43] text-base">{o.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{o.customerName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${o.customerType === 'B2B' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {o.customerType ?? "B2C"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{o.customerPhone ?? "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                        <span className="font-black text-slate-800">{formatIDR(o.grandTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">DP</span>
                        <span className="text-xs font-bold text-green-600">{formatIDR(o.dpPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sisa</span>
                        <span className="text-xs font-bold text-red-500">{formatIDR(o.remainingBalance)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[o.status] || "bg-slate-100 text-slate-600"}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 text-[#102a43] px-3 py-1.5 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      <Eye size={14} /> Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <ShoppingCart size={60}/>
                       <p className="text-lg font-bold">Belum ada pesanan ditemukan.</p>
                       <p className="text-sm">Silakan buat pesanan baru melalui menu POS.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
