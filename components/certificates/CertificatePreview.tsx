"use client";

import { useState, useTransition } from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { api, ApiException } from "@/lib/api/client";
import { toast } from "sonner";

type Props = {
  slaughterRecordId: number;
  certificateUrl: string | null;
  onGenerated?: (url: string) => void;
};

export function CertificatePreview({ slaughterRecordId, certificateUrl, onGenerated }: Props) {
  const [pending, start] = useTransition();
  const [currentUrl, setCurrentUrl] = useState(certificateUrl);

  const handleGenerate = () => {
    start(async () => {
      try {
        const data = await api<{ success: boolean; certificateUrl?: string }>(
          "/api/certificates/generate",
          {
            method: "POST",
            json: { slaughterRecordId },
          }
        );

        if (data.certificateUrl) {
          setCurrentUrl(data.certificateUrl);
          toast.success("Sertifikat berhasil dibuat");
          onGenerated?.(data.certificateUrl);
        }
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.message);
        } else {
          toast.error("Gagal membuat sertifikat");
        }
      }
    });
  };

  if (currentUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Sertifikat Qurban</span>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
          >
            <ExternalLink size={12} />
            Buka Sertifikat
          </a>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          <iframe
            src={currentUrl}
            className="w-full h-[400px]"
            title="Certificate Preview"
          />
        </div>
        <div className="flex gap-2">
          <a
            href={`${currentUrl}?print=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#102a43] text-white rounded-lg text-sm font-bold hover:bg-slate-800"
          >
            <FileText size={16} />
            Print Sertifikat
          </a>
          <button
            onClick={handleGenerate}
            disabled={pending}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {pending ? "Generating..." : "Regenerate"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50">
      <FileText size={40} className="mx-auto text-slate-300 mb-3" />
      <p className="text-sm text-slate-600 mb-4">
        Sertifikat belum dibuat untuk penyembelihan ini
      </p>
      <button
        onClick={handleGenerate}
        disabled={pending}
        className="flex items-center gap-2 mx-auto px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Membuat Sertifikat...
          </>
        ) : (
          <>
            <FileText size={16} />
            Buat Sertifikat
          </>
        )}
      </button>
    </div>
  );
}
