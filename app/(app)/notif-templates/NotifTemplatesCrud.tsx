"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Search, Trash2, Edit2, Copy, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api, ApiException } from "@/lib/api/client";
import { toast } from "sonner";
import { AVAILABLE_TEMPLATE_VARIABLES } from "@/types/notifications";

type NotifTemplate = {
  id: number;
  name: string;
  templateText: string;
  createdAt: string;
};

type EditingState = {
  row: NotifTemplate | null;
};

const FIELD_CLASS =
  "w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

export function NotifTemplatesCrud() {
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<EditingState>({ row: null });
  const [showForm, setShowForm] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    templateText: "",
  });

  const pageSize = 10;

  const loadTemplates = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (search) params.set("q", search);

      const data = await api<{
        templates: NotifTemplate[];
        totalCount: number;
      }>(`/api/notif-templates?${params}`);

      setTemplates(data.templates);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Gagal memuat template");
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [page, search]);

  const openCreate = () => {
    setEditing({ row: null });
    setFormData({ name: "", templateText: "" });
    setShowForm(true);
  };

  const openEdit = (template: NotifTemplate) => {
    setEditing({ row: template });
    setFormData({
      name: template.name,
      templateText: template.templateText,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing({ row: null });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      try {
        const payload = {
          id: editing.row?.id,
          name: formData.name.trim(),
          templateText: formData.templateText.trim(),
        };

        await api("/api/notif-templates", { method: "POST", json: payload });
        toast.success(editing.row ? "Template berhasil diupdate" : "Template berhasil ditambahkan");
        await loadTemplates();
        closeForm();
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.message);
        } else {
          toast.error("Gagal menyimpan template");
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus template ini?")) return;

    start(async () => {
      try {
        await api(`/api/notif-templates?id=${id}`, { method: "DELETE" });
        toast.success("Template berhasil dihapus");
        await loadTemplates();
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.message);
        } else {
          toast.error("Gagal menghapus template");
        }
      }
    });
  };

  const insertVariable = (varName: string) => {
    const textArea = document.getElementById("templateText") as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const text = formData.templateText;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = `${before}{{${varName}}}${after}`;
      setFormData({ ...formData, templateText: newText });
      setTimeout(() => {
        textArea.focus();
        const newPos = start + varName.length + 4;
        textArea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      setFormData({
        ...formData,
        templateText: formData.templateText + `{{${varName}}}`,
      });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari template..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#102a43] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
          Tambah Template
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
              <th className="p-4 w-12">#</th>
              <th className="p-4">Nama Template</th>
              <th className="p-4">Preview</th>
              <th className="p-4 text-center w-32">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  {pending ? "Memuat..." : "Tidak ada template ditemukan"}
                </td>
              </tr>
            ) : (
              templates.map((template, idx) => (
                <tr key={template.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-500 font-mono">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800 bg-blue-50 px-2 py-1 rounded">
                      {template.name}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="line-clamp-2 max-w-lg whitespace-pre-wrap text-xs">
                      {template.templateText.substring(0, 200)}
                      {template.templateText.length > 200 ? "..." : ""}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(template)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={pending}
                        className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-50"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm text-slate-600">
            Menampilkan {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, totalCount)} dari {totalCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editing.row ? "Edit Template" : "Tambah Template Baru"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Nama Template
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={FIELD_CLASS}
              placeholder="contoh: VERIFIKASI_NAMA"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Gunakan format UPPERCASE_UNDERSCORE untuk identifikasi
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-slate-700">
                Isi Template
              </label>
              <button
                type="button"
                onClick={() => setShowVariables(!showVariables)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Info size={12} />
                {showVariables ? "Sembunyikan" : "Lihat"} Variabel
              </button>
            </div>

            {showVariables && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-blue-800 mb-2">
                  Klik untuk menyisipkan variabel:
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => insertVariable(v.name)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border border-blue-200 text-xs font-mono hover:bg-blue-100"
                      title={`${v.description} (contoh: ${v.example})`}
                    >
                      <Copy size={10} />
                      {`{{${v.name}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              id="templateText"
              value={formData.templateText}
              onChange={(e) => setFormData({ ...formData, templateText: e.target.value })}
              className={`${FIELD_CLASS} min-h-[300px] font-mono text-xs`}
              placeholder={`Assalamualaikum {{customer_name}}

Contoh template notifikasi...

Terima kasih,
x Rumah Qurban`}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Gunakan {"{{variable}}"} untuk placeholder yang akan diganti otomatis
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-[#102a43] text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
