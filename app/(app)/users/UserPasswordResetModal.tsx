"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api, ApiException } from "@/lib/api/client";

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

const FIELD_CLASS =
  "w-full rounded-md border border-slate-400 bg-white px-3 py-2 pr-10 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

export function UserPasswordResetModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword)) {
      setError("Password harus mengandung huruf");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password harus mengandung angka");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password dan konfirmasi tidak cocok");
      return;
    }

    start(async () => {
      try {
        await api("/api/admin-users/password", {
          method: "POST",
          json: {
            userId: user?.id,
            newPassword,
          },
        });
        toast.success("Password berhasil diubah!");
        setNewPassword("");
        setConfirmPassword("");
        onSuccess();
        onClose();
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.errorData.error || err.message);
        } else {
          setError("Gagal mengubah password. Silakan coba lagi.");
        }
      }
    });
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Modal
      open={!!user}
      title={`Reset Password: ${user?.fullName}`}
      onClose={handleClose}
      maxWidthClassName="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <p className="font-semibold">Perhatian:</p>
          <p className="text-xs mt-1">
            User akan menggunakan password baru ini untuk login. Pastikan
            password aman dan sampaikan ke user yang bersangkutan.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-800 block mb-1">
            Password Baru *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className={FIELD_CLASS}
              placeholder="Minimal 8 karakter"
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

        <div>
          <label className="text-xs font-semibold text-slate-800 block mb-1">
            Konfirmasi Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={FIELD_CLASS}
              placeholder="Ketik ulang password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-amber-600 text-white py-2 rounded-md font-semibold hover:bg-amber-700 disabled:opacity-50"
          >
            {pending ? "Menyimpan..." : "Reset Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
