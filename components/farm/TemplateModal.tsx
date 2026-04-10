"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { FileDown, Loader2 } from "lucide-react";

export function TemplateModal({
  open,
  onClose,
  onDownload,
  pens,
  vendors,
  variants,
}: {
  open: boolean;
  onClose: () => void;
  onDownload: (context: { 
    penId?: number; 
    vendorId?: number;
    animalVariantId?: number;
    quantity?: number;
  }) => void;
  pens: { id: number; name: string }[];
  vendors: { id: number; name: string }[];
  variants: { id: number; species: string; classGrade: string | null; weightRange: string | null }[];
}) {
  const [selectedPen, setSelectedPen] = useState<number | undefined>();
  const [selectedVendor, setSelectedVendor] = useState<number | undefined>();
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>();
  const [quantity, setQuantity] = useState<number>(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    // Simulate a brief delay for UI feedback
    setTimeout(() => {
      onDownload({ 
        penId: selectedPen, 
        vendorId: selectedVendor,
        animalVariantId: selectedVariant,
        quantity: quantity
      });
      setIsDownloading(false);
      onClose();
    }, 500);
  };

  return (
    <Modal open={open} onClose={onClose} title="Download Template Import" maxWidthClassName="max-w-md">
      <div className="space-y-6">
        <p className="text-xs text-slate-500 italic-muted">
          Pilih filter untuk menyesuaikan template data hewan yang akan Anda upload.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label="Pilih Kandang (Opsional)"
              placeholder="— Pilih —"
              options={pens.map((p) => ({ label: p.name, value: p.id }))}
              value={selectedPen}
              onChange={(val) => setSelectedPen(val as number)}
            />
            <SearchableSelect
              label="Pilih Vendor (Opsional)"
              placeholder="— Pilih —"
              options={vendors.map((v) => ({ label: v.name, value: v.id }))}
              value={selectedVendor}
              onChange={(val) => setSelectedVendor(val as number)}
            />
          </div>

          <SearchableSelect
            label="Pilih Varian (Opsional)"
            placeholder="— Pilih Varian —"
            options={variants.map((v) => ({ label: `${v.species} - ${v.classGrade} (${v.weightRange})`, value: v.id }))}
            value={selectedVariant}
            onChange={(val) => setSelectedVariant(val as number)}
          />

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Jumlah Baris (Qty)</label>
            <input 
              type="number" 
              min="1" 
              max="1000"
              className="w-full border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" 
              value={quantity} 
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex-1 bg-[#1e3a5f] text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <FileDown size={18} /> Download Excel
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
