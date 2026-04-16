"use client";

import { ExternalLink } from "lucide-react";

type Props = {
  slaughterRecordId: number;
};

export function CertificatePreview({ slaughterRecordId }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">
          Sertifikat Qurban
        </span>
      </div>

      <a
        href={`/api/certificates/${slaughterRecordId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#102a43] text-white rounded-lg text-sm font-bold hover:bg-slate-800"
      >
        <ExternalLink size={16} />
        Lihat Sertifikat
      </a>
    </div>
  );
}
