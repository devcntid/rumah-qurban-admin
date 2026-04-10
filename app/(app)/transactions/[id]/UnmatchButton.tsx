"use client";

import { useState } from "react";
import { Unlink, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";

export function UnmatchButton({ transactionId }: { transactionId: number }) {
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
    <button
      onClick={handleUnmatch}
      disabled={loading}
      className="mt-2 text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors flex items-center gap-1.5"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
      Lepas Hubungan
    </button>
  );
}
