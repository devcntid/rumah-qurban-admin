"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";

export function ImportTransactionModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setResult({ success: true, count: data.count });
        onImported();
      } else {
        setResult({ success: false, error: data.error || "Gagal mengimpor data." });
      }
    } catch (err) {
      console.error(err);
      setResult({ success: false, error: "Terjadi kesalahan sistem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Rekening Koran (Excel)" maxWidthClassName="max-w-xl">
      <div className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 border-dashed text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
               <FileSpreadsheet className="text-green-600" size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Gunakan format Excel standar untuk mengunggah transaksi bank transfer manual.</p>
              <p className="text-[10px] text-slate-400 mt-1">Sistem akan membuat transaksi standalone jika ID Pesanan dikosongkan.</p>
            </div>
            <a 
              href="/api/transactions/template" 
              className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest"
              download
            >
              <Download size={14}/> Download Template
            </a>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group-hover:border-blue-300 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <Upload size={18} className="text-slate-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-600 truncate max-w-[200px]">
                    {file ? file.name : "Pilih file Excel..."}
                  </span>
                </div>
                <span className="text-[10px] font-black text-blue-600 uppercase">Browse</span>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-[#102a43] text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-blue-900/10 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Mulai Upload Transaksi
            </button>
          </div>
        ) : (
          <div className={`p-6 rounded-3xl border flex flex-col items-center gap-4 transition-all animate-in fade-in zoom-in duration-300 ${result.success ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
            {result.success ? (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-green-100">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-green-700">{result.count} Transaksi Berhasil Diimpor</p>
                  <p className="text-[10px] text-green-600 font-bold mt-1 uppercase">Selesai</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-red-100">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-red-700">Impor Gagal</p>
                  <p className="text-[10px] text-red-500 font-bold mt-1">{result.error}</p>
                </div>
              </>
            )}
            <button 
                onClick={() => {
                    setResult(null);
                    setFile(null);
                }}
                className="mt-2 text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest"
            >
                Ulangi / Kembali
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
