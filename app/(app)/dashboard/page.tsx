import { getSession } from "@/lib/auth/session";
import { listOrdersByBranch } from "@/lib/db/queries/orders";
import { listTargetVsActual } from "@/lib/db/queries/targets";

function formatIDR(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default async function DashboardPage() {
  const session = await getSession();
  const year = new Date().getFullYear();
  const orders = session ? await listOrdersByBranch(session.branchId) : [];
  const targetRows =
    session ? await listTargetVsActual(session.branchId, year) : [];

  const totalOmset = orders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const dpCount = orders.filter((o) => o.status === "DP_PAID").length;

  const totalTargetEkor = targetRows.reduce((s, r) => s + (r.targetEkor ?? 0), 0);
  const totalActualEkor = targetRows.reduce((s, r) => s + Number(r.actualEkor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Analytics</h2>
          <p className="text-slate-500 text-sm">
            Ringkasan performa (branch {session?.branchId})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Total Omset (header)</p>
          <p className="text-2xl font-bold text-green-700">{formatIDR(String(totalOmset))}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Total Pesanan</p>
          <p className="text-2xl font-bold text-blue-700">{orders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Target ekor {year}</p>
          <p className="text-2xl font-bold text-slate-800">{totalTargetEkor}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Aktual ekor (terverifikasi)</p>
          <p className="text-2xl font-bold text-indigo-700">{totalActualEkor}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">DP Paid</p>
          <p className="text-2xl font-bold text-purple-700">{dpCount}</p>
        </div>
      </div>

      {targetRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">Capaian vs target ({year})</h3>
            <p className="text-xs text-slate-500">Aktual = baris ANIMAL terbayar (DP/FULL), dari view DB.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-slate-100">
                  <th className="p-3">Species</th>
                  <th className="p-3">Produk</th>
                  <th className="p-3 text-right">Target ekor</th>
                  <th className="p-3 text-right">Aktual ekor</th>
                  <th className="p-3 text-right">Target omset</th>
                  <th className="p-3 text-right">Aktual omset</th>
                </tr>
              </thead>
              <tbody>
                {targetRows.map((r) => (
                  <tr key={r.salesTargetId} className="border-b border-slate-50">
                    <td className="p-3 font-medium">{r.species}</td>
                    <td className="p-3">{r.productCode}</td>
                    <td className="p-3 text-right">{r.targetEkor}</td>
                    <td className="p-3 text-right">{r.actualEkor}</td>
                    <td className="p-3 text-right">{formatIDR(r.targetOmset)}</td>
                    <td className="p-3 text-right">{formatIDR(r.actualOmset)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Pesanan Terbaru</h3>
          <p className="text-xs text-slate-500 mt-1">Data dari seed (idempotent).</p>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white text-[10px] uppercase text-slate-500 border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Invoice</th>
              <th className="px-5 py-3 font-semibold">Pelanggan</th>
              <th className="px-5 py-3 font-semibold">Tipe</th>
              <th className="px-5 py-3 font-semibold text-right">Total</th>
              <th className="px-5 py-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-bold text-[#1e3a5f] whitespace-nowrap">
                  {o.invoiceNumber}
                </td>
                <td className="px-5 py-3">
                  <div className="font-semibold text-slate-800">{o.customerName}</div>
                  <div className="text-[11px] text-slate-500">{o.customerPhone ?? "-"}</div>
                </td>
                <td className="px-5 py-3 text-slate-700 font-semibold">
                  {o.customerType ?? "B2C"}
                </td>
                <td className="px-5 py-3 text-right font-bold text-slate-800">
                  {formatIDR(o.grandTotal)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                  Belum ada data. Jalankan `npm run migrate` lalu `npm run seed`.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
