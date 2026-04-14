"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Package, Pencil, Plus, Trash2, User, Eye, ListChecks } from "lucide-react";
import { toast } from "sonner";
import type { DeliveryManifestRow, EligibleFarmAnimalRow, LogisticsTripRow } from "@/lib/db/queries/logistics";
import { markManifestDeliveredAction, deleteDeliveryManifestAction } from "@/lib/actions/logistics";
import { FiltersBar, type FilterField } from "@/components/ui/FiltersBar";
import { Pagination } from "@/components/ui/Pagination";
import { manifestStatusStyle, tripStatusStyle } from "./logisticsShared";
import AddManifestModal from "./AddManifestModal";
import { BulkTrackingModal } from "./BulkTrackingModal";

export default function TripDetailClient({
  trip,
  manifests,
  manifestTotal,
  manifestHasFilters,
  page,
  pageSize,
  eligibleAnimals,
}: {
  trip: LogisticsTripRow;
  manifests: DeliveryManifestRow[];
  manifestTotal: number;
  manifestHasFilters: boolean;
  page: number;
  pageSize: number;
  eligibleAnimals: EligibleFarmAnimalRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [bulkTrackingOpen, setBulkTrackingOpen] = useState(false);

  const forTrip =
    trip.branchId == null ? [] : eligibleAnimals.filter((a) => a.branchId === trip.branchId);

  const manifestFilterFields: FilterField[] = [
    { key: "mq", label: "Cari manifest", type: "text", placeholder: "Eartag, invoice, pelanggan…" },
    {
      key: "mstatus",
      label: "Status pengiriman",
      type: "select",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Dalam perjalanan", value: "IN_TRANSIT" },
        { label: "Terkirim", value: "DELIVERED" },
        { label: "Dibatalkan", value: "CANCELLED" },
      ],
    },
  ];

  const handleMarkDelivered = (m: DeliveryManifestRow) => {
    startTransition(async () => {
      const r = await markManifestDeliveredAction(m.id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success("Status manifest diperbarui (tiba di lokasi).");
      router.refresh();
    });
  };

  const handleDeleteManifest = (m: DeliveryManifestRow) => {
    if (!window.confirm(`Hapus manifest untuk ${m.eartagId ?? "baris ini"}?`)) return;
    startTransition(async () => {
      const r = await deleteDeliveryManifestAction(m.id);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success("Manifest dihapus.");
      router.refresh();
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AddManifestModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        tripId={trip.id}
        eligibleAnimals={forTrip}
        onAdded={() => router.refresh()}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            <Link href="/logistics" className="hover:text-slate-600">
              Logistik
            </Link>{" "}
            / Trip #{trip.id}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[#102a43]">{trip.vehiclePlate}</span>
            <span
              className={`text-[10px] font-black uppercase tracking-wide rounded-lg border px-2.5 py-1 ${tripStatusStyle(trip.status)}`}
            >
              {trip.status ?? "PREPARING"}
            </span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {trip.driverName} · Jadwal {trip.scheduledDate} · Cabang {trip.branchName ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {manifests.length > 0 && (
            <button
              type="button"
              onClick={() => setBulkTrackingOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
            >
              <ListChecks size={14} /> Bulk Tracking
            </button>
          )}
          <Link
            href={`/logistics/trips/${trip.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Pencil size={14} /> Ubah trip
          </Link>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#102a43] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            <Plus size={14} /> Tambah manifest
          </button>
        </div>
      </div>

      {forTrip.length > 0 && (
        <p className="text-xs text-slate-500">
          Ada {forTrip.length} hewan siap ditambahkan ke manifest trip ini (belum ada manifest aktif lain).
        </p>
      )}

      <FiltersBar fields={manifestFilterFields} />

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Manifest pengiriman</h3>
        </div>
        {manifestTotal === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            {manifestHasFilters ? (
              <p>Tidak ada manifest yang cocok dengan filter. Ubah kata kunci atau status.</p>
            ) : (
              <>
                Belum ada manifest.{" "}
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Tambah hewan
                </button>
                .
              </>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] uppercase text-slate-500 border-b border-slate-100 font-black tracking-widest">
                    <th className="px-6 py-3 w-12 text-center">No</th>
                    <th className="px-6 py-3">Hewan</th>
                    <th className="px-6 py-3">Invoice / Pelanggan</th>
                    <th className="px-6 py-3">Tujuan</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {manifests.map((m, index) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 group">
                      <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-mono text-xs text-slate-800">{m.eartagId ?? "—"}</div>
                        <div className="text-[11px] text-slate-500">{m.generatedId ?? ""}</div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-slate-800">{m.invoiceNumber ?? "—"}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User size={12} className="shrink-0" />
                          {m.customerName ?? "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top max-w-xs">
                        <div className="flex gap-1.5 text-slate-700 text-xs leading-relaxed">
                          <MapPin size={14} className="shrink-0 text-slate-400 mt-0.5" />
                          <span>{m.destinationAddress ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${manifestStatusStyle(m.deliveryStatus)}`}
                        >
                          <Package size={12} />
                          {m.deliveryStatus ?? "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex justify-end flex-wrap gap-2">
                          {m.farmInventoryId && (
                            <Link
                              href={`/farm/${m.farmInventoryId}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black text-indigo-700 hover:bg-indigo-100"
                              title="Lihat tracking hewan"
                            >
                              <Eye size={14} />
                            </Link>
                          )}
                          <Link
                            href={`/logistics/trips/${trip.id}/manifests/${m.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil size={14} /> Edit
                          </Link>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleMarkDelivered(m)}
                            className="rounded-xl bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 disabled:opacity-50 hover:bg-slate-800"
                          >
                            Tiba
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleDeleteManifest(m)}
                            title="Hapus manifest"
                            aria-label="Hapus manifest"
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 text-slate-400 px-3 py-1.5 text-[10px] font-black hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-slate-100 bg-slate-50/30">
              <Pagination page={page} pageSize={pageSize} totalItems={manifestTotal} />
            </div>
          </>
        )}
      </div>

      {/* Bulk Tracking Modal */}
      <BulkTrackingModal
        open={bulkTrackingOpen}
        onClose={() => setBulkTrackingOpen(false)}
        manifestAnimals={manifests.map((m) => ({
          id: m.id,
          farmInventoryId: m.farmInventoryId ?? 0,
          eartagId: m.eartagId,
          generatedId: m.generatedId,
        })).filter((a) => a.farmInventoryId > 0)}
        onAdded={() => {
          router.refresh();
          toast.success("Tracking berhasil ditambahkan");
        }}
      />
    </div>
  );
}
