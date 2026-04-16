"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Eye, 
  Search, 
  Download,
  TrendingUp,
  ShoppingCart
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { FiltersBar, FilterField } from "@/components/ui/FiltersBar";
import * as XLSX from "xlsx";
import { CustomerRow } from "@/lib/db/queries/customers";

function formatIDR(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatPhone(phone: string) {
  // Format: 628123456789 → +62 812-3456-789
  if (phone.startsWith("62")) {
    const withoutPrefix = phone.slice(2);
    const part1 = withoutPrefix.slice(0, 3);
    const part2 = withoutPrefix.slice(3, 7);
    const part3 = withoutPrefix.slice(7);
    return `+62 ${part1}-${part2}-${part3}`;
  }
  return phone;
}

const customerTypeColors: Record<string, string> = {
  B2C: "bg-blue-100 text-blue-700 border-blue-200",
  B2B: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function CustomersClient({
  initialData,
  totalCount,
  page,
  pageSize,
}: {
  initialData: CustomerRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const handleExport = () => {
    const data = initialData.map((c, index) => ({
      "NO": (page - 1) * pageSize + index + 1,
      "NAMA": c.name,
      "TELEPON": formatPhone(c.phoneNormalized),
      "EMAIL": c.email || "-",
      "TIPE": c.customerType || "B2C",
      "TOTAL ORDERS": c.totalOrders,
      "TOTAL BELANJA": Number(c.totalSpent),
      "FIRST ORDER": c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString("id-ID") : "-",
      "LAST ORDER": c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("id-ID") : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `Customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filterFields: FilterField[] = [
    { key: "q", label: "Cari Nama/HP/Email", type: "text", placeholder: "Cari..." },
    { 
      key: "customerType", 
      label: "Tipe Customer", 
      type: "select", 
      options: [
        { label: "SEMUA TIPE", value: "" },
        { label: "B2C (Personal)", value: "B2C" },
        { label: "B2B (Corporate)", value: "B2B" }
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#102a43] tracking-tight flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            Database Customers
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Tracking customer retensi dan lifetime value
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
          >
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      <FiltersBar fields={filterFields} />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200 font-black tracking-widest">
                <th className="px-6 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">Kontak</th>
                <th className="px-6 py-4 text-center">Tipe</th>
                <th className="px-6 py-4 text-right">Statistik</th>
                <th className="px-6 py-4 text-center">Last Order</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 relative">
              {initialData.map((c, index) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-center text-slate-600 font-mono">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                      {c.companyName && (
                        <span className="text-[10px] text-slate-500 mt-0.5">{c.companyName}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-slate-700">{formatPhone(c.phoneNormalized)}</span>
                      {c.email && (
                        <span className="text-[10px] text-slate-500">{c.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-[9px] font-black uppercase border ${customerTypeColors[c.customerType || 'B2C']}`}>
                      {c.customerType || "B2C"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex items-center gap-2">
                        <ShoppingCart size={12} className="text-slate-400" />
                        <span className="font-black text-slate-800">{c.totalOrders} order{c.totalOrders > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-green-500" />
                        <span className="font-bold text-green-600 text-[11px]">{formatIDR(c.totalSpent)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-[10px] text-slate-500">
                      {c.lastOrderDate 
                        ? new Date(c.lastOrderDate).toLocaleDateString("id-ID", { 
                            day: "2-digit", 
                            month: "short", 
                            year: "numeric" 
                          })
                        : "-"
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 text-[#102a43] px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105"
                      title="Lihat Detail"
                    >
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {initialData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <Users size={64} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-black text-xl text-slate-500">Belum ada customer ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t bg-slate-50/50">
          <Pagination page={page} pageSize={pageSize} totalItems={totalCount} />
        </div>
      </div>
    </div>
  );
}
