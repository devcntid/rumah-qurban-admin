"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";

export function Pagination({
  page,
  pageSize,
  totalItems,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Ensure inputs are strictly treated as numbers
  const pSize = Number(pageSize) || 10;
  const pCurrent = Number(page) || 1;
  const total = Number(totalItems) || 0;

  const totalPages = Math.ceil(total / pSize);
  const startItem = total === 0 ? 0 : (pCurrent - 1) * pSize + 1;
  const endItem = Math.min(pCurrent * pSize, total);

  const createPageUrl = (targetPage: number) => {
    // Cloning searchParams safely using .toString()
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    params.set("pageSize", String(pSize));
    return `${pathname}?${params.toString()}`;
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", newSize);
    params.set("page", "1"); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };

  // Logic to generate page numbers with ellipses for middle pages
  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pCurrent > 4) pages.push("...");
      
      const start = Math.max(2, pCurrent - 2);
      const end = Math.min(totalPages - 1, pCurrent + 2);
      
      // Ensure we don't duplicate 1 or totalPages
      const finalStart = start < 2 ? 2 : start;
      const finalEnd = end > totalPages - 1 ? totalPages - 1 : end;
      
      for (let i = finalStart; i <= finalEnd; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (pCurrent < totalPages - 3) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 mt-2">
      {/* Total Data Info */}
      <div className="flex items-center gap-4">
        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          Showing <span className="text-[#102a43]">{startItem}</span> - <span className="text-[#102a43]">{endItem}</span> of <span className="text-[#102a43]">{total}</span> items
        </div>
        
        {/* Row per page Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Per Page:</span>
          <select 
            value={pSize} 
            onChange={handlePageSizeChange}
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5">
        <Link
          href={createPageUrl(1)}
          className={`p-2 rounded-lg border text-slate-500 transition-all ${
            pCurrent <= 1 
            ? "opacity-30 pointer-events-none bg-slate-50 border-slate-100" 
            : "bg-white border-slate-200 hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          }`}
          title="First Page"
        >
          <ChevronsLeft size={16} strokeWidth={2.5} />
        </Link>
        
        <Link
          href={createPageUrl(Math.max(1, pCurrent - 1))}
          className={`p-2 rounded-lg border text-slate-500 transition-all mr-1 ${
            pCurrent <= 1 
            ? "opacity-30 pointer-events-none bg-slate-50 border-slate-100" 
            : "bg-white border-slate-200 hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          }`}
          title="Previous Page"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </Link>

        {/* Page Numbers */}
        <div className="hidden md:flex items-center gap-1">
          {getPages().map((p, idx) => (
            typeof p === 'number' ? (
              <Link
                key={idx}
                href={createPageUrl(p)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-black transition-all ${
                  pCurrent === p 
                  ? "bg-[#102a43] text-white shadow-md shadow-slate-200" 
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {p}
              </Link>
            ) : (
              <span key={idx} className="w-6 text-center text-slate-400 text-xs font-bold font-mono">...</span>
            )
          ))}
        </div>

        <Link
          href={createPageUrl(Math.min(totalPages, pCurrent + 1))}
          className={`p-2 rounded-lg border text-slate-500 transition-all ml-1 ${
            pCurrent >= totalPages 
            ? "opacity-30 pointer-events-none bg-slate-50 border-slate-100" 
            : "bg-white border-slate-200 hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          }`}
          title="Next Page"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </Link>

        <Link
          href={createPageUrl(totalPages)}
          className={`p-2 rounded-lg border text-slate-500 transition-all ${
            pCurrent >= totalPages 
            ? "opacity-30 pointer-events-none bg-slate-50 border-slate-100" 
            : "bg-white border-slate-200 hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          }`}
          title="Last Page"
        >
          <ChevronsRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
