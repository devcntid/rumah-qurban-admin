"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TemplateModal } from "./TemplateModal";
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
  MapPin
} from "lucide-react";
import { 
  saveInventoryAction, 
  bulkSaveInventoryAction, 
  deleteInventoryAction,
  savePenAction,
  deletePenAction
} from "@/lib/actions/farm";
import { Pagination } from "@/components/ui/Pagination";
import { FiltersBar } from "@/components/ui/FiltersBar";
import * as XLSX from "xlsx";

type Tab = "inventory" | "pens";

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
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [isPending, startTransition] = useTransition();
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPenModalOpen, setIsPenModalOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPen, setSelectedPen] = useState<any>(null);

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
      await saveInventoryAction(formData);
      setIsModalOpen(false);
    });
  };

  const handleBulkSave = async () => {
    startTransition(async () => {
      const items = Array.from({ length: bulkQty }).map((_, i) => ({
        eartagId: `TEMP-${Date.now()}-${i}`,
      }));
      await bulkSaveInventoryAction(commonBulk, items);
      setIsBulkModalOpen(false);
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data ini?")) return;
    startTransition(async () => {
      await deleteInventoryAction(id);
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
      setIsPenModalOpen(false);
    });
  };

  const handleDeletePen = async (id: number) => {
    if (!confirm("Hapus kandang ini?")) return;
    startTransition(async () => {
      await deletePenAction(id);
    });
  };

  // EXCEL LOGIC
  const handleExport = () => {
    const data = initialData.map((item, index) => ({
      "NO": (page - 1) * pageSize + index + 1,
      "generated_id": item.generatedId,
      "ID HEWAN FARM": item.farmAnimalId,
      "ID HEWAN (Eartag)": item.eartagId,
      "TGL MASUK": item.entryDate,
      "JENIS PENGADAAN": item.acquisitionType,
      "PRODUCT AWAL": item.initialProductType,
      "KANDANG": item.penName,
      "PAN": item.panName,
      "HARGA BELI/EKOR": item.purchasePrice,
      "BOBOT AWAL SUMBER": item.initialWeightSource,
      "HARGA/KG": item.pricePerKg,
      "ONGKOS KIRIM HEWAN": item.shippingCost,
      "TOTAL HPP": item.totalHpp,
      "JENIS (TANDUK)": item.hornType,
      "BOBOT AWAL": item.initialWeight,
      "TIMBANG (ACTUAL)": item.weightActual,
      "STATUS": item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventaris Farm");
    XLSX.writeFile(wb, `Inventaris_Farm_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const executeDownloadTemplate = (context: { penId?: number; vendorId?: number }) => {
    const headers = [
      ["ID HEWAN FARM", "ID HEWAN (Eartag)", "JENIS PENGADAAN", "PRODUCT AWAL", "KANDANG_ID", "VENDOR_ID", "HARGA BELI", "BOBOT AWAL", "JENIS TANDUK", "Keterangan"],
      ["JT001", "TAG-1001", "MANDIRI", "QURBAN ANTAR", String(context.penId || "1"), String(context.vendorId || "1"), "6000000", "70", "TANDUK", "Isi ID Kandang & Vendor sesuai list alat bantu ->"],
    ];
    
    // Add helper sheets or columns for Vendor & Pen
    const vendorHelp = vendors.map(v => [v.id, v.name]);
    const penHelp = pens.map(p => [p.id, p.name]);
    
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "", "", "", "", "", ""]], { origin: -1 });
    XLSX.utils.sheet_add_aoa(ws, [["ALAT BANTU (TIDAK UNTUK DIUPLOAD):", ""]], { origin: "L1" });
    XLSX.utils.sheet_add_aoa(ws, [["ID KANDANG", "NAMA KANDANG"]], { origin: "L2" });
    XLSX.utils.sheet_add_aoa(ws, penHelp, { origin: "L3" });
    
    XLSX.utils.sheet_add_aoa(ws, [["ID VENDOR", "NAMA VENDOR"]], { origin: "O2" });
    XLSX.utils.sheet_add_aoa(ws, vendorHelp, { origin: "O3" });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Upload");
    XLSX.writeFile(wb, "Template_Upload_Farm.xlsx");
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
      
      startTransition(async () => {
        for (const row of data) {
          const payload = {
            branchId,
            farmAnimalId: String(row["ID HEWAN FARM"] || ""),
            eartagId: String(row["ID HEWAN (Eartag)"] || ""),
            acquisitionType: row["JENIS PENGADAAN"],
            initialProductType: row["PRODUCT AWAL"],
            penId: row["KANDANG_ID"],
            vendorId: row["VENDOR_ID"],
            purchasePrice: row["HARGA BELI"],
            initialWeight: row["BOBOT AWAL"],
            hornType: row["JENIS TANDUK"],
            status: "AVAILABLE",
          };
          if (payload.eartagId) await saveInventoryAction(payload);
        }
      });
    };
    reader.readAsBinaryString(file);
  };

  const filterFields: any[] = [
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-black text-[#102a43] tracking-tight flex items-center gap-3">
              {activeTab === "inventory" ? <Box size={28} className="text-blue-600" /> : <MapPin size={28} className="text-indigo-600" />}
              {activeTab === "inventory" ? "Inventaris Farm" : "Daftar Kandang"}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {activeTab === "inventory" 
                ? "Kelola data hewan farm, monitoring bobot, dan tracking HPP." 
                : "Kelola daftar kandang dan penempatan hewan di setiap cabang."}
            </p>
          </div>
          
          <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "inventory" 
                  ? "bg-white text-[#102a43] shadow-md" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Inventaris
            </button>
            <button
              onClick={() => setActiveTab("pens")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "pens" 
                  ? "bg-white text-[#102a43] shadow-md" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kandang
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === "inventory" ? (
            <>
              <button 
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                <FileDown size={16} /> Template
              </button>
              <label className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-2xl text-xs font-bold shadow-sm cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all">
                <FileUp size={16} /> Import
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
              </label>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-emerald-700 hover:shadow-emerald-100 transition-all"
              >
                <FileDown size={16} /> Export
              </button>
              <button 
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-indigo-700 hover:shadow-indigo-100 transition-all"
              >
                <Layers size={16} /> Bulk Entry
              </button>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-[#102a43] text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-slate-800 hover:shadow-slate-200 transition-all"
              >
                <Plus size={16} /> Tambah Satuan
              </button>
            </>
          ) : (
            <button 
              onClick={() => handleOpenPenModal()}
              className="flex items-center gap-2 bg-[#102a43] text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
            >
              <Plus size={16} /> Tambah Kandang
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
                  <tr className="bg-slate-50/80 text-[10px] uppercase text-slate-500 border-b border-slate-200">
                    <th className="p-5 font-bold w-16 text-center">No</th>
                    <th className="p-5 font-bold">QR/Gen ID</th>
                    <th className="p-5 font-bold">Hewan Farm ID</th>
                    <th className="p-5 font-bold">Tag ID</th>
                    <th className="p-5 font-bold">Varian</th>
                    <th className="p-5 font-bold">Tgl Masuk</th>
                    <th className="p-5 font-bold">Kandang</th>
                    <th className="p-5 font-bold text-center">Status</th>
                    <th className="p-5 font-bold text-right">Berat (kg)</th>
                    <th className="p-5 font-bold text-right">HPP</th>
                    <th className="p-5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 italic-muted">
                  {initialData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5 text-center text-slate-400 font-mono text-xs">
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td className="p-5">
                        <div className="font-black text-[#102a43]">{item.generatedId}</div>
                      </td>
                      <td className="p-5 font-semibold text-slate-700">{item.farmAnimalId || "—"}</td>
                      <td className="p-5">
                        <span className="px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono font-bold">
                          {item.eartagId}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="text-xs font-black text-[#102a43]">{item.species}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.classGrade} ({item.weightRange})</div>
                      </td>
                      <td className="p-5 text-xs text-slate-600 font-medium">
                        {item.entryDate ? new Date(item.entryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-5">
                        <div className="text-xs font-black text-indigo-700">{item.penName || "—"}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{item.panName || ""}</div>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase border tracking-widest ${
                          item.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' : 
                          item.status === 'ALLOCATED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-5 text-right font-black text-[#102a43]">
                        {item.weightActual || item.initialWeight || "—"}
                      </td>
                      <td className="p-5 text-right font-black text-slate-700">
                        {item.totalHpp ? new Intl.NumberFormat('id-ID').format(Number(item.totalHpp)) : "—"}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-3 text-slate-300 group-hover:text-slate-400 transition-colors">
                          <button onClick={() => handleOpenModal(item)} className="hover:text-amber-600 transition-all hover:scale-110">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 transition-all hover:scale-110">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {initialData.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-32 text-center opacity-30">
                        <div className="flex flex-col items-center gap-4">
                          <Search size={64} className="text-slate-300" />
                          <p className="font-black text-xl text-slate-400 tracking-tight">Tidak ada data ditemukan</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t bg-slate-50/50">
              <Pagination page={page} pageSize={pageSize} hasNext={initialData.length === pageSize} />
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
                    <td colSpan={4} className="p-32 text-center opacity-30">
                      <div className="flex flex-col items-center gap-4">
                        <MapPin size={64} className="text-slate-300" />
                        <p className="font-black text-xl text-slate-400 tracking-tight">Belum ada data kandang</p>
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
      />

      {/* SINGLE ENTRY INVENTORY MODAL */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedItem ? "Ubah Data Inventaris" : "Tambah Data Inventaris Satuan"}
        maxWidthClassName="max-w-5xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-1">
          <div className="space-y-6">
            <h4 className="font-black text-xs text-blue-500 uppercase tracking-widest border-b border-blue-100 pb-2">Identitas Dasar</h4>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">ID Hewan Farm</label>
              <input type="text" className="w-full border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" value={formData.farmAnimalId || ""} onChange={e => setFormData({...formData, farmAnimalId: e.target.value})} placeholder="Contoh: JT001" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block tracking-wider">ID Hewan (Eartag) <span className="text-red-500">*</span></label>
              <input type="text" className="w-full border-slate-300 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" value={formData.eartagId || ""} onChange={e => setFormData({...formData, eartagId: e.target.value})} placeholder="Contoh: TAG-001" required />
            </div>
            <SearchableSelect 
              label="Varian Hewan"
              placeholder="Pilih Varian..."
              options={variants.map(v => ({ label: `${v.species} - ${v.classGrade} (${v.weightRange})`, value: v.id }))}
              value={formData.animalVariantId}
              onChange={val => setFormData({...formData, animalVariantId: val})}
            />
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2">Penempatan & Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <SearchableSelect 
                label="Kandang"
                placeholder="Pilih..."
                options={pens.map(p => ({ label: p.name, value: p.id }))}
                value={formData.penId}
                onChange={val => setFormData({...formData, penId: val})}
              />
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Pan / No Pen</label>
                <input type="text" className="w-full border-slate-300 rounded-xl p-3 text-sm outline-none transition-all" value={formData.panName || ""} onChange={e => setFormData({...formData, panName: e.target.value})} />
              </div>
            </div>
            <SearchableSelect 
              label="Vendor / Sumber"
              placeholder="Pilih Vendor..."
              options={vendors.map(v => ({ label: v.name, value: v.id }))}
              value={formData.vendorId}
              onChange={val => setFormData({...formData, vendorId: val})}
            />
            <SearchableSelect 
              label="Status Fisik"
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

          <div className="space-y-6">
            <h4 className="font-black text-xs text-emerald-500 uppercase tracking-widest border-b border-emerald-100 pb-2">Nilai & Bobot</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Bobot Sumber (kg)</label>
                <input type="number" className="w-full border-slate-300 rounded-xl p-3 text-sm" value={formData.initialWeightSource || ""} onChange={e => setFormData({...formData, initialWeightSource: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block text-emerald-600">Bobot Awal (kg)</label>
                <input type="number" className="w-full border-emerald-200 bg-emerald-50/30 rounded-xl p-3 text-sm font-bold" value={formData.initialWeight || ""} onChange={e => setFormData({...formData, initialWeight: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Harga Beli / Ekor (Rp)</label>
              <input type="number" className="w-full border-slate-300 bg-slate-50 font-black rounded-xl p-4 text-lg text-[#102a43]" value={formData.purchasePrice || ""} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t flex justify-end gap-3">
          <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">Batal</button>
          <button 
            disabled={isPending}
            onClick={handleSave} 
            className="bg-[#102a43] text-white px-12 py-3 rounded-2xl font-black shadow-lg shadow-slate-200 flex items-center gap-2 hover:bg-black hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={20} /> : "Simpan Data"}
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
