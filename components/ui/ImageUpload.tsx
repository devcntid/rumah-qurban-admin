"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadCatalogImageAction } from "@/lib/actions/catalog";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side validation
    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await uploadCatalogImageAction(formData);
      if (res.success && res.url) {
        onChange(res.url);
        toast.success("Gambar berhasil diunggah");
      } else {
        toast.error(res.error || "Gagal mengunggah gambar");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Terjadi kesalahan sistem saat mengunggah");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {value ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-slate-400 hover:text-blue-500"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <div className="p-3 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors">
                  <ImageIcon size={24} />
                </div>
                <div className="text-xs font-bold">Klik untuk unggah foto</div>
                <div className="text-[10px] opacity-60">JPG, PNG maks 5MB</div>
              </>
            )}
          </button>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
