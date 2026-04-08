"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Pagination({
  page,
  pageSize,
  hasNext,
}: {
  page: number;
  pageSize: number;
  hasNext: boolean;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const mk = (nextPage: number) => {
    const p = new URLSearchParams(sp);
    p.set("page", String(nextPage));
    p.set("pageSize", String(pageSize));
    return `${pathname}?${p.toString()}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <div className="text-xs text-slate-500 font-semibold">
        Page {page} • PageSize {pageSize}
      </div>
      <div className="flex gap-2">
        <Link
          href={mk(Math.max(1, page - 1))}
          className={`px-3 py-2 rounded-md border text-xs font-bold ${
            page <= 1
              ? "pointer-events-none opacity-50 bg-slate-50 text-slate-400 border-slate-200"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Prev
        </Link>
        <Link
          href={mk(page + 1)}
          className={`px-3 py-2 rounded-md border text-xs font-bold ${
            !hasNext
              ? "pointer-events-none opacity-50 bg-slate-50 text-slate-400 border-slate-200"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

