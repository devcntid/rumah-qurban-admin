"use client";

import { useState } from "react";
import { Receipt, Clock, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { MatchTransactionModal } from "@/components/orders/MatchTransactionModal";

function formatIDR(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export function OrderTransactionsSection({
  orderId,
  initialTransactions,
}: {
  orderId: number;
  initialTransactions: any[];
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [openMatch, setOpenMatch] = useState(false);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock size={14} className="text-purple-500"/> Riwayat Pembayaran
        </h4>
        <button 
          onClick={() => setOpenMatch(true)}
          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
        >
          <LinkIcon size={12}/> Match
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar-light">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-4">
            <Receipt size={30}/>
            <p className="text-[10px] font-black uppercase mt-2 text-center leading-tight">Belum ada pembayaran<br/>tercatat</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <Link 
              key={tx.id} 
              href={`/transactions/${tx.id}`}
              className="relative pl-6 pb-4 last:pb-0 block group cursor-pointer"
            >
              <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-blue-500 shadow-md shadow-blue-500/20 transition-transform group-hover:scale-125"></div>
              <div className="absolute left-[3.5px] top-3 w-[1px] h-full bg-slate-100 last:hidden"></div>
              <div className="flex justify-between items-start transition-transform group-hover:translate-x-1">
                <div>
                  <p className="text-xs font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tight">{tx.transactionType}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5">{new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} • {tx.paymentMethodName || tx.paymentMethodCode || "Transfer"}</p>
                </div>
                <div className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs font-black text-green-600 font-mono tracking-tighter">{formatIDR(tx.amount)}</p>
                    <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">{tx.status}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <MatchTransactionModal 
        open={openMatch}
        orderId={orderId}
        onClose={() => setOpenMatch(false)}
        onMatched={() => window.location.reload()}
      />
    </div>
  );
}
