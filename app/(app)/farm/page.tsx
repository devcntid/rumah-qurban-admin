import { getSession } from "@/lib/auth/session";
import { listStockByBranchVariant } from "@/lib/db/queries/farm";

export default async function FarmPage() {
  const session = await getSession();
  const stock =
    session?.branchId != null ? await listStockByBranchVariant(session.branchId) : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Kandang & Inventaris</h2>
        <p className="text-slate-500 text-sm">
          Ringkasan stok fisik per varian (view `stock_by_branch_variant`), cabang{" "}
          {session?.branchId ?? "-"}.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 font-bold text-slate-800 text-sm">
          Stok per varian & status
        </div>
        {stock.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            Tidak ada data inventaris untuk cabang ini. Jalankan `npm run seed` setelah migrate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="p-3">Species</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Berat</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ekor</th>
                  <th className="p-3 text-right">Terikat</th>
                  <th className="p-3 text-right">Available bebas</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s, i) => (
                  <tr key={`${s.animalVariantId}-${s.status}-${i}`} className="border-b border-slate-50">
                    <td className="p-3">{s.species ?? "-"}</td>
                    <td className="p-3">{s.classGrade ?? "-"}</td>
                    <td className="p-3 text-slate-600">{s.weightRange ?? "-"}</td>
                    <td className="p-3 font-mono text-xs">{s.status ?? "-"}</td>
                    <td className="p-3 text-right">{s.headCount}</td>
                    <td className="p-3 text-right">{s.assignedCount}</td>
                    <td className="p-3 text-right font-semibold text-green-700">
                      {s.availableUnassignedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
