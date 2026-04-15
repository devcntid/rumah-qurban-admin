"use client";

import { useEffect, useState, useTransition } from "react";
import { Filter, RotateCcw, Search, Key, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { api, ApiException } from "@/lib/api/client";
import { UserPasswordResetModal } from "./UserPasswordResetModal";

type Branch = {
  id: number;
  name: string;
};

type AdminUserRow = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  branchId: number | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type EditingState = {
  row: AdminUserRow | null;
};

const FIELD_CLASS =
  "w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

const FIELD_PASSWORD_CLASS =
  "w-full rounded-md border border-slate-400 bg-white px-3 py-2 pr-10 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

export function UserCrud({ branches }: { branches: Branch[] }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ row: null });
  const [pending, start] = useTransition();

  const [roleFilter, setRoleFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [passwordResetUser, setPasswordResetUser] =
    useState<AdminUserRow | null>(null);

  const [selectedRole, setSelectedRole] = useState("ADMIN_BRANCH");
  const [showPassword, setShowPassword] = useState(false);

  const loadUsers = async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (roleFilter) params.set("role", roleFilter);
    if (branchFilter) params.set("branchId", branchFilter);
    if (searchFilter) params.set("search", searchFilter);
    if (activeFilter !== "all")
      params.set("isActive", activeFilter === "active" ? "true" : "false");

    const result = await api<{ rows: AdminUserRow[]; total: number }>(
      `/api/admin-users?${params.toString()}`
    );
    setUsers(result.rows);
    setTotal(result.total);
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, branchFilter, searchFilter, activeFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, branchFilter, searchFilter, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;

  const openNew = () => {
    setEditing({ row: null });
    setSelectedRole("ADMIN_BRANCH");
    setShowPassword(false);
    setOpen(true);
  };

  const openEdit = (row: AdminUserRow) => {
    setEditing({ row });
    setSelectedRole(row.role || "ADMIN_BRANCH");
    setShowPassword(false);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const handleSave = async (formData: FormData) => {
    start(async () => {
      try {
        const role = String(formData.get("role") ?? "");
        const branchId = formData.get("branchId");

        const payload: any = {
          id: editing.row?.id,
          email: String(formData.get("email") ?? ""),
          fullName: String(formData.get("fullName") ?? ""),
          role,
          branchId:
            role === "ADMIN_BRANCH" && branchId ? Number(branchId) : null,
          isActive: String(formData.get("isActive") ?? "true") === "true",
        };

        if (!editing.row) {
          payload.password = String(formData.get("password") ?? "");
        }

        await api("/api/admin-users", { method: "POST", json: payload });
        toast.success(editing.row ? "User berhasil diupdate" : "User berhasil ditambahkan");
        await loadUsers();
        close();
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.errorData.error || error.message);
        } else {
          toast.error("Terjadi kesalahan. Silakan coba lagi.");
        }
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    start(async () => {
      try {
        await api(`/api/admin-users?id=${id}`, { method: "DELETE" });
        toast.success("User berhasil dihapus");
        await loadUsers();
      } catch (error) {
        if (error instanceof ApiException) {
          toast.error(error.errorData.error || error.message);
        } else {
          toast.error("Terjadi kesalahan. Silakan coba lagi.");
        }
      }
    });
  };

  const getBranchName = (branchId: number | null) => {
    if (!branchId) return "-";
    return (
      branches.find((b) => b.id === branchId)?.name ?? `Branch #${branchId}`
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Admin Users</h3>
          <button
            type="button"
            onClick={openNew}
            className="rounded-md bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
          >
            + Tambah User
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-slate-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filter Users
            </span>
            <span className="text-xs text-slate-600">{total} users</span>
            <button
              type="button"
              onClick={() => {
                setRoleFilter("");
                setBranchFilter("");
                setSearchFilter("");
                setActiveFilter("all");
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Semua role</option>
                <option value="SUPERADMIN">Superadmin</option>
                <option value="ADMIN_BRANCH">Admin Branch</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Branch
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Semua branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
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
                  placeholder="Nama atau email..."
                  className={`${FIELD_CLASS} pl-10`}
                />
              </div>
            </div>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
              <th className="p-4 w-16 text-center">No</th>
              <th className="p-4">Nama</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Branch</th>
              <th className="p-4">Last Login</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-10 text-center text-sm font-medium text-slate-600"
                >
                  Tidak ada user. Klik &quot;+ Tambah User&quot; untuk membuat
                  yang baru.
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">
                    {startIdx + idx + 1}
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    {user.fullName}
                  </td>
                  <td className="p-4 text-slate-700">{user.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        user.role === "SUPERADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "SUPERADMIN"
                        ? "Superadmin"
                        : "Admin Branch"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {getBranchName(user.branchId)}
                  </td>
                  <td className="p-4 text-slate-600 text-xs">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordResetUser(user)}
                        className="px-3 py-1.5 rounded border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        title="Reset Password"
                      >
                        <Key size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        disabled={pending}
                        className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

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
        title={editing.row ? "Edit User" : "Tambah User Baru"}
        onClose={close}
        maxWidthClassName="max-w-2xl"
      >
        <form key={editing.row?.id || 'new'} action={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Email *
              </label>
              <input
                name="email"
                type="email"
                defaultValue={editing.row?.email ?? ""}
                required
                className={FIELD_CLASS}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Nama Lengkap *
              </label>
              <input
                name="fullName"
                defaultValue={editing.row?.fullName ?? ""}
                required
                className={FIELD_CLASS}
                placeholder="John Doe"
              />
            </div>
          </div>

          {!editing.row && (
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Password *
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className={FIELD_PASSWORD_CLASS}
                  placeholder="Minimal 8 karakter, kombinasi huruf & angka"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Minimal 8 karakter, harus mengandung huruf dan angka
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Role *
              </label>
              <select
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
                className={FIELD_CLASS}
              >
                <option value="SUPERADMIN">Superadmin</option>
                <option value="ADMIN_BRANCH">Admin Branch</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Branch
              </label>
              <select
                name="branchId"
                disabled={selectedRole === "SUPERADMIN"}
                defaultValue={editing.row?.branchId?.toString() ?? ""}
                className={FIELD_CLASS}
              >
                <option value="">- Pilih Branch -</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Wajib untuk Admin Branch, kosong untuk Superadmin
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800">
              Status
            </label>
            <select
              name="isActive"
              defaultValue={
                editing.row?.isActive !== undefined
                  ? String(editing.row.isActive)
                  : "true"
              }
              className={FIELD_CLASS}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
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

      <UserPasswordResetModal
        user={passwordResetUser}
        onClose={() => setPasswordResetUser(null)}
        onSuccess={loadUsers}
      />
    </>
  );
}
