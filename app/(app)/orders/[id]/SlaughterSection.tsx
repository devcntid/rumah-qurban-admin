"use client";

import { useState, useEffect, useRef } from "react";
import {
  Scissors,
  Plus,
  Calendar,
  MapPin,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { DocumentationPhoto } from "@/types/notifications";

type SlaughterableItem = {
  orderItemId: number;
  itemName: string;
  farmInventoryId: number | null;
  eartagId: string | null;
  hasSlaughterRecord: boolean;
  slaughterRecordId: number | null;
};

type SlaughterRecordDetail = {
  id: number;
  farmInventoryId: number;
  orderItemId: number;
  slaughteredAt: string;
  slaughterLocation: string | null;
  documentationPhotos: DocumentationPhoto[];
  certificateUrl: string | null;
  notes: string | null;
  performedBy: string | null;
};

export function SlaughterSection({ orderId }: { orderId: number }) {
  const [items, setItems] = useState<SlaughterableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [orderId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/slaughter-records?slaughterable=true&orderId=${orderId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (mountedRef.current) {
        setItems(data.items || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Memuat data penyembelihan...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">Gagal memuat data penyembelihan</span>
        </div>
        <p className="text-xs text-red-500 mb-3">{error}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
        >
          <RefreshCcw size={14} /> Coba lagi
        </button>
      </div>
    );
  }

  if (items.length === 0) return null;

  const slaughteredCount = items.filter((i) => i.hasSlaughterRecord).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 font-black text-sm text-slate-800 uppercase tracking-tight">
          <Scissors size={18} className="text-red-600" /> Penyembelihan
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              slaughteredCount === items.length
                ? "bg-green-100 text-green-700"
                : slaughteredCount > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {slaughteredCount}/{items.length} Tersembelih
          </span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="p-6 space-y-4">
          {items.map((item) => (
            <SlaughterItemRow
              key={`${item.orderItemId}-${item.farmInventoryId}`}
              item={item}
              onUpdated={loadData}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlaughterItemRow({
  item,
  onUpdated,
}: {
  item: SlaughterableItem;
  onUpdated: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<SlaughterRecordDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item.slaughterRecordId) {
      loadDetail();
    }
  }, [item.slaughterRecordId]);

  async function loadDetail() {
    if (!item.slaughterRecordId) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(
        `/api/slaughter-records?id=${item.slaughterRecordId}`
      );
      if (res.ok) {
        const data = await res.json();
        setDetail(data.record || null);
      }
    } catch {
      // silent
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item.farmInventoryId) {
      toast.error("Hewan belum dipasangkan ke item ini");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const payload = {
      farmInventoryId: item.farmInventoryId,
      orderItemId: item.orderItemId,
      slaughteredAt: fd.get("slaughteredAt") as string,
      slaughterLocation: fd.get("slaughterLocation") as string,
      notes: fd.get("notes") as string,
      performedBy: fd.get("performedBy") as string,
    };

    if (!payload.slaughteredAt) {
      toast.error("Tanggal penyembelihan wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/slaughter-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }
      const result = await res.json();
      const recordId = result.id;

      if (selectedFiles.length > 0 && recordId) {
        setUploadProgress(`Mengupload ${selectedFiles.length} foto...`);
        const photoFormData = new FormData();
        for (const file of selectedFiles) {
          photoFormData.append("photos", file);
        }
        const photoRes = await fetch(`/api/slaughter-records/${recordId}/photos`, {
          method: "POST",
          body: photoFormData,
        });
        if (!photoRes.ok) {
          toast.warning("Data tersimpan, tapi gagal upload foto. Coba upload ulang di halaman detail.");
        }
      }

      toast.success("Data penyembelihan berhasil disimpan");
      setShowForm(false);
      setSelectedFiles([]);
      setUploadProgress(null);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  if (!item.farmInventoryId) {
    return (
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
          <Scissors size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700">{item.itemName}</p>
          <p className="text-[10px] text-slate-400 font-medium">
            Hewan belum dipasangkan - pasangkan terlebih dahulu
          </p>
        </div>
      </div>
    );
  }

  if (item.hasSlaughterRecord && detail) {
    return (
      <div className="p-4 bg-green-50/50 rounded-xl border border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-black text-green-800">
                {item.itemName}
              </p>
              <span className="text-[9px] font-black bg-green-600 text-white px-2 py-0.5 rounded-full uppercase">
                Tersembelih
              </span>
            </div>
            <p className="text-[10px] text-green-600 font-bold">
              Eartag: {item.eartagId}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-green-700">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(detail.slaughteredAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {detail.slaughterLocation && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {detail.slaughterLocation}
                </div>
              )}
            </div>
            {detail.documentationPhotos.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-600 font-bold">
                <Camera size={12} />
                {detail.documentationPhotos.length} foto dokumentasi
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {item.slaughterRecordId && (
                <Link
                  href={`/slaughter/${item.slaughterRecordId}`}
                  className="text-[10px] font-black text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg border border-green-200 transition-colors"
                >
                  Lihat Detail
                </Link>
              )}
              {item.slaughterRecordId && (
                <a
                  href={`/api/certificates/${item.slaughterRecordId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                >
                  <ExternalLink size={10} />
                  Lihat Sertifikat
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (item.hasSlaughterRecord && loadingDetail) {
    return (
      <div className="p-4 bg-green-50/50 rounded-xl border border-green-200 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-green-600" />
        <span className="text-sm text-green-600 font-medium">Memuat detail...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Scissors size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700">{item.itemName}</p>
          <p className="text-[10px] text-slate-400 font-medium">
            Eartag: {item.eartagId} - Belum disembelih
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black hover:bg-red-700 transition-colors"
        >
          <Plus size={12} /> Catat Penyembelihan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Tanggal Penyembelihan *
              </label>
              <input
                type="datetime-local"
                name="slaughteredAt"
                required
                title="Tanggal Penyembelihan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Lokasi Penyembelihan
              </label>
              <input
                type="text"
                name="slaughterLocation"
                placeholder="Contoh: Desa Dukuhturi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Dilakukan oleh
              </label>
              <input
                type="text"
                name="performedBy"
                placeholder="Nama juru sembelih"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Catatan
              </label>
              <input
                type="text"
                name="notes"
                placeholder="Catatan tambahan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Foto Dokumentasi
            </label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-red-300 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                title="Pilih foto dokumentasi"
              />
              <div className="flex flex-col items-center gap-1.5 text-slate-400">
                <Upload size={20} />
                <span className="text-xs font-bold">Klik untuk pilih foto atau drop file di sini</span>
                <span className="text-[10px]">JPG, PNG (maks beberapa foto)</span>
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative group">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                      <ImageIcon size={20} className="text-slate-300" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        title="Hapus foto"
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-0.5 max-w-[64px] truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className="flex items-center gap-2 text-xs text-amber-600 font-bold">
              <Loader2 size={12} className="animate-spin" />
              {uploadProgress}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setSelectedFiles([]); }}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Simpan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
