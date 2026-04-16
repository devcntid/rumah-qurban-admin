"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { 
  Plus, 
  FileDown, 
  FileUp, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Tag,
  Package,
  MapPin,
  ImageIcon
} from "lucide-react";
import { 
  saveCatalogOfferAction, 
  deleteCatalogOfferAction,
  bulkSaveCatalogAction 
} from "@/lib/actions/catalog";
import { Pagination } from "@/components/ui/Pagination";
import { FiltersBar, FilterField } from "@/components/ui/FiltersBar";
import { ImageUpload } from "@/components/ui/ImageUpload";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

export default function PricingClient({
  initialData,
  totalCount,
  branches,
  products,
  variants,
  vendors,
  page,
  pageSize,
}: {
  initialData: any[];
  totalCount: number;
  branches: any[];
  products: any[];
  variants: any[];
  vendors: any[];
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Handlers
  const handleOpenModal = (item: any = null) => {
    setSelectedItem(item);
    setFormData(item || { 
      isActive: true,
      price: 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    startTransition(async () => {
      const res = await saveCatalogOfferAction(formData);
      if (res.success) {
        toast.success(selectedItem ? "Penawaran diperbarui" : "Penawaran ditambahkan");
        setIsModalOpen(false);
      } else {
        if (res.fieldErrors) {
          const fieldErrors = res.fieldErrors as Record<string, string[]>;
          const errorMsg = Object.entries(fieldErrors)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
            .join(". ");
          toast.error("Gagal menyimpan", { description: errorMsg });
        } else {
          toast.error(res.error || "Gagal menyimpan data");
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus penawaran ini?")) return;
    startTransition(async () => {
      const res = await deleteCatalogOfferAction(id);
      if (res.success) {
        toast.success("Penawaran dihapus");
      } else {
        toast.error(res.error);
      }
    });
  };

  // Excel Logic
  const handleExport = () => {
    const data = initialData.map((item, index) => ({
      "NO": (page - 1) * pageSize + index + 1,
      "CABANG": item.branchName || "NASIONAL",
      "PRODUK": item.productName,
      "DISPLAY_NAME": item.displayName,
      "SKU_CODE": item.skuCode,
      "JENIS": item.species,
      "KELAS": item.classGrade,
      "RANGE_BERAT": item.offerWeightRange || item.weightRange,
      "PROYEKSI_BERAT": item.projectedWeight,
      "HARGA": Number(item.price),
      "SUB_TYPE": item.subType,
      "IMAGE_URL": item.imageUrl,
      "DECRIPT": item.description,
      "STATUS": item.isActive ? "AKTIF" : "NON-AKTIF"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Katalog Harga");
    XLSX.writeFile(wb, `Pricing_Catalog_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadTemplate = () => {
    const headers = [
      "ID", "CABANG_ID", "PRODUK_ID", "DISPLAY_NAME", "SKU_CODE", 
      "ANIMAL_VARIANT_ID", "SUB_TYPE", "WEIGHT_RANGE", "PROJECTED_WEIGHT", 
      "PRICE", "DESCRIPTION", "IMAGE_URL", "IS_ACTIVE"
    ];
    const data = [
      headers,
      ["", "1", "1", "Contoh Qurban Antar", "SKU-001", "1", "", "250-300kg", "300kg", "22000000", "Desc", "", "TRUE"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Pricing.xlsx");
  };

  const handleImport = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      
      setIsImporting(true);
      const offers = data.map(row => ({
        id: row.ID ? Number(row.ID) : undefined,
        branchId: row.CABANG_ID ? Number(row.CABANG_ID) : null,
        productId: Number(row.PRODUK_ID),
        displayName: String(row.DISPLAY_NAME),
        skuCode: row.SKU_CODE ? String(row.SKU_CODE) : null,
        animalVariantId: Number(row.ANIMAL_VARIANT_ID),
        subType: row.SUB_TYPE ? String(row.SUB_TYPE) : null,
        weightRange: row.WEIGHT_RANGE ? String(row.WEIGHT_RANGE) : null,
        projectedWeight: row.PROJECTED_WEIGHT ? String(row.PROJECTED_WEIGHT) : null,
        price: Number(row.PRICE),
        description: row.DESCRIPTION ? String(row.DESCRIPTION) : null,
        imageUrl: row.IMAGE_URL ? String(row.IMAGE_URL) : null,
        isActive: String(row.IS_ACTIVE).toLowerCase() === 'true'
      }));

      const res = await bulkSaveCatalogAction(offers);
      if (res.success) {
        toast.success(`Berhasil mengimport ${res.count} penawaran`);
      } else {
        toast.error(res.error);
      }
      setIsImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  // Filters
  const filterFields: FilterField[] = [
    { key: "q", label: "Cari Nama/SKU", type: "text", placeholder: "Cari..." },
    { 
      key: "branchId", 
      label: "Cabang", 
      type: "select", 
      options: [
        { label: "SEMUA CABANG / NASIONAL", value: "" },
        ...branches.map(b => ({ label: b.name, value: String(b.id) }))
      ]
    },
    { 
      key: "productCode", 
      label: "Produk", 
      type: "select", 
      options: [
        { label: "SEMUA PRODUK", value: "" },
        ...products.map(p => ({ label: p.name, value: p.code }))
      ]
    },
    {
      key: "species",
      label: "Jenis Hewan",
      type: "select",
      options: [
        { label: "SEMUA JENIS", value: "" },
        { label: "Sapi", value: "Sapi" },
        { label: "Domba", value: "Domba" },
        { label: "Kambing", value: "Kambing" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#102a43] tracking-tight flex items-center gap-2">
            <Tag className="text-blue-600" size={24} />
            Katalog Penawaran & Harga
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Kelola penawaran produk untuk setiap cabang serta kuota dan visual produk.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            <FileDown size={14} /> Template
          </button>
          <label className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer hover:bg-slate-50 transition-all">
            <FileUp size={14} /> Import
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
          </label>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
          >
            <FileDown size={14} /> Export
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 bg-[#102a43] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
          >
            <Plus size={14} /> Tambah Penawaran
          </button>
        </div>
      </div>

      <FiltersBar fields={filterFields} />

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200 font-black tracking-widest">
                <th className="px-6 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">Foto</th>
                <th className="px-6 py-4">Detail Penawaran</th>
                <th className="px-6 py-4">Cabang</th>
                <th className="px-6 py-4">Varian / Grade</th>
                <th className="px-6 py-4">Berat</th>
                <th className="px-6 py-4 text-right">Harga</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 relative">
              {isImporting && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                    <p className="font-black text-slate-700">Mengimport data...</p>
                  </div>
                </div>
              )}
              {initialData.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-center text-slate-600 font-mono">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    {item.imageUrl ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={item.imageUrl} alt={item.displayName} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-100 italic">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="font-black text-[#102a43] text-sm uppercase leading-tight">{item.displayName}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{item.productName}</span>
                        {item.skuCode && <span className="text-[10px] font-mono text-slate-500 font-bold">#{item.skuCode}</span>}
                        {item.subType && <span className="text-[10px] text-slate-400 font-medium italic italic">({item.subType})</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-600">
                      <MapPin size={12} className="text-slate-300" />
                      {item.branchName || "NASIONAL"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="font-bold text-[#102a43]">{item.species || "—"}</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase">{item.classGrade || "—"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                    <div>Range: <span className="font-bold">{item.offerWeightRange || item.weightRange || "—"}</span></div>
                    {item.projectedWeight && <div className="text-[10px] text-blue-500 font-bold">Proyeksi: {item.projectedWeight}</div>}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-[#102a43] text-sm tracking-tight">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(item.price))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      item.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {item.isActive ? "AKTIF" : "OFF"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-slate-300 group-hover:text-slate-400 transition-colors">
                      <button onClick={() => handleOpenModal(item)} className="hover:text-amber-600 transition-all hover:scale-110">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 transition-all hover:scale-110">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-32 text-center">
                    <Search size={64} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-black text-xl text-slate-500">Belum ada penawaran tersedia</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t bg-slate-50/50">
          <Pagination page={page} pageSize={pageSize} totalItems={totalCount} />
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedItem ? "Ubah Penawaran" : "Tambah Penawaran Baru"}
        maxWidthClassName="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-1">
          <div className="space-y-6">
            <h4 className="font-black text-xs text-blue-500 uppercase tracking-widest border-b border-blue-100 pb-2 flex items-center gap-2">
              <Package size={14} /> Informasi Dasar
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect 
                label="Produk"
                options={products.map(p => ({ label: p.name, value: p.id }))}
                value={formData.productId}
                onChange={val => setFormData({...formData, productId: val})}
              />
              <SearchableSelect 
                label="Varian Hewan"
                options={variants.map(v => ({ label: `${v.species} - ${v.classGrade} (${v.weightRange})`, value: v.id }))}
                value={formData.animalVariantId}
                onChange={val => setFormData({...formData, animalVariantId: val})}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Nama Penawaran (Display) <span className="text-red-500">*</span></label>
              <input type="text" className="full-input" value={formData.displayName || ""} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="Contoh: Qurban Antar Sapi Jawa A" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">SKU Code</label>
                <input type="text" className="full-input" value={formData.skuCode || ""} onChange={e => setFormData({...formData, skuCode: e.target.value})} placeholder="X-001" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Sub Type</label>
                <input type="text" className="full-input" value={formData.subType || ""} onChange={e => setFormData({...formData, subType: e.target.value})} placeholder="rendang/kornet/dll" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect 
                label="Cabang (Kosongkan jika Nasional)"
                options={[{ label: "NASIONAL", value: null }, ...branches.map(b => ({ label: b.name, value: b.id }))]}
                value={formData.branchId}
                onChange={val => setFormData({...formData, branchId: val})}
              />
              <SearchableSelect 
                label="Vendor"
                options={[{ label: "INTERNAL", value: null }, ...vendors.map(v => ({ label: v.name, value: v.id }))]}
                value={formData.vendorId}
                onChange={val => setFormData({...formData, vendorId: val})}
              />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2 flex items-center gap-2">
              <Tag size={14} /> Visual & Harga
            </h4>

            <ImageUpload 
              label="Foto Produk"
              value={formData.imageUrl}
              onChange={url => setFormData({...formData, imageUrl: url})}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Range Berat</label>
                <input type="text" className="full-input" value={formData.weightRange || ""} onChange={e => setFormData({...formData, weightRange: e.target.value})} placeholder="250-300kg" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Proyeksi Berat Akhir</label>
                <input type="text" className="full-input" value={formData.projectedWeight || ""} onChange={e => setFormData({...formData, projectedWeight: e.target.value})} placeholder="300kg" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Harga Jual (IDR) <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</div>
                <input type="number" className="full-input pl-10 font-mono text-blue-600 font-black" value={formData.price || 0} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <input type="checkbox" id="isActive" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
              <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">Status Aktif / Ditampilkan di Katalog</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
          <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all">Batal</button>
          <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-8 py-2.5 bg-[#102a43] text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/10 hover:bg-slate-800 disabled:opacity-50 transition-all uppercase tracking-widest">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {selectedItem ? "Simpan Perubahan" : "Simpan Penawaran"}
          </button>
        </div>
      </Modal>

      <style jsx>{`
        .full-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
        }
        .full-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}
