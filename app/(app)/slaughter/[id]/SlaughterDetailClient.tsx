"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, MapPin, User, FileText, Camera,
  Trash2, Plus, Save, Send, Eye, Download, Loader2, X
} from "lucide-react";
import { api, ApiException } from "@/lib/api/client";
import { Modal } from "@/components/ui/Modal";
import type { SlaughterRecordWithDetails, NotifTemplate, DocumentationPhoto } from "@/types/notifications";

type Props = {
  record: SlaughterRecordWithDetails;
  templates: NotifTemplate[];
};

const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

export default function SlaughterDetailClient({ record, templates }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<DocumentationPhoto[]>(record.documentationPhotos || []);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [editData, setEditData] = useState({
    slaughteredAt: record.slaughteredAt ? new Date(record.slaughteredAt).toISOString().slice(0, 16) : "",
    location: record.slaughterLocation || "",
    notes: record.notes || "",
    performedBy: record.performedBy || "",
  });

  const handleSaveChanges = async () => {
    startTransition(async () => {
      try {
        await api("/api/slaughter-records", {
          method: "POST",
          json: {
            id: record.id,
            slaughteredAt: editData.slaughteredAt,
            slaughterLocation: editData.location,
            notes: editData.notes,
            performedBy: editData.performedBy,
            documentationPhotos: photos,
          },
        });
        toast.success("Perubahan berhasil disimpan");
        router.refresh();
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.message);
        } else {
          toast.error("Gagal menyimpan perubahan");
        }
      }
    });
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos: DocumentationPhoto[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", `slaughter-${record.id}-${Date.now()}-${file.name}`);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          newPhotos.push({
            url: uploadData.url,
            uploadedAt: new Date().toISOString(),
          });
        }
      }

      if (newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        setPhotos(updatedPhotos);
        
        await api("/api/slaughter-records", {
          method: "POST",
          json: {
            id: record.id,
            documentationPhotos: updatedPhotos,
          },
        });
        
        toast.success(`${newPhotos.length} foto berhasil diupload`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Gagal mengupload foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const confirmDeletePhoto = (index: number) => {
    setPhotoToDelete(index);
    setShowDeleteModal(true);
  };

  const handleDeletePhoto = async () => {
    if (photoToDelete === null) return;

    startTransition(async () => {
      try {
        const updatedPhotos = photos.filter((_, i) => i !== photoToDelete);
        setPhotos(updatedPhotos);
        
        await api("/api/slaughter-records", {
          method: "POST",
          json: {
            id: record.id,
            documentationPhotos: updatedPhotos,
          },
        });
        
        toast.success("Foto berhasil dihapus");
        setShowDeleteModal(false);
        setPhotoToDelete(null);
        router.refresh();
      } catch (error) {
        toast.error("Gagal menghapus foto");
      }
    });
  };

  const handleGenerateCertificate = async () => {
    startTransition(async () => {
      try {
        const data = await api<{ success: boolean; certificateUrl?: string }>(
          "/api/certificates/generate",
          {
            method: "POST",
            json: { slaughterRecordId: record.id },
          }
        );

        if (data.certificateUrl) {
          toast.success("Sertifikat berhasil dibuat");
          window.open(data.certificateUrl, "_blank");
          router.refresh();
        }
      } catch (error) {
        toast.error("Gagal membuat sertifikat");
      }
    });
  };

  const handleSendNotification = async () => {
    if (!selectedTemplateId) {
      toast.error("Pilih template notifikasi");
      return;
    }

    startTransition(async () => {
      try {
        await api("/api/notifications/send", {
          method: "POST",
          json: {
            orderId: record.orderId,
            templateId: selectedTemplateId,
          },
        });

        toast.success("Notifikasi berhasil dikirim");
        setShowNotifModal(false);
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.message);
        } else {
          toast.error("Gagal mengirim notifikasi");
        }
      }
    });
  };

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <Link 
            href="/slaughter" 
            className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft size={20}/>
          </Link>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Detail Penyembelihan
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs mr-2">
                {record.eartagId}
              </span>
              {record.itemName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Send size={16} />
              Kirim Notifikasi
            </button>
            {record.certificateUrl ? (
              <a
                href={record.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
              >
                <Eye size={16} />
                Lihat Sertifikat
              </a>
            ) : (
              <button
                onClick={handleGenerateCertificate}
                disabled={pending}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50"
              >
                <FileText size={16} />
                {pending ? "Membuat..." : "Buat Sertifikat"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info & Edit */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Informasi Order</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Invoice</p>
                  <Link 
                    href={`/orders/${record.orderId}`}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {record.invoiceNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Customer</p>
                  <p className="font-medium text-slate-800">{record.customerName}</p>
                  <p className="text-slate-600">{record.customerPhone || "-"}</p>
                </div>
                {record.participantNames && record.participantNames.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs">Peserta Qurban</p>
                    <ul className="list-disc list-inside text-slate-700">
                      {record.participantNames.map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Edit Data Penyembelihan</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="editSlaughteredAt" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                    <Calendar size={14} />
                    Tanggal & Waktu
                  </label>
                  <input
                    id="editSlaughteredAt"
                    type="datetime-local"
                    value={editData.slaughteredAt}
                    onChange={(e) => setEditData({ ...editData, slaughteredAt: e.target.value })}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor="editLocation" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                    <MapPin size={14} />
                    Lokasi
                  </label>
                  <input
                    id="editLocation"
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className={FIELD_CLASS}
                    placeholder="Lokasi penyembelihan"
                  />
                </div>

                <div>
                  <label htmlFor="editPerformedBy" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                    <User size={14} />
                    Dilaksanakan Oleh
                  </label>
                  <input
                    id="editPerformedBy"
                    type="text"
                    value={editData.performedBy}
                    onChange={(e) => setEditData({ ...editData, performedBy: e.target.value })}
                    className={FIELD_CLASS}
                    placeholder="Nama petugas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Catatan
                  </label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className={`${FIELD_CLASS} min-h-[80px]`}
                    placeholder="Catatan tambahan"
                  />
                </div>

                <button
                  onClick={handleSaveChanges}
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#102a43] text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  <Save size={16} />
                  {pending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Photos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Camera size={18} />
                  Foto Dokumentasi ({photos.length})
                </h3>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Tambah Foto
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadPhoto}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Camera size={48} className="mx-auto text-slate-300 mb-3" />
                  <p>Belum ada foto dokumentasi</p>
                  <p className="text-sm">Klik "Tambah Foto" untuk mengupload</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={photo.url}
                        alt={`Dokumentasi ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100"
                        >
                          <Eye size={18} />
                        </a>
                        <a
                          href={photo.url}
                          download
                          className="p-2 bg-white rounded-lg text-slate-700 hover:bg-slate-100"
                        >
                          <Download size={18} />
                        </a>
                        <button
                          onClick={() => confirmDeletePhoto(idx)}
                          className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-[10px] font-medium">
                          {new Date(photo.uploadedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Photo Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Foto"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleDeletePhoto}
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        title="Kirim Notifikasi"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Mengirim ke:</p>
            <p className="font-bold text-slate-800">{record.customerName}</p>
            <p className="text-sm text-slate-600">{record.customerPhone || "No HP tidak tersedia"}</p>
          </div>

          <div>
            <label htmlFor="notifTemplateDetailSelect" className="block text-sm font-bold text-slate-700 mb-2">
              Pilih Template
            </label>
            <select
              id="notifTemplateDetailSelect"
              value={selectedTemplateId || ""}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value) || null)}
              className={FIELD_CLASS}
            >
              <option value="">-- Pilih Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {selectedTemplateId && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Preview:</p>
              <div className="bg-slate-50 rounded-lg p-3 text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {templates.find(t => t.id === selectedTemplateId)?.templateText}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowNotifModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleSendNotification}
              disabled={pending || !selectedTemplateId || !record.customerPhone}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50"
            >
              <Send size={16} />
              {pending ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
