"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Link as LinkIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileDown,
  Calendar
} from "lucide-react";
import type { TransactionRow } from "@/lib/db/queries/transactions";
import { MatchOrderModal } from "@/components/transactions/MatchOrderModal";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { ImportTransactionModal } from "@/components/transactions/ImportTransactionModal";

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
};

const typeColors: Record<string, string> = {
  PELUNASAN: "bg-blue-100 text-blue-700 border-blue-200",
  DP: "bg-purple-100 text-purple-700 border-purple-200",
};

function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function TransactionList({
  initialData,
  total,
  currentPage = 1,
}: {
  initialData: TransactionRow[];
  total: number;
  currentPage?: number;
}) {
  const [data, setData] = useState(initialData);
  const [matchingTransaction, setMatchingTransaction] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleExport = () => {
    // Construct export URL with current filters from URL
    const params = new URLSearchParams(window.location.search);
    window.location.href = `/api/transactions/export?${params.toString()}`;
  };

  const handleDownloadTemplate = () => {
    window.location.href = "/api/transactions/template";
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="w-full md:w-auto flex-1 max-w-md">
          <form className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="search"
              type="text"
              defaultValue={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get("search") || ""}
              placeholder="Cari VA atau No. Invoice..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </form>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowAdd(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#102a43] text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg shadow-blue-900/20 hover:bg-slate-800 transition-all"
          >
            <Plus size={16} /> Transaksi
          </button>
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all"
          >
            <FileDown size={16} /> Ekspor
          </button>
          <button 
            onClick={() => setShowImport(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all"
          >
            <Upload size={16} /> Import
          </button>
          <button 
            onClick={handleDownloadTemplate}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-green-700 transition-all"
          >
            <Download size={16} /> Template
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <th className="p-5 font-bold tracking-wider w-12 text-center">#</th>
                <th className="p-5 font-bold tracking-wider">Waktu & Tipe</th>
                <th className="p-5 font-bold tracking-wider">No. VA / Invoice</th>
                <th className="p-5 font-bold tracking-wider">Metode & Nominal</th>
                <th className="p-5 font-bold tracking-wider text-center">Status</th>
                <th className="p-5 font-bold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {data.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 text-center text-[10px] font-black text-slate-400">
                    {(currentPage - 1) * 10 + i + 1}
                  </td>
                  <td className="p-5">
                    <div className="text-[10px] text-blue-600 font-black uppercase mb-1 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(t.transactionDate).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "long", year: "numeric"
                      })}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">
                      Dicatat: {new Date(t.createdAt).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${typeColors[t.transactionType] || "bg-slate-100 text-slate-600"}`}>
                      {t.transactionType}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="font-mono text-xs text-slate-500 mb-1">VA: {t.vaNumber ?? "-"}</div>
                    {t.invoiceNumber ? (
                      <div className="font-black text-[#102a43]">{t.invoiceNumber}</div>
                    ) : (
                      <button 
                        onClick={() => setMatchingTransaction(t.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-red-50 px-2 py-1 rounded-md border border-red-100"
                      >
                        <LinkIcon size={12} /> Hubungkan Pesanan
                      </button>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="text-xs font-semibold text-slate-600 mb-0.5">{t.paymentMethodName ?? t.paymentMethodCode}</div>
                    <div className="text-base font-black text-slate-800">{formatIDR(t.amount)}</div>
                  </td>
                  <td className="p-5 text-center">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[t.status] || "bg-slate-100 text-slate-600"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <Link
                      href={`/transactions/${t.id}`}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 text-[#102a43] px-3 py-1.5 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                      <Eye size={14} /> Detail
                    </Link>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <AlertCircle size={60}/>
                       <p className="text-lg font-bold">Belum ada transaksi ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {total > 0 && (
          <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">
              Menampilkan {data.length} dari {total} transaksi
            </div>
            <div className="flex gap-2">
              <button disabled className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <button disabled className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <MatchOrderModal 
        open={matchingTransaction !== null}
        transactionId={matchingTransaction ?? 0}
        onClose={() => setMatchingTransaction(null)}
        onMatched={() => window.location.reload()}
      />

      <AddTransactionModal 
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => window.location.reload()}
      />

      <ImportTransactionModal 
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => window.location.reload()}
      />
    </div>
  );
}
