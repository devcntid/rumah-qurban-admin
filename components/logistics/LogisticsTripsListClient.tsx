"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck, Eye, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LogisticsTripSummaryRow } from "@/lib/db/queries/logistics";
import { deleteLogisticsTripAction } from "@/lib/actions/logistics";
import { tripStatusStyle } from "./logisticsShared";
import { FiltersBar, type FilterField } from "@/components/ui/FiltersBar";
import { Pagination } from "@/components/ui/Pagination";

type BranchOption = { id: number; name: string };

export default function LogisticsTripsListClient({
  trips,
  totalCount,
  page,
  pageSize,
  branches,
  isSuperAdmin,
}: {
  trips: LogisticsTripSummaryRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  branches: BranchOption[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const filterFields: FilterField[] = [
    { key: "q", label: "Cari", type: "text", placeholder: "Plat, supir, cabang…" },
    { key: "status", label: "Status trip", type: "text", placeholder: "contoh: PREPARING" },
    { key: "startDate", label: "Jadwal dari", type: "date" },
    { key: "endDate", label: "Jadwal sampai", type: "date" },
    ...(isSuperAdmin
      ? ([
          {
            key: "branchId",
            label: "Cabang",
            type: "select" as const,
            options: branches.map((b) => ({ label: b.name, value: String(b.id) })),
          },
        ] satisfies FilterField[])
      : []),
  ];

  const handleDelete = (trip: LogisticsTripSummaryRow) => {
    const n = trip.manifestCount;
    const warn =
      n > 0
        ? `Trip ini punya ${n} baris manifest. Menghapus trip akan ikut menghapus semua manifest. Lanjutkan?`
        : "Hapus jadwal trip ini?";
    if (!window.confirm(warn)) return;
    startTransition(async () => {
      const r = await deleteLogisticsTripAction(trip.id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success("Trip dihapus.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-blue-600" size={24} />
            Logistik & Pengiriman
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Kelola jadwal armada dan manifest per trip. Filter dan pagination berlaku untuk daftar trip.
          </p>
        </div>
        <Link
          href="/logistics/trips/new"
          className="inline-flex items-center gap-1.5 bg-[#102a43] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
        >
          <Plus size={14} /> Trip baru
        </Link>
      </div>

      <FiltersBar fields={filterFields} />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto min-h-[280px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200 font-black tracking-widest">
                <th className="px-6 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">Cabang</th>
                <th className="px-6 py-4">Plat</th>
                <th className="px-6 py-4">Supir</th>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Manifest</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {trips.map((t, index) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-center text-slate-600 font-mono">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800 text-sm">{t.branchName ?? "—"}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-[#102a43] font-black">{t.vehiclePlate}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{t.driverName}</td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{t.scheduledDate}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${tripStatusStyle(t.status)}`}
                    >
                      {t.status ?? "PREPARING"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-slate-600">{t.manifestCount}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-slate-300 group-hover:text-slate-400 transition-colors">
                      <Link
                        href={`/logistics/trips/${t.id}`}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-[#102a43] px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105"
                        title="Detail"
                      >
                        <Eye size={14} />
                      </Link>
                      <Link
                        href={`/logistics/trips/${t.id}/edit`}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-50"
                        title="Hapus"
                      >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-24 text-center text-slate-400 text-sm space-y-2">
                    <p className="font-semibold text-slate-500">Tidak ada trip yang cocok dengan filter.</p>
                    <p className="text-xs">
                      Ubah filter, tambah trip baru, atau jalankan{" "}
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
                        npm run seed
                      </code>
                      .
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <Pagination page={page} pageSize={pageSize} totalItems={totalCount} />
        </div>
      </div>
    </div>
  );
}
