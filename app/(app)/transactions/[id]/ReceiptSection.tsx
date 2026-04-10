"use client";

import { useState } from "react";
import { Check, X, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { api } from "@/lib/api/client";
import { Modal } from "@/components/ui/Modal";
import type { PaymentReceiptRow } from "@/lib/db/queries/transactions";

export function ReceiptSection({
  transactionId,
  initialReceipts,
}: {
  transactionId: number;
  initialReceipts: PaymentReceiptRow[];
}) {
  const [receipts, setReceipts] = useState(initialReceipts);
  const [loading, setLoading] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleVerify = async (receiptId: number, status: "APPROVED" | "REJECTED") => {
    const notes = status === "REJECTED" ? prompt("Masukkan alasan penolakan:") : null;
    if (status === "REJECTED" && notes === null) return;

    setLoading(receiptId);
    try {
      await api(`/api/transactions/receipts/verify`, {
        method: "POST",
        json: { receiptId, status, notes },
      });
      // Refresh receipts
      const updated = receipts.map((r) =>
        r.id === receiptId
          ? { ...r, status, verifierNotes: notes, verifiedAt: new Date() }
          : r
      );
      setReceipts(updated);
    } catch (err) {
      console.error("Failed to verify receipt", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {receipts.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center">
          <Clock size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada bukti transfer diunggah</p>
        </div>
      ) : (
        receipts.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="md:w-1/3 bg-slate-50 p-4 flex flex-col items-center justify-center gap-3">
                <div className="relative group overflow-hidden rounded-xl border-2 border-slate-200 aspect-[3/4] w-full max-w-[150px]">
                  <img 
                    src={r.fileUrl} 
                    alt="Bukti Transfer" 
                    className="object-cover w-full h-full transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setSelectedImage(r.fileUrl)}
                      className="bg-white p-2.5 rounded-full text-slate-900 shadow-xl hover:scale-110 active:scale-95 transition-all"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diunggah {new Date(r.uploadedAt).toLocaleDateString("id-ID")}</p>
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight">Status Verifikasi</h5>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      r.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' : 
                      r.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : 
                      'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  {r.verifierNotes && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <AlertCircle size={12} /> Catatan Verifikator
                      </p>
                      <p className="text-xs text-red-700 font-bold italic">{r.verifierNotes}</p>
                    </div>
                  )}

                  {r.status === "PENDING" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerify(r.id, "APPROVED")}
                        disabled={loading !== null}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-green-900/10 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={14} /> Teruskan (Approve)
                      </button>
                      <button
                        onClick={() => handleVerify(r.id, "REJECTED")}
                        disabled={loading !== null}
                        className="flex-1 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                      >
                        <X size={14} /> Tolak Bukti
                      </button>
                    </div>
                  )}
                </div>

                {r.verifiedAt && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-4">
                    Selesai diverifikasi pada {new Date(r.verifiedAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Image Preview Modal */}
      <Modal 
        open={!!selectedImage} 
        onClose={() => setSelectedImage(null)} 
        title="Detail Bukti Transfer"
        maxWidthClassName="max-w-3xl"
      >
        <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center relative group">
          <img 
            src={selectedImage || ""} 
            alt="Bukti Transfer Berukuran Besar" 
            className="max-w-full max-h-[70vh] object-contain shadow-2xl"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a 
              href={selectedImage || ""} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white hover:bg-white/20 transition-all uppercase tracking-widest flex items-center gap-2"
            >
              <ExternalLink size={14} /> Buka di tab baru
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
