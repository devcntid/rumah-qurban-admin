"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FilterField =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "number"; placeholder?: string }
  | { key: string; label: string; type: "date"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { label: string; value: string }[] };

export function FiltersBar({
  fields,
  debounceMs = 300,
}: {
  fields: FilterField[];
  debounceMs?: number;
}) {
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

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      
      let hasChanged = false;
      for (const f of fields) {
        const currentVal = sp.get(f.key) ?? "";
        const newVal = (values[f.key] ?? "").trim();
        
        if (currentVal !== newVal) {
          hasChanged = true;
          if (!newVal) next.delete(f.key);
          else next.set(f.key, newVal);
        }
      }

      if (hasChanged) {
        next.set("page", "1");
        router.replace(`${pathname}?${next.toString()}`);
      }
    }, debounceMs);
    return () => clearTimeout(t);
  }, [JSON.stringify(values), debounceMs, fields, pathname, router, sp]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="grid grid-cols-12 gap-3">
        {fields.map((f) => (
          <div key={f.key} className="col-span-12 md:col-span-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
              {f.label}
            </label>
            {f.type === "select" ? (
              <select
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
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
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                type={f.type}
                placeholder={f.placeholder}
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

