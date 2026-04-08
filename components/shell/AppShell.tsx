"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import type { ReactNode } from "react";
import { MENU_ITEMS } from "@/components/shell/menu";
import { LogoutButton } from "@/components/shell/LogoutButton";
import type { AdminSession } from "@/lib/auth/session";

export function AppShell({
  session,
  children,
}: {
  session: AdminSession;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active =
    MENU_ITEMS.find((m) => pathname === m.href || pathname.startsWith(`${m.href}/`))
      ?.id ?? "dashboard";

  const activeItem = MENU_ITEMS.find((m) => m.id === active);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <aside className="w-72 bg-[#1e3a5f] text-white flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-6 pb-8">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="text-red-500 fill-red-500" size={28} />
            <span className="font-bold text-2xl tracking-tight">
              rumah<span className="text-red-500">qurban</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest pl-9">
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 space-y-1 px-3">
          {MENU_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-800 text-white shadow-inner font-medium"
                    : "text-slate-200 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 mt-auto">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold">
              {session.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{session.name}</p>
              <p className="text-[10px] text-slate-300">
                {session.role} • Branch {session.branchId}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-slate-400">{activeItem?.icon}</span>
            <span className="font-semibold text-sm">{activeItem?.label}</span>
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            Simulasi Login
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

