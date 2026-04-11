"use client";

import { useState, useTransition, useEffect } from "react";
import { Search, Loader2, ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react";
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

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/orders/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      toast.error("Gagal mencari pesanan");
    } finally {
      setIsSearching(false);
    }
  };

  const handleMatch = async (orderItemId: number) => {
    startTransition(async () => {
      const res = await bulkAllocateAction(inventoryIds, orderItemId);
      if (res.success) {
        toast.success(`${inventoryIds.length} hewan berhasil dipasangkan massal`);
        onClose();
        setSelectedOrder(null);
        setOrders([]);
        setSearchQuery("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={`Pasangkan Massal (${inventoryIds.length} Hewan)`}
      maxWidthClassName="max-w-2xl"
    >
      <div className="space-y-6">
        {!selectedOrder ? (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 bg-slate-100 p-3 rounded-xl border border-slate-200">
              Cari pesanan (Invoice/Nama) untuk memasangkan {inventoryIds.length} hewan yang dipilih.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Invoice / Nama Pelanggan..." 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch}
                className="bg-[#102a43] text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-slate-800 transition-all active:scale-95"
              >
                Cari
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                </div>
              ) : orders.map(o => (
                <button 
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="w-full flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group text-left"
                >
                  <div>
                    <div className="font-black text-slate-800 text-sm leading-tight">{o.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{o.customerName} • {o.branchName}</div>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                    <CheckCircle2 size={16} />
                  </div>
                </button>
              ))}
              {!isSearching && searchQuery && orders.length === 0 && (
                <div className="py-12 text-center opacity-40">
                  <p className="text-sm font-black text-slate-400">Pesanan tidak ditemukan</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Pesanan Terpilih</p>
                <p className="font-black text-slate-800 text-base">{selectedOrder.invoiceNumber}</p>
                <p className="text-xs font-bold text-slate-600">{selectedOrder.customerName}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-xs font-black text-blue-600 hover:underline"
              >
                Ganti
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart size={14} className="text-indigo-500"/> Pilih Item untuk Dipasangkan
              </h4>
              <div className="space-y-2">
                {selectedOrder.items.map((it: any) => (
                  <div key={it.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:border-indigo-200 transition-all group shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 uppercase tracking-tight">
                          {it.itemType}
                        </span>
                        <p className="font-black text-slate-800 text-sm">{it.itemName}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                         <p className="text-[10px] text-slate-400 font-bold">Qty: {it.quantity}</p>
                         <p className="text-[10px] text-indigo-600 font-black uppercase">Varian yang dibutuhkan terdeteksi</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleMatch(it.id)}
                      disabled={isPending}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-900/10 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {isPending ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={14}/>}
                      Pasangkan ke Sini
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </Modal>
  );
}
