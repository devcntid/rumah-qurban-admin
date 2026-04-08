"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setBusy(true);
        await fetch("/api/auth/login", { method: "POST" });
        if (!cancelled) router.replace("/dashboard");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          rumah<span className="text-red-600">qurban</span>
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Admin Portal
        </div>

        <div className="mt-8 text-sm text-slate-600">
          {busy ? "Sedang login otomatis..." : "Login selesai."}
        </div>

        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="mt-6 w-full rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900"
        >
          Masuk ke Dashboard
        </button>

        <div className="mt-4 text-xs text-slate-400">
          Mode simulasi: auto-login sebagai SUPER_ADMIN (branchId 1).
        </div>
      </div>
    </div>
  );
}

