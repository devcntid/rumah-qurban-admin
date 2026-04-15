"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  Eye, 
  Receipt, 
  Pencil,
  Search, 
  Download, 
  Plus,
  Package,
  Trash2,
  Loader2,
  Upload,
  Send,
  MessageSquare
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { FiltersBar, FilterField } from "@/components/ui/FiltersBar";
import * as XLSX from "xlsx";
import { OrderListRow } from "@/lib/db/queries/orders";
import { deleteOrderAction } from "@/lib/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import UploadOrdersModal from "@/components/orders/UploadOrdersModal";
import { Modal } from "@/components/ui/Modal";
import { api, ApiException } from "@/lib/api/client";
import type { NotifTemplate } from "@/types/notifications";

function formatIDR(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  DP_PAID: "bg-blue-100 text-blue-700 border-blue-200",
  FULL_PAID: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export default function OrdersClient({
  initialData,
  totalCount,
  branches,
  page,
  pageSize,
  showPosEditOrder = false,
}: {
  initialData: OrderListRow[];
  totalCount: number;
  branches: { id: number; name: string }[];
  page: number;
  pageSize: number;
  showPosEditOrder?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSelectedOrders(new Set());
  }, [page]);

  const loadTemplates = async () => {
    try {
      const data = await api<{ templates: NotifTemplate[] }>("/api/notif-templates?all=true");
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === initialData.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(initialData.map(o => o.id)));
    }
  };

  const toggleSelect = (orderId: number) => {
    const newSet = new Set(selectedOrders);
    if (newSet.has(orderId)) {
      newSet.delete(orderId);
    } else {
      newSet.add(orderId);
    }
    setSelectedOrders(newSet);
  };

  const openBulkModal = () => {
    loadTemplates();
    setSelectedTemplateId(null);
    setShowBulkModal(true);
  };

  const handleBulkSend = async () => {
    if (!selectedTemplateId || selectedOrders.size === 0) {
      toast.error("Pilih template notifikasi");
      return;
    }

    const ordersWithPhone = initialData.filter(
      o => selectedOrders.has(o.id) && o.customerPhone
    );

    if (ordersWithPhone.length === 0) {
      toast.error("Tidak ada pesanan dengan nomor HP");
      return;
    }

    if (!confirm(`Kirim notifikasi ke ${ordersWithPhone.length} pelanggan?`)) {
      return;
    }

    setSending(true);
    try {
      const data = await api<{
        success: boolean;
        successCount: number;
        failedCount: number;
        errors: string[];
      }>("/api/notifications/broadcast", {
        method: "POST",
        json: {
          orderIds: ordersWithPhone.map(o => o.id),
          templateId: selectedTemplateId,
        },
      });

      if (data.successCount > 0) {
        toast.success(`Berhasil mengirim ${data.successCount} notifikasi`);
      }
      if (data.failedCount > 0) {
        toast.error(`${data.failedCount} notifikasi gagal terkirim`);
      }

      setShowBulkModal(false);
      setSelectedOrders(new Set());
    } catch (error) {
      if (error instanceof ApiException) {
        toast.error(error.message);
      } else {
        toast.error("Gagal mengirim notifikasi");
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number, invoice: string) => {
    if (!window.confirm(`Hapus pesanan ${invoice}? Tindakan ini tidak dapat dibatalkan.`)) return;
    
    startTransition(async () => {
      const res = await deleteOrderAction(id);
      if (res.success) {
        toast.success(`Pesanan ${invoice} berhasil dihapus`);
      } else {
        toast.error(res.error || "Gagal menghapus pesanan");
      }
    });
  };

  const handleExport = () => {
    const data = initialData.map((o, index) => ({
      "NO": (page - 1) * pageSize + index + 1,
      "TANGGAL": new Date(o.createdAt).toLocaleString("id-ID"),
      "INVOICE": o.invoiceNumber,
      "PELANGGAN": o.customerName,
      "TIPE": o.customerType || "B2C",
      "TELEPON": o.customerPhone || "-",
      "TOTAL": Number(o.grandTotal),
      "DP": Number(o.dpPaid),
      "SISA": Number(o.remainingBalance),
      "STATUS": o.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filterFields: FilterField[] = [
    { key: "q", label: "Cari Invoice/Nama/HP", type: "text", placeholder: "Cari..." },
    { key: "startDate", label: "Dari Tanggal", type: "date" },
    { key: "endDate", label: "Hingga Tanggal", type: "date" },
    { 
      key: "branchId", 
      label: "Cabang", 
      type: "select", 
      options: [
        { label: "SEMUA CABANG", value: "" },
        ...branches.map(b => ({ label: b.name, value: String(b.id) }))
      ]
    },
    { 
      key: "status", 
      label: "Status Bayar", 
      type: "select", 
      options: [
        { label: "SEMUA STATUS", value: "" },
        { label: "PENDING", value: "PENDING" },
        { label: "DP PAID", value: "DP_PAID" },
        { label: "FULL PAID", value: "FULL_PAID" },
        { label: "CANCELLED", value: "CANCELLED" }
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#102a43] tracking-tight flex items-center gap-2">
            <Package className="text-blue-600" size={24} />
            Manajemen Pesanan
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Daftar seluruh transaksi masuk dari POS dan Online.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedOrders.size > 0 && (
            <button 
              onClick={openBulkModal}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-green-700 transition-all"
            >
              <Send size={14} /> Kirim Notifikasi ({selectedOrders.size})
            </button>
          )}
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
          >
            <Download size={14} /> Export Excel
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-purple-700 transition-all"
          >
            <Upload size={14} /> Upload Orders
          </button>
          <Link 
            href="/pos"
            className="flex items-center gap-1.5 bg-[#102a43] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
          >
            <Plus size={14} /> Tambah Pesanan
          </Link>
        </div>
      </div>

      <FiltersBar fields={filterFields} />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200 font-black tracking-widest">
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === initialData.length && initialData.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                    aria-label="Pilih semua pesanan"
                  />
                </th>
                <th className="px-4 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">No. Invoice</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Metrik Finansial</th>
                <th className="px-6 py-4 text-center">Status Bayar</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 relative">
              {initialData.map((o, index) => (
                <tr 
                  key={o.id} 
                  className={`hover:bg-slate-50 transition-colors group ${selectedOrders.has(o.id) ? "bg-blue-50/50" : ""}`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                      className="rounded border-slate-300"
                      aria-label={`Pilih pesanan ${o.invoiceNumber}`}
                    />
                  </td>
                  <td className="px-4 py-4 text-center text-slate-400 font-mono">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-[#102a43] text-sm">{o.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{o.customerName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${o.customerType === 'B2B' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {o.customerType ?? "B2C"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium font-mono">{o.customerPhone ?? "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                        <span className="font-black text-[#102a43]">{formatIDR(o.grandTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[9px] font-black text-slate-400 uppercase">DP</span>
                        <span className="text-[10px] font-bold text-green-600">{formatIDR(o.dpPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center w-40">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Sisa</span>
                        <span className="text-[10px] font-bold text-red-500">{formatIDR(o.remainingBalance)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[o.status] || "bg-slate-100 text-slate-600"}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-slate-300 group-hover:text-slate-400 transition-colors">
                      <a
                        href={`/api/orders/${o.id}/invoice`}
                        target="_blank"
                        className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-200 hover:border-slate-300 transition-all hover:text-blue-600"
                        title="Cetak Invoice"
                      >
                        <Receipt size={14} />
                      </a>
                      {showPosEditOrder && (
                        <Link
                          href={`/pos?edit=${o.id}`}
                          className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-amber-100 hover:border-amber-300 transition-all hover:scale-105"
                          title="Edit di POS"
                        >
                          <Pencil size={14} />
                        </Link>
                      )}
                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-[#102a43] px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105"
                        title="Detail Pesanan"
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(o.id, o.invoiceNumber)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all hover:scale-105 disabled:opacity-50"
                        title="Hapus Pesanan"
                      >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-32 text-center opacity-30">
                    <ShoppingCart size={64} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-black text-xl text-slate-400">Belum ada pesanan ditemukan</p>
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

      {showUploadModal && (
        <UploadOrdersModal onClose={() => setShowUploadModal(false)} />
      )}

      {/* Bulk Send Notification Modal */}
      <Modal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Kirim Notifikasi Massal"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Pesanan dipilih:</p>
            <p className="font-bold text-slate-800">
              {selectedOrders.size} pesanan 
              ({initialData.filter(o => selectedOrders.has(o.id) && o.customerPhone).length} dengan nomor HP)
            </p>
          </div>

          <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
            {initialData.filter(o => selectedOrders.has(o.id)).map(o => (
              <div key={o.id} className="px-3 py-2 text-xs flex justify-between">
                <span className="font-medium">{o.customerName}</span>
                <span className="text-slate-500 font-mono">{o.customerPhone || "No HP -"}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <MessageSquare size={14} className="inline mr-1" />
              Pilih Template
            </label>
            <select
              value={selectedTemplateId || ""}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value) || null)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              aria-label="Pilih template notifikasi"
            >
              <option value="">-- Pilih Template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {selectedTemplateId && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Preview:</p>
              <div className="bg-slate-50 rounded-lg p-3 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto border">
                {templates.find(t => t.id === selectedTemplateId)?.templateText}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleBulkSend}
              disabled={sending || !selectedTemplateId}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50"
            >
              <Send size={16} />
              {sending ? "Mengirim..." : "Kirim Notifikasi"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
