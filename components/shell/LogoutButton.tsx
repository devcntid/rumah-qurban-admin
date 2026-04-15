"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
    >
      <LogOut size={16} /> Logout
    </button>
  );
}

