"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Loader2, CheckCircle2, MapPin, Image as ImageIcon } from "lucide-react";
import { bulkAddTrackingToManifestAnimalsAction } from "@/lib/actions/logistics";
import { toast } from "sonner";

export function BulkTrackingModal({
  open,
  onClose,
  manifestAnimals,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  manifestAnimals: Array<{
    id: number;
    farmInventoryId: number;
    eartagId: string | null;
    generatedId: string | null;
  }>;
  onAdded: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    milestone: "",
    description: "",
    locationLat: "",
    locationLng: "",
    mediaUrl: "",
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === manifestAnimals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(manifestAnimals.map((a) => a.farmInventoryId));
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu hewan");
      return;
    }

    if (!formData.milestone.trim()) {
      toast.error("Milestone wajib diisi");
      return;
    }

    startTransition(async () => {
      const res = await bulkAddTrackingToManifestAnimalsAction({
        farmInventoryIds: selectedIds,
        milestone: formData.milestone,
        description: formData.description || undefined,
        locationLat: formData.locationLat || undefined,
        locationLng: formData.locationLng || undefined,
        mediaUrl: formData.mediaUrl || undefined,
      });

      if (res.success) {
        toast.success(`Tracking berhasil ditambahkan ke ${res.count} hewan`);
        setFormData({
          milestone: "",
          description: "",
          locationLat: "",
          locationLng: "",
          mediaUrl: "",
        });
        setSelectedIds([]);
        onAdded();
        onClose();
      } else {
        toast.error(res.error || "Gagal menambahkan tracking");
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Add Tracking ke Manifest"
      maxWidthClassName="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
          <p className="text-sm font-black text-indigo-900 mb-1">
            Tambah Tracking Massal
          </p>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Pilih hewan dari manifest ini yang ingin ditambahkan tracking-nya.
            Tracking yang sama akan diterapkan ke semua hewan yang dipilih.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
              Milestone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border-slate-300 rounded-lg p-3 text-sm font-bold outline-none border focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all shadow-sm"
              value={formData.milestone}
              onChange={(e) =>
                setFormData({ ...formData, milestone: e.target.value })
              }
              placeholder="Contoh: Berangkat dari Farm"
              maxLength={50}
            />
            <p className="text-[9px] text-slate-400 mt-1">
              {formData.milestone.length}/50 karakter
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
              Deskripsi
            </label>
            <textarea
              className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all shadow-sm"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Deskripsi detail tracking..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                Latitude
              </label>
              <input
                type="text"
                className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-indigo-400 transition-all shadow-sm"
                value={formData.locationLat}
                onChange={(e) =>
                  setFormData({ ...formData, locationLat: e.target.value })
                }
                placeholder="-6.200000"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                Longitude
              </label>
              <input
                type="text"
                className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-indigo-400 transition-all shadow-sm"
                value={formData.locationLng}
                onChange={(e) =>
                  setFormData({ ...formData, locationLng: e.target.value })
                }
                placeholder="106.816666"
              />
            </div>
          </div>

          <ImageUpload
            label="Upload Gambar (Opsional) - Berlaku untuk semua hewan terpilih"
            value={formData.mediaUrl}
            onChange={(url) => setFormData({ ...formData, mediaUrl: url || "" })}
            maxSize={5}
          />
        </div>

        {/* Animal Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">
              Pilih Hewan ({selectedIds.length} dari {manifestAnimals.length})
            </h4>
            <button
              onClick={selectAll}
              className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
            >
              {selectedIds.length === manifestAnimals.length
                ? "Batal Pilih Semua"
                : "Pilih Semua"}
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {manifestAnimals.map((animal) => (
              <div
                key={animal.id}
                onClick={() => toggleSelect(animal.farmInventoryId)}
                className={`flex items-center gap-3 p-3 bg-white border rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer ${
                  selectedIds.includes(animal.farmInventoryId)
                    ? "border-indigo-500 bg-indigo-50/30"
                    : "border-slate-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${
                    selectedIds.includes(animal.farmInventoryId)
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selectedIds.includes(animal.farmInventoryId) && (
                    <CheckCircle2 size={12} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-800 text-sm">
                    {animal.eartagId || "—"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {animal.generatedId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-slate-200 font-bold text-slate-500 text-xs hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            disabled={isPending || selectedIds.length === 0 || !formData.milestone.trim()}
            onClick={handleSubmit}
            className="bg-indigo-600 text-white px-10 py-2 rounded-xl font-black text-xs shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Tambah Tracking ({selectedIds.length})
              </>
            )}
          </button>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
