"use client";

import { Modal } from "./Modal";
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from "lucide-react";
import { useState } from "react";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export function ImagePreviewModal({
  open,
  onClose,
  imageUrl,
  title = "Preview Gambar",
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageUrl.split("/").pop() || "image.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidthClassName="max-w-6xl"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm font-bold text-slate-700 min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 transition-all text-sm font-bold text-slate-700"
              title="Download"
            >
              <Download size={16} />
              Download
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-bold"
              title="Buka di tab baru"
            >
              <ExternalLink size={16} />
              Buka
            </a>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative bg-slate-100 rounded-xl overflow-hidden" style={{ maxHeight: "70vh" }}>
          <div className="overflow-auto custom-scrollbar" style={{ maxHeight: "70vh" }}>
            <div className="flex items-center justify-center p-8">
              <img
                src={imageUrl}
                alt="Preview"
                style={{
                  width: `${zoom}%`,
                  maxWidth: "none",
                  transition: "width 0.2s ease",
                }}
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 text-sm hover:bg-slate-50 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Modal>
  );
}
