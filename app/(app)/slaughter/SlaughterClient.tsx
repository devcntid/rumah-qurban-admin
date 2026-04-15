"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Calendar, Eye, RefreshCw, 
  ChevronLeft, ChevronRight, Scissors, Building2
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { SlaughterRecordWithDetails } from "@/types/notifications";

type Branch = { id: number; name: string };

type Props = {
  branches: Branch[];
  userRole: string;
  userBranchId: number | null;
};

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

export default function SlaughterClient({ branches, userRole, userBranchId }: Props) {
  const [records, setRecords] = useState<SlaughterRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filters, setFilters] = useState({
    branchId: userRole === "SUPER_ADMIN" ? "" : String(userBranchId || ""),
    startDate: "",
    endDate: "",
    q: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String((page - 1) * pageSize));
      
      if (filters.branchId) params.set("branchId", filters.branchId);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.q) params.set("q", filters.q);

      const data = await api<{
        records: SlaughterRecordWithDetails[];
        total: number;
      }>(`/api/slaughter-records?${params.toString()}`);

      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching slaughter records:", error);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          {userRole === "SUPER_ADMIN" && (
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="slaughterBranchFilter" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                <Building2 size={12} /> Cabang
              </label>
              <select
                id="slaughterBranchFilter"
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

          <div className="flex-1 min-w-[160px]">
            <label htmlFor="startDateFilter" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
              <Calendar size={12} /> Dari Tanggal
            </label>
            <input
              id="startDateFilter"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <label htmlFor="endDateFilter" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
              <Calendar size={12} /> Sampai Tanggal
            </label>
            <input
              id="endDateFilter"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="searchFilter" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
              <Search size={12} /> Cari
            </label>
            <input
              id="searchFilter"
              type="text"
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              placeholder="Invoice, customer, eartag..."
              className={FIELD_CLASS}
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-[#102a43] text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            <Filter size={16} />
            Filter
          </button>

          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Eartag
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Invoice
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Tanggal Sembelih
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Lokasi
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  Foto
                </th>
                <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Scissors size={32} className="text-slate-300" />
                      <p>Belum ada data penyembelihan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        {record.eartagId || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link 
                        href={`/orders/${record.orderId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {record.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{record.customerName}</p>
                        <p className="text-xs text-slate-500">{record.customerPhone || "-"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {record.itemName}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {new Date(record.slaughteredAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(record.slaughteredAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {record.slaughterLocation || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {record.documentationPhotos.slice(0, 3).map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo.url}
                            alt={`Foto ${idx + 1}`}
                            className="w-8 h-8 rounded-lg border-2 border-white object-cover"
                          />
                        ))}
                        {record.documentationPhotos.length > 3 && (
                          <span className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            +{record.documentationPhotos.length - 3}
                          </span>
                        )}
                        {record.documentationPhotos.length === 0 && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/slaughter/${record.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Eye size={14} />
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-sm text-slate-600">
              Menampilkan <span className="font-bold">{(page - 1) * pageSize + 1}</span> - 
              <span className="font-bold">{Math.min(page * pageSize, total)}</span> dari{" "}
              <span className="font-bold">{total}</span> data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
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
