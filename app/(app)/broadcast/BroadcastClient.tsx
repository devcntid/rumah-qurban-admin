"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Search,
  Send,
  Filter,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { api, ApiException } from "@/lib/api/client";
import { toast } from "sonner";
import type { NotifTemplate } from "@/types/notifications";

type Branch = { id: number; name: string };
type Product = { id: number; code: string; name: string };

type OrderRow = {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  createdAt: string;
};

type BroadcastStatusEntry = {
  templateId: number;
  templateName: string;
  sentAt: string;
};

type BroadcastStatusMap = Record<number, BroadcastStatusEntry[]>;

type Props = {
  branches: Branch[];
  products: Product[];
};

const FIELD_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function BroadcastClient({ branches, products }: Props) {
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatusMap>(
    {}
  );
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string>("");
  const [pending, start] = useTransition();
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  const [filters, setFilters] = useState({
    branchId: "",
    status: "",
    productCode: "",
    search: "",
    startDate: "",
    endDate: "",
    sentTemplateId: "",
    notSentTemplateId: "",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadTemplates = async () => {
    try {
      const data = await api<{ templates: NotifTemplate[] }>(
        "/api/notif-templates?all=true"
      );
      setTemplates(data.templates);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadBroadcastStatus = useCallback(async (orderIds: number[]) => {
    if (orderIds.length === 0) {
      setBroadcastStatus({});
      return;
    }
    try {
      const data = await api<BroadcastStatusMap>(
        `/api/orders/broadcast-status?orderIds=${orderIds.join(",")}`
      );
      setBroadcastStatus(data ?? {});
    } catch {
      setBroadcastStatus({});
    }
  }, []);

  const loadOrders = async () => {
    start(async () => {
      try {
        const params = new URLSearchParams();
        params.set("pageSize", "100");
        if (filters.branchId) params.set("branchId", filters.branchId);
        if (filters.status) params.set("status", filters.status);
        if (filters.search) params.set("q", filters.search);
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);
        if (filters.sentTemplateId)
          params.set("sentTemplateId", filters.sentTemplateId);
        if (filters.notSentTemplateId)
          params.set("notSentTemplateId", filters.notSentTemplateId);

        const data = await api<OrderRow[]>(`/api/orders/search?${params}`);

        let filteredOrders = data || [];

        if (filters.productCode) {
          filteredOrders = filteredOrders.filter((o) =>
            o.invoiceNumber.includes(filters.productCode)
          );
        }

        setOrders(filteredOrders);
        setSelectedOrders(new Set());

        const ids = filteredOrders
          .filter((o) => o.customerPhone)
          .map((o) => o.id);
        loadBroadcastStatus(ids);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
        setBroadcastStatus({});
      }
    });
  };

  const toggleSelectAll = () => {
    const phoneOrders = orders.filter((o) => o.customerPhone);
    if (selectedOrders.size === phoneOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(phoneOrders.map((o) => o.id)));
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

  const loadPreview = async () => {
    if (!selectedTemplate || selectedOrders.size === 0) return;

    const firstOrderId = Array.from(selectedOrders)[0];
    try {
      const data = await api<{
        success: boolean;
        message?: string;
        error?: string;
      }>("/api/notifications/send", {
        method: "POST",
        json: {
          orderId: firstOrderId,
          templateId: selectedTemplate,
          preview: true,
        },
      });

      if (data.success && data.message) {
        setPreviewMessage(data.message);
      }
    } catch {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        setPreviewMessage(template.templateText);
      }
    }
  };

  useEffect(() => {
    if (selectedTemplate && selectedOrders.size > 0) {
      loadPreview();
    } else {
      setPreviewMessage("");
    }
  }, [selectedTemplate, selectedOrders.size]);

  const handleBroadcast = async () => {
    if (!selectedTemplate || selectedOrders.size === 0) {
      toast.error("Pilih template dan minimal 1 order");
      return;
    }

    if (!confirm(`Kirim notifikasi ke ${selectedOrders.size} pelanggan?`)) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const data = await api<{
        success: boolean;
        successCount: number;
        failedCount: number;
        errors: string[];
      }>("/api/notifications/broadcast", {
        method: "POST",
        json: {
          orderIds: Array.from(selectedOrders),
          templateId: selectedTemplate,
        },
      });

      setSendResult({
        successCount: data.successCount,
        failedCount: data.failedCount,
        errors: data.errors || [],
      });

      if (data.successCount > 0) {
        toast.success(`Berhasil mengirim ${data.successCount} notifikasi`);
      }
      if (data.failedCount > 0) {
        toast.error(`${data.failedCount} notifikasi gagal terkirim`);
      }

      const ids = orders.filter((o) => o.customerPhone).map((o) => o.id);
      loadBroadcastStatus(ids);
    } catch (error) {
      if (error instanceof ApiException) {
        toast.error(error.message);
      } else {
        toast.error("Gagal mengirim broadcast");
      }
    } finally {
      setSending(false);
    }
  };

  const ordersWithPhone = orders.filter((o) => o.customerPhone);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Filters & Order List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-800">Filter Pesanan</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Cabang
              </label>
              <select
                value={filters.branchId}
                onChange={(e) =>
                  setFilters({ ...filters, branchId: e.target.value })
                }
                className={FIELD_CLASS}
              >
                <option value="">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className={FIELD_CLASS}
              >
                <option value="">Semua Status</option>
                <option value="FULL_PAID">FULL PAID</option>
                <option value="DP_PAID">DP PAID</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Produk
              </label>
              <select
                value={filters.productCode}
                onChange={(e) =>
                  setFilters({ ...filters, productCode: e.target.value })
                }
                className={FIELD_CLASS}
              >
                <option value="">Semua Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Cari
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Nama/No HP/Invoice"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className={`${FIELD_CLASS} pl-9`}
                />
              </div>
            </div>
          </div>

          {/* Template-based filters */}
          {templates.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-green-700 mb-1">
                  Sudah Dikirim Template
                </label>
                <select
                  value={filters.sentTemplateId}
                  onChange={(e) =>
                    setFilters({ ...filters, sentTemplateId: e.target.value })
                  }
                  className={FIELD_CLASS}
                >
                  <option value="">-- Semua --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-red-600 mb-1">
                  Belum Dikirim Template
                </label>
                <select
                  value={filters.notSentTemplateId}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      notSentTemplateId: e.target.value,
                    })
                  }
                  className={FIELD_CLASS}
                >
                  <option value="">-- Semua --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Order List */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-500" />
              <span className="font-bold text-slate-800">
                {ordersWithPhone.length} Pesanan dengan No HP
              </span>
              {selectedOrders.size > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                  {selectedOrders.size} dipilih
                </span>
              )}
            </div>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              {selectedOrders.size === ordersWithPhone.length
                ? "Batal Pilih Semua"
                : "Pilih Semua"}
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {pending ? (
              <div className="p-8 text-center text-slate-500">Memuat...</div>
            ) : ordersWithPhone.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Tidak ada pesanan dengan nomor HP
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-xs text-slate-600 font-bold">
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          ordersWithPhone.length > 0 &&
                          selectedOrders.size === ordersWithPhone.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left">Invoice</th>
                    <th className="p-3 text-left">Pelanggan</th>
                    <th className="p-3 text-left">No HP</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Status WA</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersWithPhone.map((order) => {
                    const sentTemplates = broadcastStatus[order.id] || [];

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${
                          selectedOrders.has(order.id) ? "bg-blue-50" : ""
                        }`}
                        onClick={() => toggleSelect(order.id)}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {order.invoiceNumber}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {order.customerName}
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-xs">
                          {order.customerPhone}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              order.status === "FULL_PAID"
                                ? "bg-green-100 text-green-700"
                                : order.status === "DP_PAID"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {sentTemplates.length === 0 ? (
                            <span className="text-slate-400 text-xs">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {sentTemplates.map((st) => (
                                <span
                                  key={st.templateId}
                                  title={`Terkirim: ${formatDate(st.sentAt)}`}
                                  className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold leading-tight cursor-default"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {st.templateName}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Template & Send */}
      <div className="space-y-4">
        {/* Template Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-800">Pilih Template</h3>
          </div>
          <select
            value={selectedTemplate || ""}
            onChange={(e) =>
              setSelectedTemplate(Number(e.target.value) || null)
            }
            className={FIELD_CLASS}
          >
            <option value="">-- Pilih Template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {selectedTemplate && previewMessage && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-600 mb-2">
                Preview Pesan:
              </label>
              <div className="bg-slate-50 rounded-lg p-3 text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto border border-slate-200">
                {previewMessage}
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <button
            onClick={handleBroadcast}
            disabled={
              sending || !selectedTemplate || selectedOrders.size === 0
            }
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
            {sending
              ? "Mengirim..."
              : `Kirim ke ${selectedOrders.size} Pelanggan`}
          </button>

          {selectedOrders.size === 0 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Pilih minimal 1 pesanan untuk mengirim
            </p>
          )}
        </div>

        {/* Result */}
        {sendResult && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-3">
              Hasil Pengiriman
            </h3>
            <div className="space-y-2">
              {sendResult.successCount > 0 && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">
                    {sendResult.successCount} berhasil terkirim
                  </span>
                </div>
              )}
              {sendResult.failedCount > 0 && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">
                    {sendResult.failedCount} gagal terkirim
                  </span>
                </div>
              )}
              {sendResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-slate-600 mb-1">
                    Error:
                  </p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {sendResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>&#x2022; {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
