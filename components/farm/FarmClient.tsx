"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TemplateModal } from "./TemplateModal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { 
  Plus, 
  Layers, 
  FileDown, 
  FileUp, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Box,
  MapPin,
  CheckCircle2,
  Eye
} from "lucide-react";
import Link from "next/link";
import { 
  saveInventoryAction, 
  bulkSaveInventoryAction, 
  deleteInventoryAction,
  savePenAction,
  deletePenAction,
  patchEartagAction
} from "@/lib/actions/farm";
import { bulkAllocateAction } from "@/lib/actions/allocations";
import { BulkMatchModal } from "./BulkMatchModal";
import { Pagination } from "@/components/ui/Pagination";
import { FiltersBar, FilterField } from "@/components/ui/FiltersBar";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type Tab = "inventory" | "pens";
function InlineEartagEdit({ 
  id, 
  value, 
  onSave 
}: { 
  id: number; 
  value: string; 
  onSave: (id: number, newValue: string) => Promise<{ success: boolean; error?: string }> 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = async () => {
    if (currentValue === value) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await onSave(id, currentValue);
      if (res?.success) {
        toast.success("Tag ID berhasil diperbarui");
        setIsEditing(false);
      } else {
        toast.error(res?.error || "Gagal menyimpan Tag ID");
      }
    } catch (error) {
      console.error("Failed to save eartag:", error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative flex items-center">
        <input
          autoFocus
          type="text"
          className="w-28 px-2 py-1 bg-white border-2 border-blue-500 rounded-md text-xs font-mono font-bold outline-none shadow-sm"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
        />
        {isSaving && (
          <div className="absolute right-1">
            <Loader2 size={12} className="animate-spin text-blue-500" />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group relative flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-100 rounded-md border border-slate-200 hover:border-blue-300 text-xs font-mono font-bold text-[#102a43] transition-all shadow-sm"
      title="Click to edit Tag ID"
    >
      <span>{value}</span>
      <Pencil size={11} className="text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
      {isSaving && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-md">
          <Loader2 size={12} className="animate-spin text-blue-500" />
        </div>
      )}
    </button>
  );
}

export default function FarmClient({
  initialData,
  totalCount,
  vendors,
  pens,
  variants,
  branches,
  branchId,
  page,
  pageSize,
}: {
  initialData: any[];
  totalCount: number;
  vendors: any[];
  pens: any[];
  variants: any[];
  branches: any[];
  branchId: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [isPending, startTransition] = useTransition();
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPenModalOpen, setIsPenModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPen, setSelectedPen] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkMatchOpen, setIsBulkMatchOpen] = useState(false);

  // Single Form State
  const [formData, setFormData] = useState<any>({});
  const [penFormData, setPenFormData] = useState<any>({});

  // Bulk Form State
  const [bulkQty, setBulkQty] = useState(1);
  const [commonBulk, setCommonBulk] = useState<any>({
    branchId,
    status: "AVAILABLE",
    acquisitionType: "MANDIRI",
    initialProductType: "QURBAN ANTAR",
  });

  // HANDLERS - INVENTORY
  const handleOpenModal = (item: any = null) => {
    setSelectedItem(item);
    setFormData(item || { 
      branchId, 
      status: "AVAILABLE",
      acquisitionType: "MANDIRI",
      initialProductType: "QURBAN ANTAR",
      entryDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    startTransition(async () => {
      const res = await saveInventoryAction(formData);
      if (res.success) {
        toast.success(selectedItem ? "Data inventaris diperbarui" : "Data inventaris ditambahkan");
        setIsModalOpen(false);
        router.refresh();
      } else {
        if (res.fieldErrors) {
          const errorMsg = Object.entries(res.fieldErrors)
            .map(([field, msgs]) => `${msgs.join(", ")}`)
            .join(". ");
          toast.error("Gagal menyimpan", { description: errorMsg });
        } else {
          toast.error(res.error || "Gagal menyimpan data");
        }
      }
    });
  };

  const handleBulkSave = async () => {
    startTransition(async () => {
      const items = Array.from({ length: bulkQty }).map((_, i) => ({
        eartagId: `TEMP-${Date.now()}-${i}`,
      }));
      await bulkSaveInventoryAction(commonBulk, items);
      toast.success(`${bulkQty} record hewan berhasil digenerate`);
      setIsBulkModalOpen(false);
      router.refresh();
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data ini?")) return;
    startTransition(async () => {
      await deleteInventoryAction(id);
      toast.success("Data inventaris dihapus");
      router.refresh();
    });
  };

  // HANDLERS - PENS
  const handleOpenPenModal = (pen: any = null) => {
    setSelectedPen(pen);
    setPenFormData(pen || { branchId, name: "" });
    setIsPenModalOpen(true);
  };

  const handleSavePen = async () => {
    if (!penFormData.name) return alert("Nama kandang wajib diisi");
    startTransition(async () => {
      await savePenAction(penFormData);
      toast.success(selectedPen ? "Data kandang diperbarui" : "Kandang baru ditambahkan");
      setIsPenModalOpen(false);
      router.refresh();
    });
  };

  const handleDeletePen = async (id: number) => {
    if (!confirm("Hapus kandang ini?")) return;
    startTransition(async () => {
      await deletePenAction(id);
      toast.success("Kandang berhasil dihapus");
      router.refresh();
    });
  };

  const handleSelectItem = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === initialData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialData.map(i => i.id));
    }
  };

  // EXCEL LOGIC
  const handleExport = () => {
    const data = initialData.map((item, index) => ({
      "NO": (page - 1) * pageSize + index + 1,
      "generated_id": item.generatedId,
      "farm_animal_id": item.farmAnimalId,
      "eartag_id": item.eartagId,
      "branch_id": item.branchId,
      "vendor_id": item.vendorId,
      "vendor_name": item.vendorName,
      "animal_variant_id": item.animalVariantId,
      "species": item.species,
      "class_grade": item.classGrade,
      "weight_range": item.weightRange,
      "status": item.status,
      "entry_date": item.entryDate,
      "exit_date": item.exitDate,
      "acquisition_type": item.acquisitionType,
      "initial_product_type": item.initialProductType,
      "pen_id": item.penId,
      "pen_name": item.penName,
      "pan_name": item.panName,
      "initial_weight": item.initialWeight,
      "initial_weight_source": item.initialWeightSource,
      "weight_actual": item.weightActual,
      "horn_type": item.hornType,
      "purchase_price": item.purchasePrice,
      "price_per_kg": item.pricePerKg,
      "shipping_cost": item.shippingCost,
      "total_hpp": item.totalHpp,
      "initial_type": item.initialType,
      "final_type": item.finalType,
      "photo_url": item.photoUrl,
      "order_item_id": item.orderItemId,
      "created_at": item.createdAt
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventaris Farm");
    XLSX.writeFile(wb, `Inventaris_Farm_Full_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const executeDownloadTemplate = (context: { 
    penId?: number; 
    vendorId?: number; 
    animalVariantId?: number; 
    quantity?: number;
  }) => {
    const qty = context.quantity || 1;
    
    // Find Names for ID Helpers (Yellow Columns)
    const pen = pens.find(p => p.id === context.penId);
    const vendor = vendors.find(v => v.id === context.vendorId);
    const variant = variants.find(v => v.id === context.animalVariantId);

    const headers = [
      "TAG_ID", 
      "GENERATED_ID",
      "FARM_ANIMAL_ID",
      "STATUS",
      "ANIMAL_VARIANT_ID", 
      "VARIANT_NAME", 
      "BRANCH_ID",
      "VENDOR_ID", 
      "VENDOR_NAME", 
      "PEN_ID", 
      "PEN_NAME", 
      "PAN_NAME",
      "ACQUISITION_TYPE", 
      "INITIAL_PRODUCT_TYPE", 
      "ENTRY_DATE",
      "EXIT_DATE",
      "INITIAL_WEIGHT",
      "INITIAL_WEIGHT_SOURCE",
      "WEIGHT_ACTUAL",
      "HORN_TYPE",
      "PURCHASE_PRICE", 
      "PRICE_PER_KG",
      "SHIPPING_COST",
      "TOTAL_HPP",
      "INITIAL_TYPE",
      "FINAL_TYPE",
      "PHOTO_URL",
      "ORDER_ITEM_ID"
    ];

    const rows = Array.from({ length: qty }).map(() => [
      "", // tag_id
      "", // generated_id
      "", // farm_animal_id
      "AVAILABLE",
      context.animalVariantId || "", 
      variant ? `${variant.species} - ${variant.classGrade} (${variant.weightRange})` : "",
      branchId,
      context.vendorId || "", 
      vendor?.name || "", 
      context.penId || "", 
      pen?.name || "", 
      "", // pan_name
      "MANDIRI", 
      "QURBAN ANTAR", 
      new Date().toISOString().split('T')[0],
      "", // exit_date
      "", // initial_weight
      "", // weight_source
      "", // weight_actual
      "TANDUK", 
      "", // purchase_price
      "", // price_per_kg
      "", // shipping_cost
      "", // total_hpp
      "", // initial_type
      "", // final_type
      "", // photo_url
      "" // order_item_id
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Upload");
    XLSX.writeFile(wb, "Template_Inventory_Full.xlsx");
    toast.success(`Template dengan ${qty} baris berhasil di-generate`);
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
      const data: any[] = XLSX.utils.sheet_to_json(ws); // Header is now in the first row (index 0)
      
      let importedCount = 0;
      let errorCount = 0;
      const rowErrors: string[] = [];
      setIsImporting(true);

      startTransition(async () => {
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const payload = {
            id: row.ID || row.id || undefined,
            branchId: Number(row.BRANCH_ID || row.branch_id || branchId),
            generatedId: String(row.GENERATED_ID || row.generated_id || ""),
            farmAnimalId: String(row.FARM_ANIMAL_ID || row.farm_animal_id || ""),
            eartagId: String(row.TAG_ID || row.EARTAG_ID || row.eartag_id || ""),
            animalVariantId: Number(row.ANIMAL_VARIANT_ID || row.animal_variant_id || ""),
            vendorId: row.VENDOR_ID || row.vendor_id ? Number(row.VENDOR_ID || row.vendor_id) : null,
            entryDate: row.ENTRY_DATE || row.entry_date || null,
            acquisitionType: row.ACQUISITION_TYPE || row.acquisition_type || null,
            initialProductType: row.INITIAL_PRODUCT_TYPE || row.initial_product_type || null,
            penId: row.PEN_ID || row.pen_id ? Number(row.PEN_ID || row.pen_id) : null,
            panName: row.PAN_NAME || row.pan_name || null,
            purchasePrice: row.PURCHASE_PRICE || row.purchase_price || null,
            initialWeightSource: row.INITIAL_WEIGHT_SOURCE || row.initial_weight_source || null,
            pricePerKg: row.PRICE_PER_KG || row.price_per_kg || null,
            shippingCost: row.SHIPPING_COST || row.shipping_cost || null,
            totalHpp: row.TOTAL_HPP || row.total_hpp || null,
            hornType: row.HORN_TYPE || row.horn_type || null,
            initialWeight: row.INITIAL_WEIGHT || row.initial_weight || null,
            initialType: row.INITIAL_TYPE || row.initial_type || null,
            finalType: row.FINAL_TYPE || row.final_type || null,
            weightActual: row.WEIGHT_ACTUAL || row.weight_actual || null,
            photoUrl: row.PHOTO_URL || row.photo_url || null,
            status: row.STATUS || row.status || "AVAILABLE",
            orderItemId: row.ORDER_ITEM_ID || row.order_item_id ? Number(row.ORDER_ITEM_ID || row.order_item_id) : null,
            exitDate: row.EXIT_DATE || row.exit_date || null,
          };

          const res = await saveInventoryAction(payload);
          if (res.success) {
            importedCount++;
          } else {
            errorCount++;
            const msg = res.fieldErrors 
              ? Object.values(res.fieldErrors).flat().join(", ")
               : res.error;
            rowErrors.push(`Brs ${i + 2}: ${msg}`);
          }
        }
        
        if (errorCount > 0) {
          toast.warning(`Import selesai: ${importedCount} berhasil, ${errorCount} gagal.`, {
            description: rowErrors.slice(0, 3).join(" | ") + (rowErrors.length > 3 ? " ..." : "")
          });
        } else {
          toast.success(`Berhasil mengimport ${importedCount} data hewan.`);
        }
        setIsImporting(false);
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset input
  };

  const filterFields: FilterField[] = [
    { key: "search", label: "Cari (Tag/Farm ID)", type: "text", placeholder: "Cari..." },
    { 
      key: "vendorId", 
      label: "Vendor", 
      type: "select", 
      options: vendors.map(v => ({ label: v.name, value: String(v.id) })) 
    },
    { 
      key: "penId", 
      label: "Kandang", 
      type: "select", 
      options: pens.map(p => ({ label: p.name, value: String(p.id) })) 
    },
  ];

  return (
    <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-[#102a43] tracking-tight">
              {activeTab === "inventory" ? "Inventaris Farm" : "Daftar Kandang"}
            </h2>
            <div className="flex p-0.5 bg-slate-200/50 rounded-xl">
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "inventory" ? "bg-white text-[#102a43] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Inventaris
              </button>
              <button
                onClick={() => setActiveTab("pens")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "pens" ? "bg-white text-[#102a43] shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Kandang
              </button>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium">
            {activeTab === "inventory" ? "Monitoring data hewan, bobot tumpuan, dan tracking HPP." : "Kelola daftar kandang setiap cabang."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === "inventory" ? (
            <>
              <button 
                onClick={() => setIsTemplateModalOpen(true)}
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
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all"
              >
                <Layers size={14} /> Bulk
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-1.5 bg-[#102a43] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
              >
                <Plus size={14} /> Tambah
              </button>
            </>
          ) : (
            <button 
              onClick={() => handleOpenPenModal()}
              className="flex items-center gap-1.5 bg-[#102a43] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
            >
              <Plus size={14} /> Tambah Kandang
            </button>
          )}
        </div>
      </div>

      {activeTab === "inventory" ? (
        <>
          <FiltersBar fields={filterFields} />

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="overflow-x-auto min-h-[400px] scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[1800px]">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-bold w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.length > 0 && selectedIds.length === initialData.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 font-bold w-12 text-center">No</th>
                    <th className="px-4 py-3 font-bold">Generated ID</th>
                    <th className="px-4 py-3 font-bold">Farm Animal ID</th>
                    <th className="px-4 py-3 font-bold">Tag ID (Eartag)</th>
                    <th className="px-4 py-3 font-bold">Varian</th>
                    <th className="px-4 py-3 font-bold">Vendor</th>
                    <th className="px-4 py-3 font-bold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-bold whitespace-nowrap">Tgl Masuk</th>
                    <th className="px-4 py-3 font-bold whitespace-nowrap">Tgl Keluar</th>
                    <th className="px-4 py-3 font-bold">Pengadaan</th>
                    <th className="px-4 py-3 font-bold">Produk Awal</th>
                    <th className="px-4 py-3 font-bold">Kandang</th>
                    <th className="px-4 py-3 font-bold">No Pen (Pan)</th>
                    <th className="px-4 py-3 font-bold text-right">Bobot Awal</th>
                    <th className="px-4 py-3 font-bold text-right">Bobot Sumber</th>
                    <th className="px-4 py-3 font-bold text-right">Berat Actual</th>
                    <th className="px-4 py-3 font-bold">Tanduk</th>
                    <th className="px-4 py-3 font-bold text-right">Harga Beli</th>
                    <th className="px-4 py-3 font-bold text-right">Harga/kg</th>
                    <th className="px-4 py-3 font-bold text-right">Ongkir</th>
                    <th className="px-4 py-3 font-bold text-right">Total HPP</th>
                    <th className="px-4 py-3 font-bold">Initial Type</th>
                    <th className="px-4 py-3 font-bold">Final Type</th>
                    <th className="px-4 py-3 font-bold">Photo URL</th>
                    <th className="px-4 py-3 font-bold">Order Item ID</th>
                    <th className="px-4 py-3 font-bold">Dibuat</th>
                    <th className="px-4 py-3 font-bold text-right sticky right-0 bg-slate-50">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 relative">
                  {isImporting && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center min-h-[400px]">
                      <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                        <Loader2 size={40} className="animate-spin text-blue-600" />
                        <p className="font-black text-slate-700 animate-pulse">Memproses Data Import...</p>
                      </div>
                    </div>
                  )}
                  {initialData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          disabled={item.status === 'ALLOCATED' || item.orderItemId}
                          title={item.status === 'ALLOCATED' || item.orderItemId ? 'Hewan sudah ter-match dengan order' : 'Pilih hewan'}
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-black text-[#102a43] text-xs leading-tight">{item.generatedId}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 text-xs">{item.farmAnimalId || "—"}</td>
                      <td className="px-4 py-3">
                        <InlineEartagEdit 
                          id={item.id} 
                          value={item.eartagId} 
                          onSave={async (id, val) => {
                            return await patchEartagAction(id, val);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-black text-[#102a43] leading-tight">{item.species}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.classGrade} ({item.weightRange})</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600">{item.vendorName || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border tracking-tight ${
                            item.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' : 
                            item.status === 'ALLOCATED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                          {(item.status === 'ALLOCATED' || item.orderItemId) && (
                            <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-full uppercase tracking-tight flex items-center gap-0.5">
                              <CheckCircle2 size={8} /> Matched
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium whitespace-nowrap">
                        {item.entryDate ? new Date(item.entryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium whitespace-nowrap">
                        {item.exitDate ? new Date(item.exitDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-emerald-700 italic">{item.acquisitionType || "—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-indigo-700">{item.initialProductType || "—"}</td>
                      <td className="px-4 py-3 text-xs font-black text-indigo-700 leading-tight">{item.penName || "—"}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">{item.panName || "—"}</td>
                      <td className="px-4 py-3 text-right font-black text-[#102a43] text-xs">{item.initialWeight || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600 text-xs">{item.initialWeightSource || "—"}</td>
                      <td className="px-4 py-3 text-right font-black text-blue-700 text-xs">{item.weightActual || "—"}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-600">{item.hornType || "—"}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-700 text-xs">
                        {item.purchasePrice ? new Intl.NumberFormat('id-ID').format(Number(item.purchasePrice)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 text-xs">
                        {item.pricePerKg ? new Intl.NumberFormat('id-ID').format(Number(item.pricePerKg)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 text-xs">
                        {item.shippingCost ? new Intl.NumberFormat('id-ID').format(Number(item.shippingCost)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-[#102a43] text-xs">
                        {item.totalHpp ? new Intl.NumberFormat('id-ID').format(Number(item.totalHpp)) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic lowercase">{item.initialType || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 italic lowercase">{item.finalType || "—"}</td>
                      <td className="px-4 py-3 text-[10px] text-blue-500 truncate max-w-[100px]">{item.photoUrl || "—"}</td>
                      <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">{item.orderItemId || "—"}</td>
                      <td className="px-4 py-3 text-[9px] text-slate-600 whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 transition-colors border-l border-slate-100">
                        <div className="flex justify-end gap-2 text-slate-300 group-hover:text-slate-400 transition-colors">
                          <Link href={`/farm/${item.id}`} className="hover:text-indigo-600 transition-all hover:scale-110" title="Lihat Detail & Tracking">
                            <Eye size={15} />
                          </Link>
                          <button onClick={() => handleOpenModal(item)} className="hover:text-amber-600 transition-all hover:scale-110" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 transition-all hover:scale-110" title="Hapus">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {initialData.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Search size={64} className="text-slate-300" />
                          <p className="font-black text-xl text-slate-500 tracking-tight">Tidak ada data ditemukan</p>
                        </div>
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
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] uppercase text-slate-500 border-b border-slate-200">
                  <th className="p-5 font-bold w-20 text-center">ID</th>
                  <th className="p-5 font-bold">Nama Kandang</th>
                  <th className="p-5 font-bold">Cabang</th>
                  <th className="p-5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {pens.map((pen) => (
                  <tr key={pen.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5 text-center text-slate-400 font-mono text-xs">{pen.id}</td>
                    <td className="p-5 font-black text-[#102a43]">{pen.name}</td>
                    <td className="p-5 font-bold text-indigo-600">
                      {branches.find(b => b.id === pen.branchId)?.name || pen.branchId}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-3 text-slate-300 group-hover:text-slate-400">
                        <button onClick={() => handleOpenPenModal(pen)} className="hover:text-amber-600 transition-all hover:scale-110">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDeletePen(pen.id)} className="hover:text-red-500 transition-all hover:scale-110">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pens.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <MapPin size={64} className="text-slate-300" />
                        <p className="font-black text-xl text-slate-500 tracking-tight">Belum ada data kandang</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      
      {/* TEMPLATE MODAL */}
      <TemplateModal 
        open={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)}
        onDownload={executeDownloadTemplate}
        pens={pens}
        vendors={vendors}
        variants={variants}
      />

      {/* BULK MATCH MODAL */}
      <BulkMatchModal 
        open={isBulkMatchOpen} 
        onClose={() => {
          setIsBulkMatchOpen(false);
          setSelectedIds([]);
        }}
        inventoryIds={selectedIds}
      />

      {/* FLOATING ACTION BAR FOR SELECTION */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#102a43] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Terpilih</span>
              <span className="text-sm font-black">{selectedIds.length} Hewan</span>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsBulkMatchOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95"
              >
                <CheckCircle2 size={16} /> Pasangkan ke Order
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ENTRY INVENTORY MODAL */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedItem ? "Ubah Data Inventaris" : "Tambah Data Inventaris Satuan"}
        maxWidthClassName="max-w-6xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-1">
          {/* SEKSI 1: IDENTITAS */}
          <div className="space-y-4">
            <h4 className="font-black text-xs text-blue-500 uppercase tracking-widest border-b border-blue-100 pb-1.5">Identitas</h4>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">ID Tag (Eartag) <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border-slate-300 rounded-lg p-3 text-sm font-bold outline-none border focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all shadow-sm" value={formData.eartagId || ""} onChange={e => setFormData({...formData, eartagId: e.target.value})} placeholder="TAG-XXX" required />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Farm Animal ID</label>
              <input type="text" className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-blue-400 transition-all shadow-sm" value={formData.farmAnimalId || ""} onChange={e => setFormData({...formData, farmAnimalId: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Generated ID</label>
              <input type="text" className="w-full bg-slate-50 border-slate-200 rounded-lg p-3 text-sm font-mono text-slate-500" value={formData.generatedId || "(Otomatis)"} disabled />
            </div>
            <SearchableSelect 
              label="Varian Hewan"
              placeholder="Pilih Varian..."
              options={variants.map(v => ({ label: `${v.species} - ${v.classGrade} (${v.weightRange})`, value: v.id }))}
              value={formData.animalVariantId}
              onChange={val => setFormData({...formData, animalVariantId: val})}
            />
          </div>

          {/* SEKSI 2: PENEMPATAN & STATUS */}
          <div className="space-y-4">
            <h4 className="font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-1.5">Penempatan</h4>
            <SearchableSelect 
              label="Kandang"
              placeholder="Pilih Kandang..."
              options={pens.map(p => ({ label: p.name, value: p.id }))}
              value={formData.penId}
              onChange={val => setFormData({...formData, penId: val})}
            />
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">No Pen (Pan)</label>
              <input type="text" className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-indigo-400 shadow-sm" value={formData.panName || ""} onChange={e => setFormData({...formData, panName: e.target.value})} />
            </div>
            <SearchableSelect 
              label="Vendor / Sumber"
              placeholder="Pilih Vendor..."
              options={vendors.map(v => ({ label: v.name, value: v.id }))}
              value={formData.vendorId}
              onChange={val => setFormData({...formData, vendorId: val})}
            />
            <SearchableSelect 
              label="Status"
              options={[
                { label: "AVAILABLE (STOK)", value: "AVAILABLE" },
                { label: "ALLOCATED (TERIKAT)", value: "ALLOCATED" },
                { label: "SOLD (TERJUAL)", value: "SOLD" },
                { label: "DEAD (MATI)", value: "DEAD" },
              ]}
              value={formData.status}
              onChange={val => setFormData({...formData, status: val})}
            />
          </div>

          {/* SEKSI 3: LOGISTIK & TANGGAL */}
          <div className="space-y-4">
            <h4 className="font-black text-xs text-emerald-500 uppercase tracking-widest border-b border-emerald-100 pb-1.5">Logistik</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Tgl Masuk</label>
                <input type="date" className="w-full border-slate-300 rounded-lg p-3 text-sm border focus:border-emerald-400 outline-none shadow-sm" value={formData.entryDate || ""} onChange={e => setFormData({...formData, entryDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Tgl Keluar</label>
                <input type="date" className="w-full border-slate-300 rounded-lg p-3 text-sm border focus:border-emerald-400 outline-none shadow-sm" value={formData.exitDate || ""} onChange={e => setFormData({...formData, exitDate: e.target.value})} />
              </div>
            </div>
            <SearchableSelect 
              label="Jenis Pengadaan"
              options={[
                { label: "MANDIRI", value: "MANDIRI" },
                { label: "TITIPAN", value: "TITIPAN" },
              ]}
              value={formData.acquisitionType}
              onChange={val => setFormData({...formData, acquisitionType: val})}
            />
            <SearchableSelect 
              label="Produk Awal"
              options={[
                { label: "QURBAN ANTAR", value: "QURBAN ANTAR" },
                { label: "QURBAN BERBAGI", value: "QURBAN BERBAGI" },
                { label: "AQIQAH", value: "AQIQAH" },
                { label: "LAINNYA", value: "LAINNYA" },
              ]}
              value={formData.initialProductType}
              onChange={val => setFormData({...formData, initialProductType: val})}
            />
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Tanduk</label>
              <input type="text" className="w-full border-slate-300 rounded-lg p-3 text-sm border focus:border-emerald-400 outline-none shadow-sm" value={formData.hornType || ""} onChange={e => setFormData({...formData, hornType: e.target.value})} placeholder="Contoh: TANDUK" />
            </div>
          </div>

          {/* SEKSI 4: NILAI & BOBOT */}
          <div className="space-y-4">
            <h4 className="font-black text-xs text-amber-500 uppercase tracking-widest border-b border-amber-100 pb-1.5">Nilai & Bobot</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Bbt Awal</label>
                <input type="number" className="w-full border-slate-300 rounded-lg p-3 text-sm border focus:border-amber-400 outline-none shadow-sm" value={formData.initialWeight || ""} onChange={e => setFormData({...formData, initialWeight: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Bbt Smbr</label>
                <input type="number" className="w-full border-slate-300 rounded-lg p-3 text-sm border focus:border-amber-400 outline-none shadow-sm" value={formData.initialWeightSource || ""} onChange={e => setFormData({...formData, initialWeightSource: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Aktual</label>
                <input type="number" className="w-full border-slate-300 rounded-lg p-3 text-sm border font-bold text-blue-600 focus:border-blue-500 outline-none shadow-sm" value={formData.weightActual || ""} onChange={e => setFormData({...formData, weightActual: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Harga Beli (Rp)</label>
              <input type="number" className="w-full border-slate-300 rounded-lg p-3 text-sm font-bold border focus:border-amber-400 outline-none shadow-sm" value={formData.purchasePrice || ""} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Harga/kg</label>
                <input type="number" className="w-full border-slate-300 rounded-lg p-3 text-sm border focus:border-amber-400 outline-none shadow-sm" value={formData.pricePerKg || ""} onChange={e => setFormData({...formData, pricePerKg: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Ongkir</label>
                <input type="number" className="w-full border-slate-300 rounded-lg p-3 text-sm border focus:border-amber-400 outline-none shadow-sm" value={formData.shippingCost || ""} onChange={e => setFormData({...formData, shippingCost: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-amber-600 uppercase mb-1.5 block tracking-wide">Total HPP</label>
              <input type="number" className="w-full bg-amber-50/50 border-amber-200 rounded-lg p-3 text-base font-black text-amber-900 border" value={formData.totalHpp || ""} onChange={e => setFormData({...formData, totalHpp: e.target.value})} />
            </div>
          </div>

          {/* SEKSI TAMBAHAN: MODAL ROW 2 */}
          <div className="md:col-span-2 grid grid-cols-2 gap-6">
             <div className="space-y-4">
                <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1">Tipe (Initial/Final)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" className="w-full border-slate-300 rounded-lg p-2 text-xs border" value={formData.initialType || ""} onChange={e => setFormData({...formData, initialType: e.target.value})} placeholder="Initial Type" />
                  <input type="text" className="w-full border-slate-300 rounded-lg p-2 text-xs border" value={formData.finalType || ""} onChange={e => setFormData({...formData, finalType: e.target.value})} placeholder="Final Type" />
                </div>
             </div>
             <div className="space-y-4">
                <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1">Media & Referensi</h4>
                <div className="space-y-3">
                  <ImageUpload
                    label="Photo Hewan"
                    value={formData.photoUrl || ""}
                    onChange={(url) => setFormData({...formData, photoUrl: url || ""})}
                    maxSize={5}
                  />
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">Order Item ID (Read Only)</label>
                    <input type="number" className="w-full bg-slate-100 border-slate-300 rounded-lg p-2 text-xs border" value={formData.orderItemId || ""} onChange={e => setFormData({...formData, orderItemId: e.target.value})} placeholder="Order Item ID" readOnly />
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl border border-slate-200 font-bold text-slate-500 text-xs hover:bg-slate-50 transition-all">Batal</button>
          <button 
            disabled={isPending}
            onClick={handleSave} 
            className="bg-[#102a43] text-white px-10 py-2 rounded-xl font-black text-xs shadow-lg flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={16} /> : "Simpan Data"}
          </button>
        </div>
      </Modal>

      {/* BULK ENTRY MODAL */}
      <Modal open={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Tambah Hewan Massal (Bulk Entry)" maxWidthClassName="max-w-2xl">
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-3xl text-xs text-indigo-700 font-bold leading-relaxed">
            Record massal akan dibuat dengan spesifikasi yang sama. ID Eartag akan diisi placeholder otomatis yang bisa diperbarui via menu Edit atau Excel Import di kemudian hari.
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black mb-2 block uppercase text-slate-400 tracking-widest">Jumlah Hewan (Qty)</label>
              <input type="number" min="1" max="100" className="w-full border-slate-200 bg-slate-50 rounded-2xl p-4 text-3xl font-black text-[#102a43] focus:ring-2 focus:ring-indigo-100 outline-none" value={bulkQty} onChange={e => setBulkQty(Number(e.target.value))} />
            </div>
            <SearchableSelect 
              label="Varian Target"
              placeholder="Pilih Varian..."
              options={variants.map(v => ({ label: `${v.species} - ${v.classGrade}`, value: v.id }))}
              value={commonBulk.animalVariantId}
              onChange={val => setCommonBulk({...commonBulk, animalVariantId: val})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <SearchableSelect 
              label="Kandang"
              placeholder="Pilih Kandang..."
              options={pens.map(p => ({ label: p.name, value: p.id }))}
              value={commonBulk.penId}
              onChange={val => setCommonBulk({...commonBulk, penId: val})}
            />
            <SearchableSelect 
              label="Vendor"
              placeholder="Pilih Vendor..."
              options={vendors.map(v => ({ label: v.name, value: v.id }))}
              value={commonBulk.vendorId}
              onChange={val => setCommonBulk({...commonBulk, vendorId: val})}
            />
          </div>

          <button 
            disabled={isPending || !commonBulk.animalVariantId}
            onClick={handleBulkSave} 
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl mt-4 shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="mx-auto animate-spin" size={28} /> : `Generate ${bulkQty} Record Hewan`}
          </button>
        </div>
      </Modal>

      {/* PEN MODAL */}
      <Modal 
        open={isPenModalOpen} 
        onClose={() => setIsPenModalOpen(false)} 
        title={selectedPen ? "Ubah Data Kandang" : "Tambah Kandang Baru"}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-6">
          <SearchableSelect 
            label="Cabang"
            options={branches.map(b => ({ label: b.name, value: b.id }))}
            value={penFormData.branchId}
            onChange={val => setPenFormData({...penFormData, branchId: val})}
          />
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Nama Kandang</label>
            <input 
              type="text" 
              className="w-full border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
              value={penFormData.name || ""} 
              onChange={e => setPenFormData({...penFormData, name: e.target.value})}
              placeholder="Contoh: Kandang A1"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4 font-bold">
            <button onClick={() => setIsPenModalOpen(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50">Batal</button>
            <button 
              disabled={isPending}
              onClick={handleSavePen}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="mx-auto animate-spin" size={20} /> : "Simpan Kandang"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
