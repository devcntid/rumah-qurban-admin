"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api/client";

type PaidResponse = {
  success: boolean;
  orderId: number;
  waSuccess: boolean;
  waError?: string;
};

export function PaidButton({
  transactionId,
  disabled,
}: {
  transactionId: number;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaidResponse | null>(null);
  const router = useRouter();

  const handlePaid = async () => {
    if (
      !confirm(
        "Tandai transaksi ini sebagai LUNAS?\n\nAksi ini akan:\n• Update status transaksi → PAID\n• Update status pesanan → FULL_PAID\n• Kirim notifikasi WhatsApp ke pelanggan"
      )
    )
      return;

    setLoading(true);
    try {
      const res = await api<PaidResponse>("/api/transactions/paid", {
        method: "POST",
        json: { transactionId },
      });
      setResult(res);
      router.refresh();
    } catch (err) {
      console.error("Failed to mark as paid", err);
      alert(err instanceof Error ? err.message : "Gagal memproses pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-green-100 text-green-700 border border-green-200">
          <CheckCircle2 size={14} /> LUNAS
        </span>
        {result.waSuccess ? (
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">
            <MessageCircle size={10} /> WA Terkirim
          </span>
        ) : (
          <span
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100"
            title={result.waError}
          >
            <AlertTriangle size={10} /> WA Gagal
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handlePaid}
      disabled={loading || disabled}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-green-900/20 transition-all active:scale-95"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <CheckCircle2 size={14} />
      )}
      {loading ? "Memproses..." : "Tandai Lunas"}
    </button>
  );
}
