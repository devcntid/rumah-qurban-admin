"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Wallet, Link as LinkIcon, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import type { TransactionRow } from "@/lib/db/queries/transactions";

export function MatchTransactionModal({
  open,
  onClose,
  orderId,
  onMatched,
}: {
  open: boolean;
  onClose: () => void;
  orderId: number;
  onMatched: () => void;
}) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);

  const fetchStandalone = async () => {
    setLoading(true);
    try {
      const res = await api<TransactionRow[]>(`/api/transactions/standalone`);
      setTransactions(res);
    } catch (err) {
      console.error("Failed to fetch standalone transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchStandalone();
  }, [open]);

  const handleMatch = async (transactionId: number) => {
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
    <Modal open={open} onClose={onClose} title="Hubungkan Transaksi Standalone" maxWidthClassName="max-w-lg">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-slate-500 italic">Pilih transaksi yang belum terhubung ke pesanan manapun.</p>
            <button onClick={fetchStandalone} disabled={loading} className="text-blue-500 hover:text-blue-700 transition-colors">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
          {loading && (
            <div className="py-12 text-center text-slate-400 text-sm italic">Memuat transaksi...</div>
          )}
          {!loading && transactions.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                <AlertCircle size={32} className="opacity-20" />
                Semua transaksi sudah terhubung ke pesanan.
            </div>
          )}
          {transactions.map((tx) => (
            <button
              key={tx.id}
              onClick={() => handleMatch(tx.id)}
              disabled={matching}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-blue-200 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                    <Wallet size={20} />
                </div>
                <div>
                  <div className="font-black text-slate-800 tracking-tight">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {tx.paymentMethodName || tx.paymentMethodCode} • {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 font-mono text-[10px] text-slate-500">
                <div>VA: {tx.vaNumber || "-"}</div>
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                    <LinkIcon size={12} /> <span className="font-black uppercase tracking-widest">Connect</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest"
          >
            Batal
          </button>
        </div>
      </div>
    </Modal>
  );
}
