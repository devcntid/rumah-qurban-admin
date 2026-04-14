"use client";

import { useState, useTransition } from "react";
import { Upload, X, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { uploadOrdersAction, generateTemplateAction } from "@/lib/actions/order-upload";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UploadOrdersModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const handleDownloadTemplate = async () => {
    startTransition(async () => {
      try {
        const buffer = await generateTemplateAction();
        const blob = new Blob([buffer], { 
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Template_Upload_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Template berhasil diunduh");
      } catch (error) {
        toast.error("Gagal mengunduh template");
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    
    startTransition(async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await uploadOrdersAction(arrayBuffer);
        setPreview(result);
        
        if (result.success) {
          toast.success(`Berhasil upload ${result.insertedCount} orders`);
          router.refresh();
          onClose();
        } else {
          toast.warning(`${result.validCount} valid, ${result.invalidCount} error`);
        }
      } catch (error) {
        toast.error("Gagal memproses file Excel");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Upload size={24} />
            <h2 className="text-xl font-bold">Upload Orders Massal</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition" title="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Step 1: Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Download Template Excel
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Template sudah berisi contoh data dan format yang benar
            </p>
            <button
              onClick={handleDownloadTemplate}
              disabled={isPending}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Download size={16} />
              {isPending ? "Membuat Template..." : "Download Template"}
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="bg-slate-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              Upload File yang Sudah Diisi
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Pastikan data sudah sesuai dengan format template
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              title="Pilih file Excel untuk diupload"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
            {file && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                <CheckCircle size={16} />
                File terpilih: {file.name}
              </p>
            )}
          </div>

          {/* Preview Validation */}
          {preview && !preview.success && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle size={20} />
                Ditemukan {preview.invalidCount} Error
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {preview.errors.map((err: any, idx: number) => (
                  <div key={idx} className="bg-white border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-bold text-red-800 mb-1">Baris {err.row}:</p>
                    <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                      {err.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-sm text-green-700 mt-3">
                Data valid: {preview.validCount} baris
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            Batal
          </button>
          <button
            onClick={handleValidate}
            disabled={!file || isPending}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload & Process
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
