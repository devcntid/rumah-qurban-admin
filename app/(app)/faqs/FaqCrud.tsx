"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Filter, RotateCcw, Search, GripVertical } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api/client";
import dynamic from "next/dynamic";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TiptapEditor = dynamic(
  () => import("@/components/ui/TiptapEditor").then((mod) => mod.TiptapEditor),
  { ssr: false }
);

type Product = {
  id: number;
  code: string;
  name: string;
};

type FaqRow = {
  id: number;
  productId: number;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EditingState = {
  row: FaqRow | null;
};

const FIELD_CLASS =
  "w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

// Sortable Row Component
function SortableRow({
  faq,
  idx,
  startIdx,
  onEdit,
  onDelete,
  pending,
}: {
  faq: FaqRow;
  idx: number;
  startIdx: number;
  onEdit: (faq: FaqRow) => void;
  onDelete: (id: number) => void;
  pending: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-slate-100 hover:bg-slate-50"
    >
      <td className="p-4 text-center">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={20} />
        </button>
      </td>
      <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">
        {startIdx + idx + 1}
      </td>
      <td className="p-4 font-semibold text-slate-800">{faq.category}</td>
      <td className="p-4 text-slate-700 max-w-md">
        <div className="line-clamp-2">{faq.question}</div>
      </td>
      <td className="p-4 text-slate-700 max-w-md">
        <div
          className="line-clamp-2 prose prose-sm"
          dangerouslySetInnerHTML={{
            __html:
              faq.answer.substring(0, 200) +
              (faq.answer.length > 200 ? "..." : ""),
          }}
        />
      </td>
      <td className="p-4 text-slate-600 font-mono text-sm">
        {faq.displayOrder}
      </td>
      <td className="p-4">
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
            faq.isActive
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {faq.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </td>
      <td className="p-4 text-center">
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(faq)}
            className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(faq.id)}
            disabled={pending}
            className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
}

export function FaqCrud({ products }: { products: Product[] }) {
  const [selectedProductId, setSelectedProductId] = useState<number>(
    products[0]?.id || 1
  );
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [total, setTotal] = useState(0);

  console.log("FaqCrud initialized:", { 
    productsCount: products.length, 
    selectedProductId,
    faqsCount: faqs.length,
    total 
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ row: null });
  const [pending, start] = useTransition();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState<any>({});

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = faqs.findIndex((f) => f.id === active.id);
    const newIndex = faqs.findIndex((f) => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update UI
    const newFaqs = arrayMove(faqs, oldIndex, newIndex);
    setFaqs(newFaqs);

    // Update display_order for all affected items
    try {
      const updates = newFaqs.map((faq, index) => ({
        id: faq.id,
        displayOrder: index,
      }));

      // Batch update display orders
      await api("/api/faqs/reorder", {
        method: "POST",
        body: JSON.stringify({ updates }),
      });
    } catch (error) {
      console.error("Failed to update order:", error);
      // Revert on error
      loadFaqs();
    }
  };

  const loadFaqs = async () => {
    try {
      const params = new URLSearchParams({
        productId: String(selectedProductId),
        page: String(page),
        pageSize: String(pageSize),
      });

      if (categoryFilter) params.set("category", categoryFilter);
      if (searchFilter) params.set("search", searchFilter);
      if (activeFilter !== "all")
        params.set("isActive", activeFilter === "active" ? "true" : "false");

      console.log("loadFaqs called with:", { 
        selectedProductId, 
        page, 
        pageSize,
        url: `/api/faqs?${params.toString()}`
      });

      const result = await api<{ rows: FaqRow[]; total: number }>(
        `/api/faqs?${params.toString()}`
      );

      console.log("loadFaqs result:", { 
        rowsCount: result.rows?.length || 0, 
        total: result.total,
        firstRow: result.rows?.[0]
      });

      setFaqs(Array.isArray(result.rows) ? result.rows : []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading FAQs:", error);
      setFaqs([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, categoryFilter, searchFilter, activeFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedProductId, categoryFilter, searchFilter, activeFilter]);

  const categories = useMemo(() => {
    if (!Array.isArray(faqs)) return [];
    const set = new Set<string>();
    faqs.forEach((f) => set.add(f.category));
    return Array.from(set).sort();
  }, [faqs]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;

  const openNew = () => {
    setEditing({ row: null });
    setFormData({
      category: "",
      question: "",
      answer: "",
      displayOrder: 0,
      isActive: true,
    });
    setOpen(true);
  };

  const openEdit = (row: FaqRow) => {
    setEditing({ row });
    setFormData({
      category: row.category,
      question: row.question,
      answer: row.answer,
      displayOrder: row.displayOrder,
      isActive: row.isActive,
    });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const payload = {
        id: editing.row?.id,
        productId: selectedProductId,
        category: formData.category,
        question: formData.question,
        answer: formData.answer,
        displayOrder: Number(formData.displayOrder ?? 0),
        isActive: formData.isActive,
      };

      await api("/api/faqs", { method: "POST", json: payload });
      await loadFaqs();
      close();
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus FAQ ini?")) return;

    start(async () => {
      await api(`/api/faqs?id=${id}&productId=${selectedProductId}`, {
        method: "DELETE",
      });
      await loadFaqs();
    });
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setSelectedProductId(product.id)}
            className={`w-full text-left p-4 font-semibold transition-colors border-l-4 ${
              selectedProductId === product.id
                ? "text-[#1e3a5f] bg-blue-50 border-[#1e3a5f] font-bold"
                : "text-slate-600 border-transparent hover:bg-slate-50"
            }`}
          >
            {product.name}
          </button>
        ))}
      </div>

      <div className="col-span-12 md:col-span-9 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">
            FAQ: {selectedProduct?.name}
          </h3>
          <button
            type="button"
            onClick={openNew}
            className="rounded-md bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
          >
            + Tambah FAQ
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-slate-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter FAQ
            </span>
            <span className="text-xs text-slate-600">
              {total} FAQ ditemukan
            </span>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("");
                setSearchFilter("");
                setActiveFilter("all");
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Kategori
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Semua kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Cari
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari pertanyaan/jawaban..."
                  className={`${FIELD_CLASS} pl-10`}
                />
              </div>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
                <th className="p-4 w-12"></th>
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Pertanyaan</th>
                <th className="p-4">Jawaban</th>
                <th className="p-4 w-20">Order</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {faqs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-sm font-medium text-slate-600"
                  >
                    Tidak ada FAQ. Klik &quot;+ Tambah FAQ&quot; untuk membuat
                    yang baru.
                  </td>
                </tr>
              ) : (
                <SortableContext
                  items={faqs.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {faqs.map((faq, idx) => (
                    <SortableRow
                      key={faq.id}
                      faq={faq}
                      idx={idx}
                      startIdx={startIdx}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      pending={pending}
                    />
                  ))}
                </SortableContext>
              )}
            </tbody>
          </table>
        </DndContext>

        <div className="p-5 border-t bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">
              Menampilkan{" "}
              {total === 0
                ? "0"
                : `${startIdx + 1}-${Math.min(startIdx + pageSize, total)}`}{" "}
              dari {total} data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-xs font-black">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        title={editing.row ? "Edit FAQ" : "Tambah FAQ Baru"}
        onClose={close}
        maxWidthClassName="max-w-4xl"
      >
        <form
          onSubmit={handleSave}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-800">
              Kategori
            </label>
            <input
              value={formData.category || ""}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
              className={FIELD_CLASS}
              placeholder="Contoh: Qurban Antar"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-800">
              Pertanyaan
            </label>
            <textarea
              value={formData.question || ""}
              onChange={(e) => setFormData({...formData, question: e.target.value})}
              required
              rows={3}
              className={`${FIELD_CLASS} min-h-[5rem]`}
              placeholder="Tulis pertanyaan..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-2">
              Jawaban (Rich Text)
            </label>
            <TiptapEditor
              content={formData.answer || ""}
              onChange={(html) => setFormData({...formData, answer: html})}
              placeholder="Tulis jawaban dengan format rich text. Anda bisa paste atau drag & drop gambar."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder ?? 0}
                onChange={(e) => setFormData({...formData, displayOrder: Number(e.target.value)})}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Status
              </label>
              <select
                value={String(formData.isActive ?? true)}
                onChange={(e) => setFormData({...formData, isActive: e.target.value === "true"})}
                className={FIELD_CLASS}
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-md font-semibold hover:bg-blue-900 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
