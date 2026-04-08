import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listOrdersByBranch } from "@/lib/db/queries/orders";

function formatIDR(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default async function OrdersPage() {
  const session = await getSession();
  const orders = session ? await listOrdersByBranch(session.branchId) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Pesanan</h2>
          <p className="text-slate-500 text-sm">
            Tabel transaksi masuk (sementara: read-only dari seed).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <th className="p-4 font-semibold">No. Invoice</th>
              <th className="p-4 font-semibold">Pelanggan</th>
              <th className="p-4 font-semibold">Tipe</th>
              <th className="p-4 font-semibold">Total</th>
              <th className="p-4 font-semibold">DP & Sisa</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-bold text-[#1e3a5f] whitespace-nowrap">{o.invoiceNumber}</td>
                <td className="p-4">
                  <div className="font-semibold text-slate-800">{o.customerName}</div>
                  <div className="text-xs text-slate-500">{o.customerPhone ?? "-"}</div>
                </td>
                <td className="p-4">
                  <div className="text-slate-800 font-semibold">{o.customerType ?? "B2C"}</div>
                </td>
                <td className="p-4 font-bold text-slate-800">{formatIDR(o.grandTotal)}</td>
                <td className="p-4">
                  <p className="text-xs text-green-700 font-semibold">DP: {formatIDR(o.dpPaid)}</p>
                  <p className="text-[10px] text-red-500">Sisa: {formatIDR(o.remainingBalance)}</p>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {o.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <Link
                    href={`/orders/${o.id}`}
                    className="text-slate-600 hover:text-white hover:bg-[#1e3a5f] transition-colors bg-white border border-slate-200 rounded text-xs font-bold px-3 py-1.5 inline-block"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Tidak ada data untuk branch ini. Jalankan `npm run migrate` lalu `npm run seed`.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
