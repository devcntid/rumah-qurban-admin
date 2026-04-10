"use client";

import { useState } from "react";
import Link from "next/link";
import { Link as LinkIcon, Eye, Unlink, Loader2, AlertCircle } from "lucide-react";
import { MatchOrderModal } from "@/components/transactions/MatchOrderModal";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";

export function LinkedOrderCard({ 
  transactionId, 
  orderId, 
  invoiceNumber 
}: { 
  transactionId: number;
  orderId: number | null;
  invoiceNumber?: string | null;
}) {
  const [showMatch, setShowMatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUnmatch = async () => {
    if (!confirm("Apakah Anda yakin ingin melepas hubungan transaksi ini dari pesanan?")) return;

    setLoading(true);
    try {
      await api(`/api/transactions/unmatch`, {
        method: "POST",
        json: { transactionId },
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to unmatch", err);
      alert("Gagal melepas hubungan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#102a43] text-white p-6 rounded-3xl shadow-lg border border-slate-800 transition-all hover:scale-[1.02]">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
            <LinkIcon size={14} className="text-blue-400"/> Pesanan Terkait
        </span>
        {orderId && (
            <button 
                onClick={handleUnmatch}
                disabled={loading}
                className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
               {loading ? <Loader2 size={10} className="animate-spin" /> : <Unlink size={10}/>}
               <span className="text-[8px]">UNLINK</span>
            </button>
        )}
      </h4>

      {invoiceNumber ? (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Nomor Invoice</p>
            <p className="text-xl font-black tracking-tight">{invoiceNumber}</p>
          </div>
          <Link 
            href={`/orders/${orderId}`}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl py-2.5 text-xs font-black transition-all"
          >
            <Eye size={14} /> Lihat Detail Pesanan
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <p className="text-xs font-bold text-red-400 leading-relaxed italic">
                  Transaksi ini belum terhubung dengan pesanan manapun (Standalone).
              </p>
          </div>
          <button 
            onClick={() => setShowMatch(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-black shadow-lg shadow-blue-900/40 transition-all active:scale-95"
          >
            <LinkIcon size={14} /> Hubungkan Pesanan
          </button>
        </div>
      )}

      <MatchOrderModal 
        open={showMatch}
        transactionId={transactionId}
        onClose={() => setShowMatch(false)}
        onMatched={() => router.refresh()}
      />
    </div>
  );
}
