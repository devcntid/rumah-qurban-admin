"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Search, 
  Loader2,
  Tag,
  AlertCircle,
  Eye
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { allocateAnimalAction, deallocateAnimalAction, bulkAllocateAction } from "@/lib/actions/allocations";
import { toast } from "sonner";
import Link from "next/link";

export function AllocationSection({
  orderItemId,
  itemName,
  targetQuantity,
  initialAllocations = []
}: {
  orderItemId: number;
  itemName: string;
  targetQuantity: number;
  initialAllocations: any[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableAnimals, setAvailableAnimals] = useState<any[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchAvailable = async () => {
    setIsLoadingAvailable(true);
    try {
      const res = await fetch(`/api/farm/available/${orderItemId}`);
      const data = await res.json();
      setAvailableAnimals(data);
    } catch (err) {
      toast.error("Gagal mengambil data hewan tersedia");
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailable();
      setSelectedIds([]);
    }
  }, [isModalOpen]);

  const handleAllocate = async (inventoryId: number, eartag: string) => {
    startTransition(async () => {
      const res = await allocateAnimalAction(inventoryId, orderItemId);
      if (res.success) {
        toast.success(`Hewan ${eartag} berhasil dipasangkan`);
        fetchAvailable();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleBulkAllocate = async () => {
    if (selectedIds.length === 0) return;
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
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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

  const filteredAvailable = availableAnimals.filter(a => 
    a.eartagId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.generatedId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchedCount = initialAllocations.length;
  const isComplete = matchedCount >= targetQuantity;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Tag size={14} className="text-indigo-500"/> Hewan Terpasang (Matching)
        </h4>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            matchedCount >= targetQuantity ? "bg-green-100 text-green-700" : 
            matchedCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
          }`}>
            {matchedCount} dari {targetQuantity} Terpasang
          </span>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 transition-all active:scale-95"
          >
            <Plus size={12}/> Pasangkan Hewan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {initialAllocations.map((a: any) => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col group hover:border-indigo-300 transition-all shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-3xl -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            
            {/* Header: IDs & Species */}
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
                <Trash2 size={16}/>
              </button>
            </div>

            {/* Grid Detail */}
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
            
            {/* View Tracking Link */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Link 
                href={`/farm/${a.id}`}
                className="flex items-center justify-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all active:scale-95"
              >
                <Eye size={12}/> Lihat Detail & Tracking
              </Link>
            </div>
          </div>
        ))}
        {matchedCount === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <AlertCircle size={32} className="text-slate-300 mb-2"/>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Belum ada hewan dipasangkan</p>
          </div>
        )}
      </div>

      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Pasangkan Hewan ke ${itemName}`}
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari Eartag / ID Hewan..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkAllocate}
                disabled={isPending}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/10 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Pasangkan {selectedIds.length} Terpilih
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {isLoadingAvailable ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <p className="text-xs font-bold text-slate-500">Mencari hewan yang tersedia...</p>
              </div>
            ) : filteredAvailable.map((a: any) => (
              <div 
                key={a.id} 
                onClick={() => toggleSelect(a.id)}
                className={`flex justify-between items-center p-3 bg-white border rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group cursor-pointer ${
                  selectedIds.includes(a.id) ? "border-blue-500 bg-blue-50/30" : "border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black transition-all ${
                    selectedIds.includes(a.id) ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                  }`}>
                    {selectedIds.includes(a.id) ? <CheckCircle2 size={20} /> : (a.species?.[0] || "H")}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{a.eartagId}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{a.species} {a.classGrade} ({a.weightRange})</p>
                  </div>
                </div>
                <div 
                  className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                    selectedIds.includes(a.id) ? "bg-blue-600 border-blue-600" : "border-slate-200 bg-white"
                  }`}
                >
                  {selectedIds.includes(a.id) && <CheckCircle2 size={12} className="text-white" />}
                </div>
              </div>
            ))}
            {!isLoadingAvailable && filteredAvailable.length === 0 && (
              <div className="py-20 text-center opacity-40">
                <Search size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-black text-slate-400">Hewan tidak ditemukan</p>
                <p className="text-[10px] text-slate-400 font-medium">Pastikan hewan tersedia di cabang yang sama dan memiliki varian yang melambangkan item ini.</p>
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
