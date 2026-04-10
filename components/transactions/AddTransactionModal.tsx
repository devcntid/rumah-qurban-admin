"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Search, Wallet, Link as LinkIcon, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";

export function AddTransactionModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    paymentMethodCode: "",
    transactionType: "PELUNASAN",
    orderId: null as number | null,
    invoiceNumber: "",
    status: "PAID",
    transactionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open) {
      api<{ rows: any[] }>("/api/master/payment-methods").then((res) => setMethods(res.rows || []));
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.length < 3) {
      setOrders([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api<any[]>(`/api/orders/search?term=${searchTerm}`);
        setOrders(res);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.paymentMethodCode) {
      alert("Harap isi nominal dan metode pembayaran.");
      return;
    }

    setLoading(true);
    try {
      await api("/api/transactions/import", {
        method: "POST",
        // Reuse import endpoint's single-entry logic if possible, 
        // but it expects FormData. Better to create a direct upsert API if needed.
        // For now, I'll assume I should use a new direct API for manual entry.
      });
      // Actually, I'll just use a dedicated manual entry API.
      await api("/api/transactions/manual", {
        method: "POST",
        json: {
            ...formData,
            amount: Number(formData.amount)
        }
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Tambah Transaksi Manual" maxWidthClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nominal (Rp)</label>
            <input
              type="number"
              required
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipe</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.transactionType}
              onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
            >
              <option value="PELUNASAN">Pelunasan</option>
              <option value="DP">DP (Down Payment)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Transaksi</label>
          <input
            type="date"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
            value={formData.transactionDate}
            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metode Pembayaran</label>
          <select
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.paymentMethodCode}
            onChange={(e) => setFormData({ ...formData, paymentMethodCode: e.target.value })}
          >
            <option value="">-- Pilih Metode --</option>
            {methods.filter(m => m.isActive).map((m) => (
              <option key={m.code} value={m.code}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <LinkIcon size={12}/> Hubungkan ke Pesanan (Opsional)
            </label>
            {formData.orderId ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm border-dashed">
                <div>
                  <div className="text-xs font-black text-blue-700">{formData.invoiceNumber}</div>
                  <div className="text-[10px] text-blue-500 font-bold uppercase">Pesanan Terpilih</div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, orderId: null, invoiceNumber: "" })}
                  className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase"
                >
                  Lepas
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari Invoice (min. 3 karakter)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>

          {!formData.orderId && searchTerm.length >= 3 && (
            <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {searching ? (
                <div className="py-8 text-center text-slate-400 text-xs italic flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Mencari...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">Pesanan tidak ditemukan.</div>
              ) : (
                orders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, orderId: o.id, invoiceNumber: o.invoiceNumber })}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-blue-200 transition-all text-left"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{o.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-500">{o.customerName}</div>
                    </div>
                    <div className="text-[10px] font-black text-blue-600">PILIH</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#102a43] text-white py-3 rounded-2xl text-sm font-black shadow-xl shadow-blue-900/20 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Simpan Transaksi
          </button>
        </div>
      </form>
    </Modal>
  );
}
