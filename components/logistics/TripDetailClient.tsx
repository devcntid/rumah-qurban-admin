"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Package, Pencil, Plus, Trash2, User, Eye, ListChecks, Send, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { DeliveryManifestRow, EligibleFarmAnimalRow, LogisticsTripRow } from "@/lib/db/queries/logistics";
import type { NotifTemplate } from "@/types/notifications";
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
  notifTemplates = [],
}: {
  trip: LogisticsTripRow;
  manifests: DeliveryManifestRow[];
  manifestTotal: number;
  manifestHasFilters: boolean;
  page: number;
  pageSize: number;
  eligibleAnimals: EligibleFarmAnimalRow[];
  notifTemplates?: NotifTemplate[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [bulkTrackingOpen, setBulkTrackingOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifTarget, setNotifTarget] = useState<{ mode: "single"; manifest: DeliveryManifestRow } | { mode: "bulk" } | null>(null);

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
            <>
              <button
                type="button"
                onClick={() => { setNotifTarget({ mode: "bulk" }); setNotifModalOpen(true); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
              >
                <Send size={14} /> Bulk Kirim Notif
              </button>
              <button
                type="button"
                onClick={() => setBulkTrackingOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
              >
                <ListChecks size={14} /> Bulk Tracking
              </button>
            </>
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
                      <td className="px-6 py-4 text-center text-slate-600 font-mono text-xs">
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
                          {m.orderId && (
                            <button
                              type="button"
                              onClick={() => { setNotifTarget({ mode: "single", manifest: m }); setNotifModalOpen(true); }}
                              className="inline-flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-[10px] font-black text-green-700 hover:bg-green-100"
                              title="Kirim notifikasi"
                            >
                              <Send size={14} />
                            </button>
                          )}
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

      {/* Send Notif Modal */}
      <SendNotifModal
        open={notifModalOpen}
        onClose={() => { setNotifModalOpen(false); setNotifTarget(null); }}
        templates={notifTemplates}
        target={notifTarget}
        trip={trip}
        manifests={manifests}
      />
    </div>
  );
}

function SendNotifModal({
  open,
  onClose,
  templates,
  target,
  trip,
  manifests,
}: {
  open: boolean;
  onClose: () => void;
  templates: NotifTemplate[];
  target: { mode: "single"; manifest: DeliveryManifestRow } | { mode: "bulk" } | null;
  trip: LogisticsTripRow;
  manifests: DeliveryManifestRow[];
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  if (!open || !target) return null;

  const currentTarget = target;

  const deliveryTemplates = templates.filter((t) =>
    t.name.startsWith("PENGIRIMAN_") || t.name === "KONFIRMASI_SEMBELIH" || t.name === "LAPORAN_DOKUMENTASI"
  );
  const otherTemplates = templates.filter((t) => !deliveryTemplates.includes(t));

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const baseCustomVars: Record<string, string> = {
    delivery_date: trip.scheduledDate || "-",
    vehicle_plate: trip.vehiclePlate || "-",
    driver_name: trip.driverName || "-",
  };

  function getCustomVarsForManifest(manifest?: DeliveryManifestRow): Record<string, string> {
    return {
      ...baseCustomVars,
      destination_address: manifest?.destinationAddress || "-",
    };
  }

  function handleSelectTemplate(id: number) {
    setSelectedTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) {
      let text = tmpl.templateText;
      const vars = target?.mode === "single"
        ? getCustomVarsForManifest(target.manifest)
        : baseCustomVars;
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "gi"), v);
      }
      setPreview(text);
    }
  }

  async function handleSend() {
    if (!selectedTemplateId || !target) {
      toast.error("Pilih template terlebih dahulu");
      return;
    }

    setSending(true);
    try {
      if (target.mode === "single") {
        const singleManifest = target.manifest;
        const orderId = singleManifest.orderId;
        if (!orderId) {
          toast.error("Manifest tidak terhubung ke order");
          return;
        }
        const singleVars = getCustomVarsForManifest(singleManifest);
        const res = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            templateId: selectedTemplateId,
            customVariables: singleVars,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Notifikasi berhasil dikirim ke ${singleManifest.customerName || "pelanggan"}`);
          onClose();
        } else {
          toast.error(data.error || "Gagal mengirim notifikasi");
        }
      } else {
        const orderIds = [...new Set(
          manifests.filter((m) => m.orderId).map((m) => m.orderId as number)
        )];
        if (orderIds.length === 0) {
          toast.error("Tidak ada order yang terhubung di manifest ini");
          return;
        }
        const res = await fetch("/api/notifications/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds,
            templateId: selectedTemplateId,
            customVariables: baseCustomVars,
          }),
        });
        const data = await res.json();
        if (data.success || data.successCount > 0) {
          toast.success(`Berhasil kirim ${data.successCount}/${data.totalProcessed} notifikasi`);
          if (data.failedCount > 0) {
            toast.warning(`${data.failedCount} gagal: ${data.errors?.[0] || "unknown"}`);
          }
          onClose();
        } else {
          toast.error(data.error || "Gagal mengirim broadcast");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-800">
            {currentTarget.mode === "bulk"
              ? `Kirim Notif ke ${[...new Set(manifests.filter((m) => m.orderId).map((m) => m.orderId))].length} order`
              : `Kirim Notif - ${currentTarget.manifest.customerName || "Pelanggan"}`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
              Pilih Template
            </label>
            {deliveryTemplates.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-bold text-green-600 uppercase mb-1">Template Pengiriman</p>
                <div className="space-y-1">
                  {deliveryTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                        selectedTemplateId === t.id
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t.name.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {otherTemplates.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Template Lainnya</p>
                <div className="space-y-1">
                  {otherTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                        selectedTemplateId === t.id
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t.name.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {preview && selectedTemplate && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Preview Pesan
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {preview}
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                Variabel seperti {"{{customer_name}}"} akan otomatis diganti saat pengiriman.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!selectedTemplateId || sending}
            onClick={handleSend}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Mengirim..." : "Kirim WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
