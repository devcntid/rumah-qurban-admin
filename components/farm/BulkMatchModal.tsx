"use client";

import { useState, useTransition, useEffect } from "react";
import { Search, Loader2, ShoppingCart, CheckCircle2, AlertCircle, X, Filter, Users, MapPin, Calendar, Package } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { bulkAllocateAction } from "@/lib/actions/allocations";
import { toast } from "sonner";

export function BulkMatchModal({
  open,
  onClose,
  inventoryIds = []
}: {
  open: boolean;
  onClose: () => void;
  inventoryIds: number[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  
  // Multi-filter state
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (filterBranch) params.set("branch", filterBranch);
      if (filterStatus) params.set("status", filterStatus);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

      const res = await fetch(`/api/orders/search?${params.toString()}`);
      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msg =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : `Gagal memuat pesanan (${res.status})`;
        toast.error(msg);
        setOrders([]);
        return;
      }

      if (!Array.isArray(payload)) {
        toast.error("Format data pesanan tidak valid");
        setOrders([]);
        return;
      }

      setOrders(payload);
    } catch {
      toast.error("Gagal mencari pesanan");
      setOrders([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (open) {
      handleSearch();
    }
  }, [open]);

  const handleMatch = async (orderItemId: number, requiredQty: number) => {
    // Validation: qty selected must match required qty
    if (inventoryIds.length !== requiredQty) {
      toast.error(`Qty tidak sesuai! Order membutuhkan ${requiredQty} hewan, tapi Anda memilih ${inventoryIds.length} hewan.`);
      return;
    }

    startTransition(async () => {
      const res = await bulkAllocateAction(inventoryIds, orderItemId);
      if (res.success) {
        toast.success(`${inventoryIds.length} hewan berhasil dipasangkan ke order item`);
        onClose();
        setSelectedOrder(null);
        setOrders([]);
        setSearchQuery("");
      } else {
        toast.error(res.error);
      }
    });
  };

  const resetFilters = () => {
    setFilterBranch("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchQuery("");
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={`Pasangkan Massal (${inventoryIds.length} Hewan)`}
      maxWidthClassName="max-w-4xl"
    >
      <div className="space-y-6">
        {!selectedOrder ? (
          <div className="space-y-4">
            {/* Info Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <Package size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-indigo-900 mb-1">Cari Pesanan untuk Memasangkan Hewan</p>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Gunakan filter untuk mencari pesanan. <strong>Qty hewan yang dipilih ({inventoryIds.length}) harus sama dengan qty order item</strong>. 
                    Order yang sudah ter-match akan ditandai dengan badge hijau.
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Invoice / Nama Pelanggan..." 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Cari
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${showFilters ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
              >
                <Filter size={16} />
                {showFilters ? 'Tutup' : 'Filter'}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Filter size={14} /> Filter Lanjutan
                  </h4>
                  <button 
                    onClick={resetFilters}
                    className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                  >
                    Reset Filter
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                      <MapPin size={10} className="inline mr-1" />
                      Cabang
                    </label>
                    <input 
                      type="text" 
                      placeholder="Nama cabang..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                      value={filterBranch}
                      onChange={(e) => setFilterBranch(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                      <ShoppingCart size={10} className="inline mr-1" />
                      Status
                    </label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">Semua Status</option>
                      <option value="PENDING">PENDING</option>
                      <option value="DP_PAID">DP PAID</option>
                      <option value="FULL_PAID">FULL PAID</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                      <Calendar size={10} className="inline mr-1" />
                      Dari Tanggal
                    </label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                      <Calendar size={10} className="inline mr-1" />
                      Sampai Tanggal
                    </label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleSearch}
                  className="w-full bg-slate-800 text-white py-2.5 rounded-xl text-xs font-black hover:bg-slate-900 transition-all"
                >
                  Terapkan Filter
                </button>
              </div>
            )}

            {/* Orders List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                  <p className="text-sm font-bold text-slate-500">Mencari pesanan...</p>
                </div>
              ) : (Array.isArray(orders) ? orders : []).length === 0 ? (
                <div className="py-16 text-center opacity-40">
                  <Search size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-black text-slate-400">
                    {searchQuery || filterBranch || filterStatus || filterDateFrom || filterDateTo 
                      ? "Pesanan tidak ditemukan dengan filter ini" 
                      : "Masukkan kata kunci atau gunakan filter untuk mencari pesanan"}
                  </p>
                </div>
              ) : (
                (Array.isArray(orders) ? orders : []).map((o) => (
                  <button 
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="w-full flex justify-between items-start p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-slate-800 text-base leading-tight">{o.invoiceNumber}</span>
                        {o.hasMatches && (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded-full uppercase tracking-tight flex items-center gap-1">
                            <CheckCircle2 size={10} /> Sudah Match
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                        <span className="flex items-center gap-1">
                          <Users size={10} /> {o.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {o.branchName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md ${
                          o.status === 'FULL_PAID' ? 'bg-green-100 text-green-700' :
                          o.status === 'DP_PAID' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="mt-2 text-[10px] text-indigo-600 font-black">
                        {(Array.isArray(o.items) ? o.items : []).length} item pesanan
                      </div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                      <CheckCircle2 size={18} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Order Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-2xl border-2 border-indigo-200">
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Pesanan Terpilih</p>
                <p className="font-black text-slate-900 text-xl leading-tight">{selectedOrder.invoiceNumber}</p>
                <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1"><Users size={12} /> {selectedOrder.customerName}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {selectedOrder.branchName}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="bg-white border-2 border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <X size={14} /> Ganti Order
              </button>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                <ShoppingCart size={16} className="text-indigo-600"/> Pilih Item untuk Dipasangkan
              </h4>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((it: any) => {
                  const qtyMatches = inventoryIds.length === it.quantity;
                  const isAlreadyMatched = it.allocationCount > 0;
                  const canMatch = qtyMatches && !isAlreadyMatched;
                  
                  return (
                    <div 
                      key={it.id} 
                      className={`border-2 rounded-2xl p-5 flex justify-between items-center transition-all shadow-sm ${
                        isAlreadyMatched 
                          ? 'bg-green-50 border-green-300 opacity-60' 
                          : canMatch 
                            ? 'bg-white border-indigo-300 hover:shadow-lg group' 
                            : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black px-2.5 py-1 bg-slate-800 text-white rounded-lg uppercase tracking-tight">
                            {it.itemType}
                          </span>
                          <p className="font-black text-slate-900 text-base">{it.itemName}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500 font-medium">Qty Required:</p>
                            <span className="font-black text-indigo-700 text-sm">{it.quantity} hewan</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500 font-medium">Qty Selected:</p>
                            <span className={`font-black text-sm ${qtyMatches ? 'text-green-600' : 'text-red-600'}`}>
                              {inventoryIds.length} hewan
                            </span>
                          </div>
                          
                          {isAlreadyMatched && (
                            <span className="text-[9px] font-black px-2.5 py-1 bg-green-100 text-green-700 border border-green-300 rounded-lg uppercase tracking-tight flex items-center gap-1">
                              <CheckCircle2 size={11} /> Sudah Ada {it.allocationCount} Hewan Ter-match
                            </span>
                          )}
                        </div>
                        
                        {!qtyMatches && !isAlreadyMatched && (
                          <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-700 font-bold leading-relaxed">
                              Qty tidak sesuai! Item ini membutuhkan <strong>{it.quantity} hewan</strong>, 
                              tapi Anda memilih <strong>{inventoryIds.length} hewan</strong>.
                              {inventoryIds.length < it.quantity && " Tambah seleksi hewan di tabel farm."}
                              {inventoryIds.length > it.quantity && " Kurangi seleksi hewan di tabel farm."}
                            </p>
                          </div>
                        )}
                        
                        {isAlreadyMatched && (
                          <div className="mt-2 flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                            <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-green-700 font-bold leading-relaxed">
                              Item ini sudah memiliki hewan yang ter-match. Tidak bisa di-match ulang untuk menghindari duplikasi.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleMatch(it.id, it.quantity)}
                        disabled={isPending || !canMatch}
                        className={`px-6 py-3 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 ml-4 ${
                          canMatch && !isPending
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-900/20'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                        title={
                          isAlreadyMatched 
                            ? "Item sudah ter-match" 
                            : !qtyMatches 
                              ? "Qty tidak sesuai" 
                              : "Pasangkan hewan ke item ini"
                        }
                      >
                        {isPending ? (
                          <>
                            <Loader2 size={14} className="animate-spin"/>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16}/>
                            Pasangkan ke Sini
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
    </Modal>
  );
}
