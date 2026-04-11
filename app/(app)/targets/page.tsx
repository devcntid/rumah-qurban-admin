import { getSession } from "@/lib/auth/session";
import { asNumber, asString } from "@/lib/db/filters";
import { getPageParams } from "@/lib/db/pagination";
import { listSalesTargets, listTargetVsActual, countSalesTargets } from "@/lib/db/queries/targets";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { Pagination } from "@/components/ui/Pagination";
import { TargetsCrud } from "@/app/(app)/targets/TargetsCrud";

function formatIDR(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default async function TargetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const { page, pageSize, offset, limit } = getPageParams(sp);
  const year = asNumber(sp.year);
  const species = asString(sp.species, 50);
  const category = asString(sp.category, 20);

  const targetYear = year ? Math.trunc(year) : new Date().getFullYear();

  const filters = {
    branchId: session?.branchId,
    year: year ? Math.trunc(year) : undefined,
    species: species || undefined,
    category: category || undefined,
  };

  const [rows, totalCount, achievement] = await Promise.all([
    listSalesTargets({ ...filters, limit, offset }),
    countSalesTargets(filters),
    session?.branchId != null ? listTargetVsActual(session.branchId, targetYear) : [],
  ]);

  const totalEkor = rows.reduce((s, r) => s + (r.targetEkor ?? 0), 0);
  const totalOmset = rows.reduce((s, r) => s + Number(r.targetOmset || 0), 0);
  const totalHpp = rows.reduce((s, r) => s + Number(r.targetHpp || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Target & Performa</h2>
          <p className="text-slate-500 text-sm">
            Data real dari DB (tenant branch {session?.branchId})
          </p>
        </div>
      </div>

      {achievement.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-bold text-slate-800">Capaian vs target ({targetYear})</h3>
            <p className="text-xs text-slate-500 mt-1">
              Aktual dari pesanan DP_PAID/FULL_PAID, baris ANIMAL + katalog (view DB).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="p-3">Species</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Target ekor</th>
                  <th className="p-3 text-right">Aktual ekor</th>
                  <th className="p-3 text-right">Target omset</th>
                  <th className="p-3 text-right">Aktual omset</th>
                </tr>
              </thead>
              <tbody>
                {achievement.map((a) => (
                  <tr key={a.salesTargetId} className="border-b border-slate-100">
                    <td className="p-3 font-medium">{a.species}</td>
                    <td className="p-3">{a.productCode}</td>
                    <td className="p-3 text-right">{a.targetEkor}</td>
                    <td className="p-3 text-right">{a.actualEkor}</td>
                    <td className="p-3 text-right">{formatIDR(a.targetOmset)}</td>
                    <td className="p-3 text-right">{formatIDR(a.actualOmset)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FiltersBar
        fields={[
          { key: "year", label: "Tahun", type: "number", placeholder: "2026" },
          {
            key: "species",
            label: "Species",
            type: "select",
            options: [
              { label: "DOMBA", value: "DOMBA" },
              { label: "SAPI", value: "SAPI" },
              { label: "KAMBING", value: "KAMBING" },
            ],
          },
          {
            key: "category",
            label: "Kategori",
            type: "select",
            options: [
              { label: "QA", value: "QA" },
              { label: "QB", value: "QB" },
              { label: "QK", value: "QK" },
            ],
          },
        ]}
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1e3a5f] p-5 rounded-xl shadow-sm text-white">
          <p className="text-xs font-semibold text-blue-200 mb-1 uppercase tracking-wider">
            Target Sales (Ekor)
          </p>
          <p className="text-3xl font-bold">{totalEkor}</p>
        </div>
        <div className="bg-green-700 p-5 rounded-xl shadow-sm text-white">
          <p className="text-xs font-semibold text-green-200 mb-1 uppercase tracking-wider">
            Target Omset
          </p>
          <p className="text-3xl font-bold">{formatIDR(String(totalOmset))}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Estimasi HPP
          </p>
          <p className="text-3xl font-bold text-slate-800">
            {formatIDR(String(totalHpp))}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <TargetsCrud rows={rows} />
        <div className="px-4 pb-4">
          <Pagination page={page} pageSize={pageSize} totalItems={totalCount} />
        </div>
      </div>
    </div>
  );
}

