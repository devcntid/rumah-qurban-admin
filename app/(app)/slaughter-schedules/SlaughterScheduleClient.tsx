"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Filter, Calendar, RefreshCw, Building2,
  ChevronLeft, ChevronRight, Eye, Edit2, Trash2, X,
  MapPin, ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import {
  createScheduleAction,
  updateScheduleAction,
  deleteScheduleAction,
  updateScheduleStatusAction,
} from "@/lib/actions/slaughter-schedules";
import type { SlaughterSchedule, SlaughterScheduleStatus } from "@/types/slaughter-schedule";

type Branch = { id: number; name: string };

type Props = {
  branches: Branch[];
  userRole: string;
  userBranchId: number | null;
};

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

const STATUS_LABELS: Record<SlaughterScheduleStatus, string> = {
  PLANNED: "Direncanakan",
  ONGOING: "Berlangsung",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLORS: Record<SlaughterScheduleStatus, string> = {
  PLANNED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function SlaughterScheduleClient({ branches, userRole, userBranchId }: Props) {
  const [schedules, setSchedules] = useState<SlaughterSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filters, setFilters] = useState({
    branchId: userRole === "SUPER_ADMIN" ? "" : String(userBranchId || ""),
    status: "",
    startDate: "",
    endDate: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<SlaughterSchedule | null>(null);
  const [formData, setFormData] = useState({
    branchId: userRole === "SUPER_ADMIN" ? "" : String(userBranchId || ""),
    scheduledDate: "",
    locationName: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String((page - 1) * pageSize));
      if (filters.branchId) params.set("branchId", filters.branchId);
      if (filters.status) params.set("status", filters.status);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const data = await api<{ schedules: SlaughterSchedule[]; total: number }>(
        `/api/slaughter-schedules?${params.toString()}`
      );
      setSchedules(data.schedules || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / pageSize);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const openCreateForm = () => {
    setEditingSchedule(null);
    setFormData({
      branchId: userRole === "SUPER_ADMIN" ? "" : String(userBranchId || ""),
      scheduledDate: "",
      locationName: "",
      notes: "",
    });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (schedule: SlaughterSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      branchId: String(schedule.branchId),
      scheduledDate: schedule.scheduledDate,
      locationName: schedule.locationName,
      notes: schedule.notes || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.branchId || !formData.scheduledDate || !formData.locationName.trim()) {
      setFormError("Cabang, tanggal, dan lokasi wajib diisi");
      return;
    }
    setSaving(true);
    setFormError("");

    try {
      if (editingSchedule) {
        const res = await updateScheduleAction(editingSchedule.id, {
          branchId: Number(formData.branchId),
          scheduledDate: formData.scheduledDate,
          locationName: formData.locationName.trim(),
          notes: formData.notes.trim() || null,
        });
        if (!res.success) {
          setFormError(res.error || "Gagal update");
          return;
        }
      } else {
        const res = await createScheduleAction({
          branchId: Number(formData.branchId),
          scheduledDate: formData.scheduledDate,
          locationName: formData.locationName.trim(),
          notes: formData.notes.trim() || null,
        });
        if (!res.success) {
          setFormError(res.error || "Gagal membuat jadwal");
          return;
        }
      }
      setShowForm(false);
      fetchData();
    } catch (error) {
      setFormError("Terjadi kesalahan");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus jadwal ini? Semua order item yang di-assign akan di-unassign.")) return;
    const res = await deleteScheduleAction(id);
    if (res.success) {
      fetchData();
    } else {
      alert(res.error || "Gagal menghapus jadwal");
    }
  };

  const handleStatusChange = async (id: number, status: SlaughterScheduleStatus) => {
    const res = await updateScheduleStatusAction(id, status);
    if (res.success) {
      fetchData();
    } else {
      alert(res.error || "Gagal update status");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {userRole === "SUPER_ADMIN" && (
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="scheduleBranchFilter" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                <Building2 size={12} /> Cabang
              </label>
              <select
                id="scheduleBranchFilter"
                value={filters.branchId}
                onChange={(e) => handleFilterChange("branchId", e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 min-w-[140px]">
            <label htmlFor="scheduleStatusFilter" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
              <ClipboardList size={12} /> Status
            </label>
            <select
              id="scheduleStatusFilter"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Semua Status</option>
              <option value="PLANNED">Direncanakan</option>
              <option value="ONGOING">Berlangsung</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label htmlFor="scheduleStartDate" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
              <Calendar size={12} /> Dari Tanggal
            </label>
            <input
              id="scheduleStartDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <label htmlFor="scheduleEndDate" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
              <Calendar size={12} /> Sampai Tanggal
            </label>
            <input
              id="scheduleEndDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-[#102a43] text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            <Filter size={16} />
            Filter
          </button>

          <button
            onClick={fetchData}
            title="Refresh"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {editingSchedule ? "Edit Jadwal" : "Tambah Jadwal Penyembelihan"}
              </h2>
              <button onClick={() => setShowForm(false)} title="Tutup" className="p-1 hover:bg-slate-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="formBranch" className="block text-xs font-bold text-slate-600 mb-1.5">Cabang *</label>
                <select
                  id="formBranch"
                  value={formData.branchId}
                  onChange={(e) => setFormData((p) => ({ ...p, branchId: e.target.value }))}
                  className={FIELD_CLASS}
                  disabled={userRole !== "SUPER_ADMIN"}
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="formScheduleDate" className="block text-xs font-bold text-slate-600 mb-1.5">Tanggal Penyembelihan *</label>
                <input
                  id="formScheduleDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData((p) => ({ ...p, scheduledDate: e.target.value }))}
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Lokasi Penyembelihan *</label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData((p) => ({ ...p, locationName: e.target.value }))}
                  placeholder="Contoh: Desa Dukuhturi - Kabupaten Brebes"
                  className={FIELD_CLASS}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Catatan tambahan (opsional)"
                  rows={3}
                  className={FIELD_CLASS}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : editingSchedule ? "Update" : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Cabang</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Lokasi</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Hewan</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Catatan</th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar size={32} className="text-slate-300" />
                      <p>Belum ada jadwal penyembelihan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-800">
                          {new Date(s.scheduledDate + "T00:00:00").toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Building2 size={14} className="text-slate-400" />
                        {s.branchName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                        <MapPin size={14} className="text-slate-400" />
                        {s.locationName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
                        {s.assignedCount || 0} ekor
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value as SlaughterScheduleStatus)}
                        aria-label={`Status jadwal ${s.locationName}`}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[s.status as SlaughterScheduleStatus] || "bg-slate-100"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                      {s.notes || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/slaughter-schedules/${s.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Eye size={14} />
                          Detail
                        </Link>
                        <button
                          onClick={() => openEditForm(s)}
                          title="Edit jadwal"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          title="Hapus jadwal"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-sm text-slate-600">
              Menampilkan <span className="font-bold">{(page - 1) * pageSize + 1}</span> -{" "}
              <span className="font-bold">{Math.min(page * pageSize, total)}</span> dari{" "}
              <span className="font-bold">{total}</span> data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Halaman sebelumnya"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold ${
                      page === pageNum
                        ? "bg-[#102a43] text-white"
                        : "border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                title="Halaman berikutnya"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
