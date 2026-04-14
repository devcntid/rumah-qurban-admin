"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Tag, 
  MapPin, 
  Calendar, 
  Package, 
  CheckCircle2, 
  Truck,
  Circle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  MapIcon,
  Image as ImageIcon
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { addAnimalTrackingAction, updateAnimalTrackingAction, deleteAnimalTrackingAction } from "@/lib/actions/farm";
import { toast } from "sonner";
import type { FarmInventoryRow, AnimalTrackingRow } from "@/lib/db/queries/farm";

function getMilestoneIcon(milestone: string) {
  const lower = milestone.toLowerCase();
  if (lower.includes("alokasi") || lower.includes("pesanan")) return CheckCircle2;
  if (lower.includes("pengiriman") || lower.includes("manifest")) return Package;
  if (lower.includes("perjalanan") || lower.includes("transit")) return Truck;
  if (lower.includes("tiba") || lower.includes("sampai") || lower.includes("lokasi")) return MapPin;
  return Circle;
}

export default function FarmDetailClient({
  animal,
  trackings,
  canEdit,
}: {
  animal: FarmInventoryRow & { branchName: string | null };
  trackings: AnimalTrackingRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<AnimalTrackingRow | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    milestone: "",
    description: "",
    locationLat: "",
    locationLng: "",
    mediaUrl: "",
  });

  const handleAddTracking = () => {
    startTransition(async () => {
      const res = await addAnimalTrackingAction({
        farmInventoryId: animal.id,
        ...formData,
      });
      
      if (res.success) {
        toast.success("Tracking berhasil ditambahkan");
        setIsAddModalOpen(false);
        setFormData({
          milestone: "",
          description: "",
          locationLat: "",
          locationLng: "",
          mediaUrl: "",
        });
        router.refresh();
      } else {
        if (res.fieldErrors) {
          const errorMsg = Object.entries(res.fieldErrors)
            .map(([field, msgs]) => `${msgs.join(", ")}`)
            .join(". ");
          toast.error("Validasi gagal", { description: errorMsg });
        } else {
          toast.error(res.error || "Gagal menambah tracking");
        }
      }
    });
  };

  const handleEditTracking = () => {
    if (!selectedTracking) return;
    
    startTransition(async () => {
      const res = await updateAnimalTrackingAction(selectedTracking.id, formData);
      
      if (res.success) {
        toast.success("Tracking berhasil diperbarui");
        setIsEditModalOpen(false);
        setSelectedTracking(null);
        router.refresh();
      } else {
        if (res.fieldErrors) {
          const errorMsg = Object.entries(res.fieldErrors)
            .map(([field, msgs]) => `${msgs.join(", ")}`)
            .join(". ");
          toast.error("Validasi gagal", { description: errorMsg });
        } else {
          toast.error(res.error || "Gagal memperbarui tracking");
        }
      }
    });
  };

  const handleDeleteTracking = (tracking: AnimalTrackingRow) => {
    if (!confirm(`Hapus tracking "${tracking.milestone}"?`)) return;
    
    startTransition(async () => {
      const res = await deleteAnimalTrackingAction(tracking.id);
      
      if (res.success) {
        toast.success("Tracking berhasil dihapus");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus tracking");
      }
    });
  };

  const openEditModal = (tracking: AnimalTrackingRow) => {
    setSelectedTracking(tracking);
    setFormData({
      milestone: tracking.milestone,
      description: tracking.description || "",
      locationLat: tracking.locationLat || "",
      locationLng: tracking.locationLng || "",
      mediaUrl: tracking.mediaUrl || "",
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10">
        <Link 
          href="/farm" 
          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all hover:scale-105"
        >
          <ArrowLeft size={20}/>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Detail Hewan</h2>
          <p className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mt-0.5">
            <Tag size={12}/> {animal.eartagId}
          </p>
        </div>
        {canEdit && (
          <Link
            href={`/farm?edit=${animal.id}`}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Pencil size={16} />
            Edit Detail
          </Link>
        )}
      </div>

      {/* Animal Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Informasi Hewan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tag ID (Eartag)</p>
            <p className="font-black text-[#102a43] text-lg">{animal.eartagId}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated ID</p>
            <p className="font-mono text-slate-600 text-sm">{animal.generatedId}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Farm Animal ID</p>
            <p className="font-bold text-slate-700 text-sm">{animal.farmAnimalId || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <span className={`inline-block px-2 py-1 rounded-md text-[9px] font-black uppercase border tracking-tight ${
              animal.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' : 
              animal.status === 'ALLOCATED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
              'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {animal.status}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spesies & Varian</p>
            <p className="font-black text-[#102a43] text-sm">{animal.species}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">{animal.classGrade} ({animal.weightRange})</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendor</p>
            <p className="font-bold text-slate-600 text-sm">{animal.vendorName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cabang</p>
            <p className="font-bold text-indigo-600 text-sm">{animal.branchName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kandang</p>
            <p className="font-bold text-slate-700 text-sm">{animal.penName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Masuk</p>
            <p className="text-slate-600 text-sm font-medium">
              {animal.entryDate ? new Date(animal.entryDate).toLocaleDateString('id-ID') : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bobot Aktual</p>
            <p className="font-black text-blue-700 text-lg">{animal.weightActual || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total HPP</p>
            <p className="font-black text-[#102a43] text-lg">
              {animal.totalHpp ? new Intl.NumberFormat('id-ID').format(Number(animal.totalHpp)) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanduk</p>
            <p className="text-slate-700 text-sm font-bold">{animal.hornType || "—"}</p>
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Timeline Tracking</h3>
          {canEdit && (
            <button
              onClick={() => {
                setFormData({
                  milestone: "",
                  description: "",
                  locationLat: "",
                  locationLng: "",
                  mediaUrl: "",
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#102a43] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-slate-800 transition-all"
            >
              <Plus size={14} />
              Tambah Tracking
            </button>
          )}
        </div>

        {trackings.length === 0 ? (
          <div className="py-16 text-center opacity-40">
            <Package size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-black text-slate-400">Belum ada tracking untuk hewan ini</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            
            <div className="space-y-6">
              {trackings.map((tracking, index) => {
                const Icon = getMilestoneIcon(tracking.milestone);
                const isLast = index === trackings.length - 1;
                
                return (
                  <div key={tracking.id} className="relative pl-16 group">
                    {/* Timeline dot */}
                    <div className={`absolute left-3 top-2 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center ${
                      index === 0 ? 'bg-indigo-600' : 'bg-slate-400'
                    }`}>
                      <Icon size={12} className="text-white" />
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-black text-slate-800 text-base mb-1">{tracking.milestone}</h4>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(tracking.loggedAt).toLocaleString('id-ID', { 
                              dateStyle: 'long', 
                              timeStyle: 'short' 
                            })}
                          </p>
                        </div>
                        {canEdit && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(tracking)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteTracking(tracking)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {tracking.description && (
                        <p className="text-sm text-slate-700 leading-relaxed mb-3">{tracking.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 mt-3">
                        {tracking.locationLat && tracking.locationLng && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${tracking.locationLat},${tracking.locationLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md border border-blue-200"
                          >
                            <MapIcon size={12}/> Lihat Lokasi di Peta
                          </a>
                        )}
                        {tracking.mediaUrl && (
                          <button
                            onClick={() => setPreviewImage(tracking.mediaUrl)}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black text-green-600 hover:underline bg-green-50 px-2 py-1 rounded-md border border-green-200 transition-all hover:bg-green-100"
                          >
                            <ImageIcon size={12}/> Lihat Gambar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Tracking Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Tracking Baru"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
              Milestone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border-slate-300 rounded-lg p-3 text-sm font-bold outline-none border focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all shadow-sm"
              value={formData.milestone}
              onChange={(e) => setFormData({...formData, milestone: e.target.value})}
              placeholder="Contoh: Pemeriksaan Kesehatan"
              maxLength={50}
            />
            <p className="text-[9px] text-slate-400 mt-1">{formData.milestone.length}/50 karakter</p>
          </div>
          
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
              Deskripsi
            </label>
            <textarea
              className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all shadow-sm"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-blue-400 transition-all shadow-sm"
                value={formData.locationLat}
                onChange={(e) => setFormData({...formData, locationLat: e.target.value})}
                placeholder="-6.200000"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                Longitude
              </label>
              <input
                type="text"
                className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-blue-400 transition-all shadow-sm"
                value={formData.locationLng}
                onChange={(e) => setFormData({...formData, locationLng: e.target.value})}
                placeholder="106.816666"
              />
            </div>
          </div>
          
          <ImageUpload
            label="Upload Gambar (Opsional)"
            value={formData.mediaUrl}
            onChange={(url) => setFormData({...formData, mediaUrl: url || ""})}
            maxSize={5}
          />
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-6 py-2 rounded-xl border border-slate-200 font-bold text-slate-500 text-xs hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button
              disabled={isPending || !formData.milestone.trim()}
              onClick={handleAddTracking}
              className="bg-[#102a43] text-white px-10 py-2 rounded-xl font-black text-xs shadow-lg flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : "Simpan Tracking"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Tracking Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTracking(null);
        }}
        title="Edit Tracking"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
              Milestone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border-slate-300 rounded-lg p-3 text-sm font-bold outline-none border focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all shadow-sm"
              value={formData.milestone}
              onChange={(e) => setFormData({...formData, milestone: e.target.value})}
              maxLength={50}
            />
            <p className="text-[9px] text-slate-400 mt-1">{formData.milestone.length}/50 karakter</p>
          </div>
          
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
              Deskripsi
            </label>
            <textarea
              className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all shadow-sm"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                Latitude
              </label>
              <input
                type="text"
                className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-blue-400 transition-all shadow-sm"
                value={formData.locationLat}
                onChange={(e) => setFormData({...formData, locationLat: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block tracking-wide">
                Longitude
              </label>
              <input
                type="text"
                className="w-full border-slate-300 rounded-lg p-3 text-sm outline-none border focus:border-blue-400 transition-all shadow-sm"
                value={formData.locationLng}
                onChange={(e) => setFormData({...formData, locationLng: e.target.value})}
              />
            </div>
          </div>
          
          <ImageUpload
            label="Upload Gambar (Opsional)"
            value={formData.mediaUrl}
            onChange={(url) => setFormData({...formData, mediaUrl: url || ""})}
            maxSize={5}
          />
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTracking(null);
              }}
              className="px-6 py-2 rounded-xl border border-slate-200 font-bold text-slate-500 text-xs hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button
              disabled={isPending || !formData.milestone.trim()}
              onClick={handleEditTracking}
              className="bg-[#102a43] text-white px-10 py-2 rounded-xl font-black text-xs shadow-lg flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage}
          title="Preview Gambar Tracking"
        />
      )}
    </div>
  );
}
