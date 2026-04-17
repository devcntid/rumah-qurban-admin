"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Loader2,
  Tag,
  AlertCircle,
  Eye,
  Filter,
  Star,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Weight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { allocateAnimalAction, deallocateAnimalAction, bulkAllocateAction } from "@/lib/actions/allocations";
import { toast } from "sonner";
import Link from "next/link";

type FilterOptions = {
  species: string[];
  classGrades: string[];
  vendors: { id: number; name: string }[];
  branches: { id: number; name: string }[];
};

type AnimalRow = {
  id: number;
  generatedId: string;
  farmAnimalId: string | null;
  eartagId: string;
  animalVariantId: number | null;
  branchId: number | null;
  vendorId: number | null;
  hornType: string | null;
  weightActual: string | null;
  photoUrl: string | null;
  status: string;
  species: string | null;
  classGrade: string | null;
  weightRange: string | null;
  vendorName: string | null;
  branchName: string | null;
  isRecommended: boolean;
};

export function AllocationSection({
  orderItemId,
  itemName,
  targetQuantity,
  initialAllocations = [],
}: {
  orderItemId: number;
  itemName: string;
  targetQuantity: number;
  initialAllocations: any[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableAnimals, setAvailableAnimals] = useState<AnimalRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    species: [],
    classGrades: [],
    vendors: [],
    branches: [],
  });
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    species: "",
    branchId: "",
    vendorId: "",
    classGrade: "",
    hornType: "",
  });

  const fetchAvailable = useCallback(async (currentFilters?: typeof filters) => {
    const f = currentFilters ?? filters;
    setIsLoadingAvailable(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.species) params.set("species", f.species);
      if (f.branchId) params.set("branchId", f.branchId);
      if (f.vendorId) params.set("vendorId", f.vendorId);
      if (f.classGrade) params.set("classGrade", f.classGrade);
      if (f.hornType) params.set("hornType", f.hornType);

      const res = await fetch(`/api/farm/available/${orderItemId}?${params}`);
      const data = await res.json();
      setAvailableAnimals(data.animals || []);
      if (data.filters) setFilterOptions(data.filters);
    } catch {
      toast.error("Gagal mengambil data hewan tersedia");
    } finally {
      setIsLoadingAvailable(false);
    }
  }, [orderItemId, filters]);

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailable();
      setSelectedIds([]);
    }
  }, [isModalOpen]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchAvailable(newFilters);
  };

  const resetFilters = () => {
    const empty = { search: "", species: "", branchId: "", vendorId: "", classGrade: "", hornType: "" };
    setFilters(empty);
    fetchAvailable(empty);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fetchAvailable();
  };

  const handleBulkAllocate = async () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length > remainingSlots) {
      toast.error(`Maksimal ${remainingSlots} hewan lagi (kuota: ${targetQuantity}, sudah terpasang: ${matchedCount})`);
      return;
    }
    startTransition(async () => {
      const res = await bulkAllocateAction(selectedIds, orderItemId);
      if (res.success) {
        toast.success(`${selectedIds.length} hewan berhasil dipasangkan`);
        setIsModalOpen(false);
        setSelectedIds([]);
      } else {
        toast.error(res.error);
      }
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= remainingSlots) {
        toast.error(`Maksimal ${remainingSlots} hewan lagi (kuota: ${targetQuantity}, sudah terpasang: ${matchedCount})`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleDeallocate = async (allocationId: number, eartag: string) => {
    if (!confirm(`Batalkan pemasangan hewan ${eartag}?`)) return;
    startTransition(async () => {
      const res = await deallocateAnimalAction(allocationId);
      if (res.success) {
        toast.success(`Pemasangan hewan ${eartag} dibatalkan`);
      } else {
        toast.error(res.error);
      }
    });
  };

  const matchedCount = initialAllocations.length;
  const isComplete = matchedCount >= targetQuantity;
  const remainingSlots = Math.max(0, targetQuantity - matchedCount);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const recommendedCount = availableAnimals.filter((a) => a.isRecommended).length;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Tag size={14} className="text-indigo-500" /> Hewan Terpasang (Matching)
        </h4>
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              matchedCount >= targetQuantity
                ? "bg-green-100 text-green-700"
                : matchedCount > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {matchedCount} dari {targetQuantity} Terpasang
          </span>
          {isComplete ? (
            <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
              <CheckCircle2 size={12} /> Kuota Terpenuhi
            </span>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 transition-all active:scale-95"
            >
              <Plus size={12} /> Pasangkan Hewan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {initialAllocations.map((a: any) => (
          <div
            key={a.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col group hover:border-indigo-300 transition-all shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-3xl -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-900/20">
                  {a.species?.[0] || "?"}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm leading-none">{a.eartagId}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Tag ID (Eartag)</p>
                </div>
              </div>
              <button
                onClick={() => handleDeallocate(a.allocationId, a.eartagId)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Farm Animal ID</p>
                <p className="text-[11px] font-black text-slate-700">{a.farmAnimalId || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Generated ID</p>
                <p className="text-[11px] font-black font-mono text-slate-500">{a.generatedId}</p>
              </div>
              <div className="col-span-2 py-2 border-y border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Kategori & Varian</p>
                <p className="text-xs font-black text-[#102a43]">
                  {a.species} • {a.classGrade} ({a.weightRange})
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tanduk</p>
                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tight border border-slate-200">
                  {a.hornType || "—"}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vendor / Sumber</p>
                <p className="text-[10px] font-bold text-slate-600 italic truncate" title={a.vendorName}>
                  {a.vendorName || "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <Link
                href={`/farm/${a.id}`}
                className="flex items-center justify-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all active:scale-95"
              >
                <Eye size={12} /> Lihat Detail & Tracking
              </Link>
            </div>
          </div>
        ))}
        {matchedCount === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <AlertCircle size={32} className="text-slate-300 mb-2" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
              Belum ada hewan dipasangkan
            </p>
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Pasangkan Hewan ke ${itemName}`}
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Search + Filter Toggle + Bulk Action */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Eartag / ID Hewan..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              <button
                onClick={() => fetchAvailable()}
                title="Cari"
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Search size={16} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle Filter"
                className={`px-3 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 ${
                  showFilters
                    ? "bg-slate-800 text-white"
                    : hasActiveFilters
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Filter size={14} />
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Bulk action bar */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
                <span className="text-xs font-black text-indigo-700">
                  {selectedIds.length} hewan dipilih
                </span>
                <button
                  onClick={handleBulkAllocate}
                  disabled={isPending}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-xs font-black shadow-lg shadow-indigo-900/10 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Pasangkan {selectedIds.length} Terpilih
                </button>
              </div>
            )}
          </div>

          {/* Quota info */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
            remainingSlots === 0
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-amber-50 border border-amber-200 text-amber-700"
          }`}>
            <AlertCircle size={14} />
            {remainingSlots === 0 ? (
              <span>Kuota sudah terpenuhi ({matchedCount}/{targetQuantity} hewan terpasang)</span>
            ) : (
              <span>Sisa kuota: <strong>{remainingSlots}</strong> hewan lagi ({matchedCount}/{targetQuantity} terpasang)</span>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={12} /> Filter Lanjutan
                </h4>
                <button
                  onClick={resetFilters}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Jenis Hewan</label>
                  <select
                    value={filters.species}
                    onChange={(e) => handleFilterChange("species", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="">Semua Jenis</option>
                    {filterOptions.species.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Kelas</label>
                  <select
                    value={filters.classGrade}
                    onChange={(e) => handleFilterChange("classGrade", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="">Semua Kelas</option>
                    {filterOptions.classGrades.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Cabang</label>
                  <select
                    value={filters.branchId}
                    onChange={(e) => handleFilterChange("branchId", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="">Semua Cabang</option>
                    {filterOptions.branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Vendor</label>
                  <select
                    value={filters.vendorId}
                    onChange={(e) => handleFilterChange("vendorId", e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="">Semua Vendor</option>
                    {filterOptions.vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Stats bar */}
          {!isLoadingAvailable && availableAnimals.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
              <span>{availableAnimals.length} hewan tersedia</span>
              {recommendedCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Star size={10} /> {recommendedCount} rekomendasi (cocok dengan order)
                </span>
              )}
            </div>
          )}

          {/* Animal List */}
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {isLoadingAvailable ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <p className="text-xs font-bold text-slate-500">Mencari hewan yang tersedia...</p>
              </div>
            ) : availableAnimals.length > 0 ? (
              availableAnimals.map((a) => (
                <div
                  key={a.id}
                  onClick={() => toggleSelect(a.id)}
                  className={`flex justify-between items-center p-3 bg-white border-2 rounded-xl hover:shadow-sm transition-all cursor-pointer ${
                    selectedIds.includes(a.id)
                      ? "border-indigo-500 bg-indigo-50/30"
                      : a.isRecommended
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-sm shrink-0 transition-all ${
                        selectedIds.includes(a.id)
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      {selectedIds.includes(a.id) ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        a.species?.[0] || "H"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 text-sm">{a.eartagId}</p>
                        {a.isRecommended && (
                          <span className="flex items-center gap-0.5 text-[8px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                            <Star size={8} /> Cocok
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-[10px] text-slate-500 font-bold">
                          {a.species} {a.classGrade}
                        </span>
                        {a.weightRange && (
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {a.weightRange}
                          </span>
                        )}
                        {a.weightActual && (
                          <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                            <Weight size={8} /> {a.weightActual}kg
                          </span>
                        )}
                        {a.hornType && (
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {a.hornType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {a.branchName && (
                          <span className="text-[9px] text-slate-400 font-medium">{a.branchName}</span>
                        )}
                        {a.vendorName && (
                          <span className="text-[9px] text-slate-400 font-medium italic">• {a.vendorName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ml-2 ${
                      selectedIds.includes(a.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {selectedIds.includes(a.id) && (
                      <CheckCircle2 size={12} className="text-white" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center opacity-40">
                <Search size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-black text-slate-400">Hewan tidak ditemukan</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  {hasActiveFilters
                    ? "Coba ubah atau reset filter untuk melihat lebih banyak hewan."
                    : "Belum ada hewan tersedia di inventory."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
