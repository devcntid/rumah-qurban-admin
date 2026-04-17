"use client";

import { useState, useCallback } from "react";
import {
  ArrowLeft, Calendar, MapPin, Building2, Search,
  Plus, X, RefreshCw, Trash2, Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { assignItemsAction, unassignItemsAction } from "@/lib/actions/slaughter-schedules";
import type { SlaughterSchedule, AssignableOrderItem } from "@/types/slaughter-schedule";

type Props = {
  schedule: SlaughterSchedule;
  initialAssignedItems: AssignableOrderItem[];
  userRole: string;
};

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Direncanakan",
  ONGOING: "Berlangsung",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function ScheduleDetailClient({ schedule, initialAssignedItems, userRole }: Props) {
  const router = useRouter();
  const [assignedItems, setAssignedItems] = useState(initialAssignedItems);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedItems, setUnassignedItems] = useState<AssignableOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [selectedToAssign, setSelectedToAssign] = useState<Set<number>>(new Set());
  const [selectedToUnassign, setSelectedToUnassign] = useState<Set<number>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const fetchUnassignedItems = useCallback(async (q?: string) => {
    setLoadingUnassigned(true);
    try {
      const params = new URLSearchParams({
        action: "unassigned-items",
        branchId: String(schedule.branchId),
      });
      if (q) params.set("q", q);

      const data = await api<{ items: AssignableOrderItem[] }>(
        `/api/slaughter-schedules?${params.toString()}`
      );
      setUnassignedItems(data.items || []);
    } catch (error) {
      console.error("Error fetching unassigned items:", error);
    } finally {
      setLoadingUnassigned(false);
    }
  }, [schedule.branchId]);

  const openAssignModal = () => {
    setSelectedToAssign(new Set());
    setSearchQuery("");
    setShowAssignModal(true);
    fetchUnassignedItems();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUnassignedItems(searchQuery);
  };

  const toggleAssignSelect = (id: number) => {
    setSelectedToAssign((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleUnassignSelect = (id: number) => {
    setSelectedToUnassign((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedToAssign.size === 0) return;
    setAssigning(true);
    try {
      const res = await assignItemsAction(schedule.id, Array.from(selectedToAssign));
      if (res.success) {
        setShowAssignModal(false);
        router.refresh();
        const assigned = unassignedItems.filter((i) => selectedToAssign.has(i.orderItemId));
        setAssignedItems((prev) => [...prev, ...assigned.map((i) => ({ ...i, currentScheduleId: schedule.id }))]);
        setSelectedToAssign(new Set());
      } else {
        alert(res.error || "Gagal assign");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (selectedToUnassign.size === 0) return;
    if (!confirm(`Unassign ${selectedToUnassign.size} item dari jadwal ini?`)) return;
    setAssigning(true);
    try {
      const res = await unassignItemsAction(Array.from(selectedToUnassign));
      if (res.success) {
        setAssignedItems((prev) => prev.filter((i) => !selectedToUnassign.has(i.orderItemId)));
        setSelectedToUnassign(new Set());
        router.refresh();
      } else {
        alert(res.error || "Gagal unassign");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAssigning(false);
    }
  };

  const selectAllAssign = () => {
    if (selectedToAssign.size === unassignedItems.length) {
      setSelectedToAssign(new Set());
    } else {
      setSelectedToAssign(new Set(unassignedItems.map((i) => i.orderItemId)));
    }
  };

  const selectAllUnassign = () => {
    if (selectedToUnassign.size === assignedItems.length) {
      setSelectedToUnassign(new Set());
    } else {
      setSelectedToUnassign(new Set(assignedItems.map((i) => i.orderItemId)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/slaughter-schedules"
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Detail Jadwal Penyembelihan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola daftar hewan yang dialokasikan ke jadwal ini
          </p>
        </div>
      </div>

      {/* Schedule Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <Calendar size={12} /> Tanggal
            </p>
            <p className="text-lg font-bold text-slate-800">
              {new Date(schedule.scheduledDate + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <Building2 size={12} /> Cabang
            </p>
            <p className="text-lg font-bold text-slate-800">{schedule.branchName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <MapPin size={12} /> Lokasi
            </p>
            <p className="text-lg font-bold text-slate-800">{schedule.locationName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Status</p>
            <span className={`inline-block text-sm font-bold px-3 py-1 rounded-full ${STATUS_COLORS[schedule.status] || "bg-slate-100"}`}>
              {STATUS_LABELS[schedule.status] || schedule.status}
            </span>
          </div>
        </div>
        {schedule.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-1">Catatan</p>
            <p className="text-sm text-slate-700">{schedule.notes}</p>
          </div>
        )}
      </div>

      {/* Assigned Items */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            Hewan yang Dialokasikan ({assignedItems.length} ekor)
          </h2>
          <div className="flex items-center gap-2">
            {selectedToUnassign.size > 0 && (
              <button
                onClick={handleUnassign}
                disabled={assigning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Unassign ({selectedToUnassign.size})
              </button>
            )}
            <button
              onClick={openAssignModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
            >
              <Plus size={14} />
              Assign Hewan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={assignedItems.length > 0 && selectedToUnassign.size === assignedItems.length}
                    onChange={selectAllUnassign}
                    aria-label="Pilih semua item"
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Customer</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Produk</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Eartag</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Peserta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <p className="text-sm">Belum ada hewan yang dialokasikan ke jadwal ini</p>
                    <button
                      onClick={openAssignModal}
                      className="mt-2 text-sm text-emerald-600 font-bold hover:underline"
                    >
                      + Assign hewan sekarang
                    </button>
                  </td>
                </tr>
              ) : (
                assignedItems.map((item) => (
                  <tr key={item.orderItemId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedToUnassign.has(item.orderItemId)}
                        onChange={() => toggleUnassignSelect(item.orderItemId)}
                        aria-label={`Pilih ${item.invoiceNumber}`}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${item.orderId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {item.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{item.customerName}</p>
                        <p className="text-xs text-slate-500">{item.customerPhone || "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{item.itemName}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        {item.eartagId || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.participantNames.length > 0 ? item.participantNames.join(", ") : item.customerName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                Assign Hewan ke Jadwal
              </h2>
              <button onClick={() => setShowAssignModal(false)} title="Tutup" className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-slate-100">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari invoice, customer, eartag..."
                    className={`${FIELD_CLASS} pl-9`}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#102a43] text-white rounded-lg text-sm font-bold hover:bg-slate-800"
                >
                  Cari
                </button>
              </form>
              <p className="text-xs text-slate-500 mt-2">
                Menampilkan order item hewan dari cabang {schedule.branchName} yang belum di-assign ke jadwal manapun dan belum disembelih.
              </p>
            </div>

            <div className="flex-1 overflow-auto">
              {loadingUnassigned ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={16} className="animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-500">Memuat...</span>
                </div>
              ) : unassignedItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm">Tidak ada order item hewan yang tersedia untuk di-assign</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2 w-10">
                        <input
                          type="checkbox"
                          checked={selectedToAssign.size === unassignedItems.length}
                          onChange={selectAllAssign}
                          aria-label="Pilih semua item"
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="px-4 py-2 text-[10px] uppercase font-black text-slate-500">Invoice</th>
                      <th className="px-4 py-2 text-[10px] uppercase font-black text-slate-500">Customer</th>
                      <th className="px-4 py-2 text-[10px] uppercase font-black text-slate-500">Produk</th>
                      <th className="px-4 py-2 text-[10px] uppercase font-black text-slate-500">Eartag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unassignedItems.map((item) => (
                      <tr
                        key={item.orderItemId}
                        className={`cursor-pointer transition-colors ${
                          selectedToAssign.has(item.orderItemId) ? "bg-emerald-50" : "hover:bg-slate-50/50"
                        }`}
                        onClick={() => toggleAssignSelect(item.orderItemId)}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedToAssign.has(item.orderItemId)}
                            onChange={() => toggleAssignSelect(item.orderItemId)}
                            aria-label={`Pilih ${item.invoiceNumber}`}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-2 font-medium text-slate-700">{item.invoiceNumber}</td>
                        <td className="px-4 py-2">
                          <div>
                            <p className="font-medium text-slate-800">{item.customerName}</p>
                            <p className="text-xs text-slate-500">{item.customerPhone || "-"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-slate-700">{item.itemName}</td>
                        <td className="px-4 py-2">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            {item.eartagId || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {selectedToAssign.size > 0 && (
                  <span className="font-bold text-emerald-600">{selectedToAssign.size} item dipilih</span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selectedToAssign.size === 0 || assigning}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check size={16} />
                  {assigning ? "Menyimpan..." : `Assign ${selectedToAssign.size} Item`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
