"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
      }}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
    >
      <LogOut size={16} /> Logout
    </button>
  );
}

