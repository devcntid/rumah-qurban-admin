import { notFound } from "next/navigation";
import Link from "next/link";
import { getTransactionById } from "@/lib/db/queries/transactions";
import { 
  ArrowLeft, Wallet, Receipt, Calendar, 
  Hash, Info, FileText, CheckCircle2, 
  User, Link as LinkIcon, Activity, Eye
} from "lucide-react";
import { ReceiptSection } from "./ReceiptSection";
import { LogSection } from "./LogSection";

import { LinkedOrderCard } from "./LinkedOrderCard";

function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
};

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transactionId = Number(id);
  if (!Number.isFinite(transactionId)) notFound();

  const transaction = await getTransactionById(transactionId);
  if (!transaction) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10 transition-all hover:shadow-md">
        <Link 
          href="/transactions" 
          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft size={20}/>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Detail Transaksi #{transaction.id}</h2>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${statusColors[transaction.status] || "bg-slate-100 text-slate-700"}`}>
              {transaction.status}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-1">
            <p className="text-blue-600 text-xs font-black uppercase flex items-center gap-1.5">
              <Calendar size={12}/> Tanggal: {new Date(transaction.transactionDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <p className="text-slate-400 text-[10px] font-bold uppercase flex items-center gap-1.5">
              Dicatat: {new Date(transaction.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-16 -mt-16"></div>
            <div className="relative space-y-6">
              <div className="flex items-center gap-3 text-blue-600">
                <Wallet size={24} />
                <h3 className="text-lg font-black uppercase tracking-tight">Informasi Pembayaran</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nominal Transaksi</label>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{formatIDR(transaction.amount)}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-wider">{transaction.transactionType}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Metode Pembayaran</label>
                  <p className="text-xl font-black text-slate-700">{transaction.paymentMethodName ?? (transaction.paymentMethodCode || "-")}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">Sistem VA / Manual Transfer</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tanggal Transaksi</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <p className="text-lg font-black text-slate-700 font-mono tracking-tight">
                      {new Date(transaction.transactionDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status Sistem</label>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className={transaction.status === 'PAID' ? 'text-green-500' : 'text-slate-300'} />
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{transaction.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Section (Receipts or Logs) */}
          <div className="space-y-4">
            {transaction.paymentMethodCategory === "MANUAL_TRANSFER" ? (
              <>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                  <FileText size={18} className="text-red-500" />
                  Bukti Transfer Pelanggan
                </h4>
                <ReceiptSection 
                  transactionId={transaction.id} 
                  initialReceipts={transaction.receipts} 
                  orderId={transaction.orderId}
                  transactionStatus={transaction.status}
                />
              </>
            ) : (
              <>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Activity size={18} className="text-blue-500" />
                  Logs Pembayaran Otomatis
                </h4>
                <LogSection logs={transaction.logs} />
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Relation */}
          <LinkedOrderCard 
            transactionId={transaction.id}
            orderId={transaction.orderId}
            invoiceNumber={transaction.invoiceNumber}
          />

          {/* Notes/Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info size={14} className="text-slate-400"/> Catatan Sistem
            </h4>
            <ul className="space-y-3">
                <li className="text-[11px] text-slate-500 font-medium leading-relaxed">• Pastikan nominal transfer sesuai dengan tagihan agar status dapat otomatis terverifikasi.</li>
                <li className="text-[11px] text-slate-500 font-medium leading-relaxed">• Verifikasi manual oleh admin diperlukan jika pelanggan mengunggah bukti transfer manual.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
