"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  label = "Upload Gambar",
  accept = "image/*",
  maxSize = 5,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`Ukuran file maksimal ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload gagal");
      }

      const data = await response.json();
      
      if (data.url) {
        setPreviewUrl(data.url);
        onChange(data.url);
        toast.success("Gambar berhasil diupload");
      } else {
        throw new Error("URL tidak ditemukan");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal mengupload gambar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
          {label}
        </label>
      )}

      {previewUrl ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => window.open(previewUrl, "_blank")}
                className="p-2 bg-white rounded-lg hover:bg-slate-100 transition-all"
                title="Lihat ukuran penuh"
              >
                <ImageIcon size={20} className="text-slate-700" />
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-all"
                  title="Hapus gambar"
                >
                  <X size={20} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative w-full h-48 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 transition-all ${
            disabled || isUploading
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 size={40} className="animate-spin text-indigo-600" />
              <p className="text-sm font-bold text-indigo-600">Mengupload...</p>
            </>
          ) : (
            <>
              <Upload size={40} className="text-slate-400" />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">
                  Klik untuk upload gambar
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {accept} • Max {maxSize}MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
