"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Search, Link as LinkIcon, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";

export function MatchOrderModal({
  open,
  onClose,
  transactionId,
  onMatched,
}: {
  open: boolean;
  onClose: () => void;
  transactionId: number;
  onMatched: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setOrders([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api(`/api/orders/search?term=${searchTerm}`);
        setOrders(res);
      } catch (err) {
        console.error("Failed to search orders", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleMatch = async (orderId: number) => {
    setMatching(true);
    try {
      await api(`/api/transactions/match`, {
        method: "POST",
        json: { transactionId, orderId },
      });
      onMatched();
      onClose();
    } catch (err) {
      console.error("Failed to match transaction", err);
    } finally {
      setMatching(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Hubungkan ke Pesanan" maxWidthClassName="max-w-md">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            autoFocus
            type="text"
            placeholder="Cari Invoice atau Nama Pelanggan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
          {loading && (
            <div className="py-8 text-center text-slate-400 text-sm italic">Mencari...</div>
          )}
          {!loading && orders.length === 0 && searchTerm.length >= 3 && (
            <div className="py-8 text-center text-slate-400 text-sm">Pesanan tidak ditemukan.</div>
          )}
          {!loading && orders.length === 0 && searchTerm.length < 3 && (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <AlertCircle size={24} className="opacity-20" />
              Ketik minimal 3 karakter untuk mencari.
            </div>
          )}
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => handleMatch(order.id)}
              disabled={matching}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-blue-200 transition-all text-left"
            >
              <div>
                <div className="font-bold text-slate-800">{order.invoiceNumber}</div>
                <div className="text-xs text-slate-500">{order.customerName}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-xs font-black text-blue-600">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(order.grandTotal))}
                </div>
                <div className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {order.status}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </Modal>
  );
}
