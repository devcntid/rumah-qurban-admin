"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export type FilterField =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "number"; placeholder?: string }
  | { key: string; label: string; type: "date"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { label: string; value: string }[] };

export function FiltersBar({ fields }: { fields: FilterField[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initial = useMemo(() => {
    const obj: Record<string, string> = {};
    for (const f of fields) obj[f.key] = sp.get(f.key) ?? "";
    return obj;
  }, [fields, sp]);

  const [values, setValues] = useState<Record<string, string>>(initial);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const hasActiveFilters = useMemo(
    () => fields.some((f) => (values[f.key] ?? "").trim() !== ""),
    [fields, values]
  );

  const applyFilters = useCallback(() => {
    const next = new URLSearchParams(sp.toString());

    for (const f of fields) {
      const newVal = (values[f.key] ?? "").trim();
      if (!newVal) next.delete(f.key);
      else next.set(f.key, newVal);
    }

    next.set("page", "1");
    router.replace(`${pathname}?${next.toString()}`);
  }, [values, fields, pathname, router, sp]);

  const resetFilters = useCallback(() => {
    const empty: Record<string, string> = {};
    for (const f of fields) empty[f.key] = "";
    setValues(empty);

    const next = new URLSearchParams();
    next.set("page", "1");
    router.replace(`${pathname}?${next.toString()}`);
  }, [fields, pathname, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    },
    [applyFilters]
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="grid grid-cols-12 gap-3" onKeyDown={handleKeyDown}>
        {fields.map((f) => (
          <div key={f.key} className="col-span-12 md:col-span-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
              {f.label}
            </label>
            {f.type === "select" ? (
              <select
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [f.key]: e.target.value }))
                }
                aria-label={f.label}
                className="w-full border border-slate-300 rounded-md p-2 text-xs outline-none bg-slate-50"
              >
                <option value="">Semua</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [f.key]: e.target.value }))
                }
                type={f.type}
                placeholder={f.placeholder}
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={applyFilters}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#162d4a] transition-colors"
        >
          <Search size={14} />
          Cari
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            <X size={14} />
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
}
