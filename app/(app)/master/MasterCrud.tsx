"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type {
  AnimalVariantBranchLinkRow,
  AnimalVariantRow,
  BranchRow,
  PaymentMethodRow,
  SalesAgentRow,
  VendorRow,
} from "@/lib/db/queries/master";
import type { ServiceRow } from "@/lib/db/queries/services";
import { api } from "@/lib/api/client";

type Tab =
  | "branches"
  | "vendors"
  | "payments"
  | "sales"
  | "animalVariants"
  | "services";
type EditingState =
  | { tab: "branches"; row: BranchRow }
  | { tab: "vendors"; row: VendorRow }
  | { tab: "payments"; row: PaymentMethodRow }
  | { tab: "sales"; row: SalesAgentRow }
  | { tab: "animalVariants"; row: AnimalVariantRow }
  | { tab: "services"; row: ServiceRow }
  | null;

/** Selaras dengan seed `scripts/seed.ts` */
const ANIMAL_SPECIES_OPTIONS = ["Sapi", "Domba", "Kambing"] as const;
const ANIMAL_CLASS_GRADE_OPTIONS = ["A", "B", "C", "D", "E", "F", "-"] as const;

/** Input/select/textarea di modal — teks gelap & border jelas (hindari “menyatu” dengan background) */
const MASTER_FIELD_CLASS =
  "w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/25";

function serviceBranchLabel(branchId: number | null, branches: BranchRow[]): string {
  if (branchId == null) return "Nasional";
  return branches.find((b) => b.id === branchId)?.name ?? `Cabang #${branchId}`;
}

function serviceVariantLabel(
  animalVariantId: number | null,
  variants: AnimalVariantRow[],
): string {
  if (animalVariantId == null) return "—";
  const v = variants.find((x) => x.id === animalVariantId);
  if (!v) return `Varian #${animalVariantId}`;
  const parts = [v.species, v.classGrade ? `Kelas ${v.classGrade}` : null, v.weightRange].filter(Boolean);
  return `${parts.join(" · ")} (#${v.id})`;
}

export function MasterCrud({
  branches,
  vendors,
  payments,
  salesAgents,
  animalVariants,
  variantBranchLinks,
  services,
}: {
  branches: BranchRow[];
  vendors: VendorRow[];
  payments: PaymentMethodRow[];
  salesAgents: SalesAgentRow[];
  animalVariants: AnimalVariantRow[];
  variantBranchLinks: AnimalVariantBranchLinkRow[];
  services: ServiceRow[];
}) {
  const [tab, setTab] = useState<Tab>("branches");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState>(null);
  const [pending, start] = useTransition();

  const [variantFilterSpecies, setVariantFilterSpecies] = useState("");
  const [variantFilterGrade, setVariantFilterGrade] = useState("");
  const [variantFilterBranchId, setVariantFilterBranchId] = useState("");
  const [variantFilterSearch, setVariantFilterSearch] = useState("");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const speciesFilterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of ANIMAL_SPECIES_OPTIONS) set.add(s);
    for (const a of animalVariants) {
      if (a.species?.trim()) set.add(a.species.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [animalVariants]);

  const classGradeFilterOptions = useMemo(() => {
    const set = new Set<string>();
    for (const g of ANIMAL_CLASS_GRADE_OPTIONS) set.add(g);
    for (const a of animalVariants) {
      const g = a.classGrade?.trim();
      if (g) set.add(g);
    }
    return Array.from(set).sort((a, b) => {
      if (a === "-") return 1;
      if (b === "-") return -1;
      return a.localeCompare(b, "id");
    });
  }, [animalVariants]);

  const animalVariantsFiltered = useMemo(() => {
    const branchIdNum = variantFilterBranchId ? Number(variantFilterBranchId) : NaN;
    const variantIdsForBranch =
      variantFilterBranchId !== "" && Number.isFinite(branchIdNum)
        ? new Set(
            variantBranchLinks
              .filter((l) => l.branchId === branchIdNum)
              .map((l) => l.variantId),
          )
        : null;

    const q = variantFilterSearch.trim().toLowerCase();

    return animalVariants.filter((a) => {
      if (variantIdsForBranch !== null) {
        if (variantIdsForBranch.size === 0) return false;
        if (!variantIdsForBranch.has(a.id)) return false;
      }
      if (variantFilterSpecies && a.species !== variantFilterSpecies) return false;
      if (variantFilterGrade) {
        const g = (a.classGrade ?? "").trim() || "-";
        if (g !== variantFilterGrade) return false;
      }
      if (q) {
        const haystack = [
          String(a.id),
          a.species,
          a.classGrade,
          a.weightRange,
          a.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    animalVariants,
    variantBranchLinks,
    variantFilterBranchId,
    variantFilterSpecies,
    variantFilterGrade,
    variantFilterSearch,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    variantFilterSpecies,
    variantFilterGrade,
    variantFilterBranchId,
    variantFilterSearch,
  ]);
  
  // Get current data
  const getCurrentData = () => {
    switch (tab) {
      case "branches": return branches;
      case "vendors": return vendors;
      case "payments": return payments;
      case "sales": return salesAgents;
      case "animalVariants": return animalVariantsFiltered;
      case "services": return services;
    }
  };
  
  const currentData = getCurrentData();
  const totalItems = currentData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedData = currentData.slice(startIdx, endIdx);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const title = useMemo(() => {
    switch (tab) {
      case "branches":
        return "Cabang";
      case "vendors":
        return "Vendor/Kandang";
      case "payments":
        return "Metode Pembayaran";
      case "sales":
        return "Sales Agents";
      case "animalVariants":
        return "Varian Hewan";
      case "services":
        return "Jasa (Ongkir/Potong)";
    }
  }, [tab]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (nextTab: Tab, row: unknown) => {
    setEditing({ tab: nextTab, row } as EditingState);
    setOpen(true);
  };

  const close = () => setOpen(false);
  
  // Handle tab change with page reset
  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setPage(1);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {(
          [
            ["branches", "BRANCHES"],
            ["vendors", "VENDORS"],
            ["payments", "PAYMENTS"],
            ["sales", "SALES"],
            ["animalVariants", "ANIMAL VARIANTS"],
            ["services", "SERVICES"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTabChange(key)}
            className={`w-full text-left p-4 font-semibold transition-colors border-l-4 ${
              tab === key
                ? "text-[#1e3a5f] bg-blue-50 border-[#1e3a5f] font-bold"
                : "text-slate-600 border-transparent hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="col-span-12 md:col-span-9 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Master: {title}</h3>
          <button
            type="button"
            onClick={openNew}
            className="rounded-md bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
          >
            + Tambah
          </button>
        </div>

        {tab === "branches" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">COA</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(paginatedData as BranchRow[]).map((b, idx) => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">{startIdx + idx + 1}</td>
                  <td className="p-4 font-semibold text-slate-700">{b.id}</td>
                  <td className="p-4 font-semibold text-slate-800">{b.name}</td>
                  <td className="p-4 font-mono text-xs text-blue-600">{b.coaCode ?? "-"}</td>
                  <td className="p-4">{b.isActive ? "Aktif" : "Nonaktif"}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit("branches", b)}
                        className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <form
                        action={() =>
                          start(async () => {
                            await api(`/api/master/branches?id=${b.id}`, { method: "DELETE" });
                          })
                        }
                      >
                        <button
                          type="submit"
                          disabled={pending}
                          className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "vendors" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Lokasi</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(paginatedData as VendorRow[]).map((v, idx) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">{startIdx + idx + 1}</td>
                  <td className="p-4 font-semibold text-slate-800 tabular-nums">{v.id}</td>
                  <td className="p-4 font-semibold text-slate-800">{v.name}</td>
                  <td className="p-4 text-slate-600">{v.location ?? "-"}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit("vendors", v)}
                        className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <form
                        action={() =>
                          start(async () => {
                            await api(`/api/master/vendors?id=${v.id}`, { method: "DELETE" });
                          })
                        }
                      >
                        <button
                          type="submit"
                          disabled={pending}
                          className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "payments" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">ID</th>
                <th className="p-4">Code</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Bank / Rek</th>
                <th className="p-4">COA</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(paginatedData as PaymentMethodRow[]).map((p, idx) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">{startIdx + idx + 1}</td>
                  <td className="p-4 font-semibold text-slate-800 tabular-nums">{p.id}</td>
                  <td className="p-4 font-mono text-xs text-blue-600">{p.code}</td>
                  <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                  <td className="p-4 text-slate-600">{p.category}</td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-slate-800">{p.bankName ?? "-"}</div>
                    <div className="text-[10px] font-mono text-slate-700">{p.accountNumber ?? "-"}</div>
                    {p.accountHolderName && <div className="text-[10px] text-slate-700">a.n. {p.accountHolderName}</div>}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-700">{p.coaCode ?? "-"}</td>
                  <td className="p-4">{p.isActive ? "Aktif" : "Nonaktif"}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit("payments", p)}
                        className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <form
                        action={() =>
                          start(async () => {
                            await api(`/api/master/payment-methods?id=${p.id}`, {
                              method: "DELETE",
                            });
                          })
                        }
                      >
                        <button
                          type="submit"
                          disabled={pending}
                          className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "sales" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">HP</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(paginatedData as SalesAgentRow[]).map((s, idx) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">{startIdx + idx + 1}</td>
                  <td className="p-4 font-semibold text-slate-800 tabular-nums">{s.id}</td>
                  <td className="p-4 font-semibold text-slate-800">{s.name}</td>
                  <td className="p-4 text-slate-600">{s.category}</td>
                  <td className="p-4 text-slate-600">{s.phone}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit("sales", s)}
                        className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <form
                        action={() =>
                          start(async () => {
                            await api(`/api/master/sales-agents?id=${s.id}`, {
                              method: "DELETE",
                            });
                          })
                        }
                      >
                        <button
                          type="submit"
                          disabled={pending}
                          className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "animalVariants" && (
          <>
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={16} className="text-slate-600 shrink-0" aria-hidden />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Filter varian
                </span>
                <span className="text-xs text-slate-600">
                  {animalVariantsFiltered.length} dari {animalVariants.length} varian
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVariantFilterSpecies("");
                    setVariantFilterGrade("");
                    setVariantFilterBranchId("");
                    setVariantFilterSearch("");
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw size={14} aria-hidden />
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    Species
                  </label>
                  <select
                    value={variantFilterSpecies}
                    onChange={(e) => setVariantFilterSpecies(e.target.value)}
                    aria-label="Filter species"
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="">Semua species</option>
                    {speciesFilterOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    Kelas
                  </label>
                  <select
                    value={variantFilterGrade}
                    onChange={(e) => setVariantFilterGrade(e.target.value)}
                    aria-label="Filter kelas"
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="">Semua kelas</option>
                    {classGradeFilterOptions.map((g) => (
                      <option key={g} value={g}>
                        {g === "-" ? "Tidak berkelas (-)" : g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    Cabang (penggunaan)
                  </label>
                  <select
                    value={variantFilterBranchId}
                    onChange={(e) => setVariantFilterBranchId(e.target.value)}
                    aria-label="Filter cabang"
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="">Semua cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] leading-snug text-slate-600">
                    Hanya varian yang terhubung ke cabang ini lewat katalog, jasa, atau inventaris farm.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    Cari teks
                  </label>
                  <input
                    type="search"
                    value={variantFilterSearch}
                    onChange={(e) => setVariantFilterSearch(e.target.value)}
                    placeholder="ID, berat, deskripsi…"
                    aria-label="Cari varian"
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
                  <th className="p-4 w-16 text-center">No</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Species</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Rentang berat</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(paginatedData as AnimalVariantRow[]).length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-sm font-medium text-slate-600"
                    >
                      Tidak ada varian yang cocok dengan filter. Ubah filter atau klik Reset.
                    </td>
                  </tr>
                ) : (
                  (paginatedData as AnimalVariantRow[]).map((a, idx) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">
                        {startIdx + idx + 1}
                      </td>
                      <td className="p-4 font-semibold text-slate-800 tabular-nums">{a.id}</td>
                      <td className="p-4 font-semibold text-slate-800">{a.species}</td>
                      <td className="p-4 text-slate-700">{a.classGrade ?? "-"}</td>
                      <td className="p-4 text-slate-600">{a.weightRange ?? "-"}</td>
                      <td className="p-4 text-slate-600">{a.description ?? "-"}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit("animalVariants", a)}
                            className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <form
                            action={() =>
                              start(async () => {
                                await api(`/api/master/animal-variants?id=${a.id}`, {
                                  method: "DELETE",
                                });
                              })
                            }
                          >
                            <button
                              type="submit"
                              disabled={pending}
                              className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Hapus
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        {tab === "services" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 bg-slate-50">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Tipe</th>
                <th className="p-4 text-right">Harga</th>
                <th className="p-4">Cabang</th>
                <th className="p-4">Varian</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-800">
              {(paginatedData as ServiceRow[]).map((s, idx) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-center text-slate-600 font-mono text-xs font-semibold">{startIdx + idx + 1}</td>
                  <td className="p-4 font-semibold text-slate-800 tabular-nums">{s.id}</td>
                  <td className="p-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="p-4 font-medium text-slate-800">{s.serviceType}</td>
                  <td className="p-4 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {s.basePrice}
                  </td>
                  <td className="p-4 text-slate-800">{serviceBranchLabel(s.branchId, branches)}</td>
                  <td className="p-4 text-sm text-slate-800">{serviceVariantLabel(s.animalVariantId, animalVariants)}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit("services", s)}
                        className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <form
                        action={() =>
                          start(async () => {
                            await api(`/api/master/services?id=${s.id}`, { method: "DELETE" });
                          })
                        }
                      >
                        <button
                          type="submit"
                          disabled={pending}
                          className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination UI */}
        <div className="p-5 border-t bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">
              Menampilkan{" "}
              {totalItems === 0
                ? "0"
                : `${startIdx + 1}-${Math.min(endIdx, totalItems)}`}{" "}
              dari {totalItems} data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-xs font-black">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        title={`Tambah / Edit: ${title}`}
        onClose={close}
        maxWidthClassName="max-w-xl"
      >
        {tab === "branches" && (
          (() => {
            const row = editing?.tab === "branches" ? editing.row : null;
            return (
              <form
                action={(fd) =>
                  start(async () => {
                    const payload = {
                      id: fd.get("id") ? Number(fd.get("id")) : undefined,
                      name: String(fd.get("name") ?? ""),
                      coaCode: String(fd.get("coaCode") ?? ""),
                      isActive: String(fd.get("isActive") ?? "true") === "true",
                    };
                    await api("/api/master/branches", { method: "POST", json: payload });
                    window.location.reload();
                  })
                }
                className="space-y-3"
              >
                <input type="hidden" name="id" value={row?.id ?? ""} />
                <div>
                  <label className="text-xs font-semibold text-slate-800">Nama</label>
                  <input
                    name="name"
                    aria-label="Nama cabang"
                    defaultValue={row?.name ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">COA</label>
                  <input
                    name="coaCode"
                    aria-label="COA"
                    defaultValue={row?.coaCode ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Aktif</label>
                  <select
                    name="isActive"
                    aria-label="Aktif"
                    defaultValue={(row?.isActive ?? true) ? "true" : "false"}
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-md font-semibold hover:bg-blue-900 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            );
          })()
        )}

        {tab === "vendors" && (
          (() => {
            const row = editing?.tab === "vendors" ? editing.row : null;
            return (
              <form
                action={(fd) =>
                  start(async () => {
                    const payload = {
                      id: fd.get("id") ? Number(fd.get("id")) : undefined,
                      name: String(fd.get("name") ?? ""),
                      location: String(fd.get("location") ?? ""),
                    };
                    await api("/api/master/vendors", { method: "POST", json: payload });
                    window.location.reload();
                  })
                }
                className="space-y-3"
              >
                <input type="hidden" name="id" value={row?.id ?? ""} />
                <div>
                  <label className="text-xs font-semibold text-slate-800">Nama</label>
                  <input
                    name="name"
                    aria-label="Nama vendor"
                    defaultValue={row?.name ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Lokasi</label>
                  <input
                    name="location"
                    aria-label="Lokasi"
                    defaultValue={row?.location ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-md font-semibold hover:bg-blue-900 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            );
          })()
        )}

        {tab === "sales" && (
          (() => {
            const row = editing?.tab === "sales" ? editing.row : null;
            return (
              <form
                action={(fd) =>
                  start(async () => {
                    const payload = {
                      id: fd.get("id") ? Number(fd.get("id")) : undefined,
                      name: String(fd.get("name") ?? ""),
                      category: String(fd.get("category") ?? ""),
                      phone: String(fd.get("phone") ?? ""),
                    };
                    await api("/api/master/sales-agents", { method: "POST", json: payload });
                    window.location.reload();
                  })
                }
                className="space-y-3"
              >
                <input type="hidden" name="id" value={row?.id ?? ""} />
                <div>
                  <label className="text-xs font-semibold text-slate-800">Nama</label>
                  <input
                    name="name"
                    aria-label="Nama sales"
                    defaultValue={row?.name ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Kategori</label>
                  <input
                    name="category"
                    aria-label="Kategori"
                    defaultValue={row?.category ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Telepon (wajib)</label>
                  <input
                    name="phone"
                    aria-label="Telepon"
                    defaultValue={row?.phone ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-md font-semibold hover:bg-blue-900 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            );
          })()
        )}

        {tab === "animalVariants" && (
          (() => {
            const row = editing?.tab === "animalVariants" ? editing.row : null;
            const speciesList: string[] = [...ANIMAL_SPECIES_OPTIONS];
            if (row?.species && !speciesList.includes(row.species)) {
              speciesList.push(row.species);
            }
            const gradeList: string[] = [...ANIMAL_CLASS_GRADE_OPTIONS];
            if (row?.classGrade && !gradeList.includes(row.classGrade)) {
              gradeList.push(row.classGrade);
            }
            return (
              <form
                action={(fd) =>
                  start(async () => {
                    const payload = {
                      id: fd.get("id") ? Number(fd.get("id")) : undefined,
                      species: String(fd.get("species") ?? ""),
                      classGrade: String(fd.get("classGrade") ?? ""),
                      weightRange: String(fd.get("weightRange") ?? ""),
                      description: String(fd.get("description") ?? ""),
                    };
                    await api("/api/master/animal-variants", { method: "POST", json: payload });
                    window.location.reload();
                  })
                }
                className="space-y-3"
              >
                <input type="hidden" name="id" value={row?.id ?? ""} />
                <div>
                  <label className="text-xs font-semibold text-slate-800">Species</label>
                  <select
                    name="species"
                    aria-label="Species"
                    defaultValue={row?.species ?? ""}
                    required
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="" disabled>
                      — Pilih species —
                    </option>
                    {speciesList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Kelas (A–F / -)</label>
                  <select
                    name="classGrade"
                    aria-label="Kelas"
                    defaultValue={row?.classGrade ?? ""}
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="">— (opsional / kosong) —</option>
                    {gradeList.map((g) => (
                      <option key={g} value={g}>
                        {g === "-" ? "Tidak berkelas (-)" : `Kelas ${g}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Rentang berat</label>
                  <input
                    name="weightRange"
                    aria-label="Rentang berat"
                    defaultValue={row?.weightRange ?? ""}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Deskripsi</label>
                  <textarea
                    name="description"
                    aria-label="Deskripsi"
                    defaultValue={row?.description ?? ""}
                    className={`${MASTER_FIELD_CLASS} min-h-[5rem]`}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-md font-semibold hover:bg-blue-900 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            );
          })()
        )}

        {tab === "services" && (
          (() => {
            const row = editing?.tab === "services" ? editing.row : null;
            const variantOptions = [...animalVariants];
            if (
              row?.animalVariantId != null &&
              !variantOptions.some((v) => v.id === row.animalVariantId)
            ) {
              variantOptions.push({
                id: row.animalVariantId,
                species: "?",
                classGrade: null,
                weightRange: null,
                description: "Tidak ada di master varian",
              });
            }
            return (
              <form
                action={(fd) =>
                  start(async () => {
                    const payload = {
                      id: fd.get("id") ? Number(fd.get("id")) : undefined,
                      name: String(fd.get("name") ?? ""),
                      serviceType: String(fd.get("serviceType") ?? ""),
                      basePrice: Number(fd.get("basePrice") ?? 0),
                      branchId: fd.get("branchId") ? String(fd.get("branchId")) : "",
                      animalVariantId: fd.get("animalVariantId")
                        ? String(fd.get("animalVariantId"))
                        : "",
                      coaCode: String(fd.get("coaCode") ?? ""),
                    };
                    await api("/api/master/services", { method: "POST", json: payload });
                    window.location.reload();
                  })
                }
                className="space-y-3"
              >
                <input type="hidden" name="id" value={row?.id ?? ""} />
                <div>
                  <label className="text-xs font-semibold text-slate-800">Nama jasa</label>
                  <input
                    name="name"
                    defaultValue={row?.name ?? ""}
                    required
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Tipe layanan</label>
                  <select
                    name="serviceType"
                    defaultValue={row?.serviceType ?? ""}
                    required
                    aria-label="Tipe layanan"
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="" disabled>
                      — Pilih tipe —
                    </option>
                    <option value="SHIPPING">SHIPPING (Ongkos kirim)</option>
                    <option value="SLAUGHTER">SLAUGHTER (Potong / cacah)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Harga dasar (IDR)</label>
                  <input
                    name="basePrice"
                    type="number"
                    min={0}
                    step="1000"
                    defaultValue={row ? Number(row.basePrice) : 0}
                    className={MASTER_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Cabang</label>
                  <select
                    name="branchId"
                    defaultValue={row?.branchId != null ? String(row.branchId) : ""}
                    aria-label="Cabang"
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="">Nasional (semua cabang)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Varian hewan (opsional)</label>
                  <select
                    name="animalVariantId"
                    defaultValue={row?.animalVariantId != null ? String(row.animalVariantId) : ""}
                    aria-label="Varian hewan"
                    className={MASTER_FIELD_CLASS}
                  >
                    <option value="">Tidak mengikat varian</option>
                    {variantOptions.map((v) => {
                      const label = serviceVariantLabel(v.id, animalVariants);
                      return (
                        <option key={v.id} value={String(v.id)}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">COA (opsional)</label>
                  <input
                    name="coaCode"
                    defaultValue={row?.coaCode ?? ""}
                    className={`${MASTER_FIELD_CLASS} font-mono text-sm`}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-md font-semibold hover:bg-blue-900 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            );
          })()
        )}

        {tab === "payments" && (
          (() => {
            const row = editing?.tab === "payments" ? editing.row : null;
            return (
              <form
                action={(fd) =>
                  start(async () => {
                    const payload = {
                      id: fd.get("id") ? Number(fd.get("id")) : undefined,
                      code: String(fd.get("code") ?? ""),
                      name: String(fd.get("name") ?? ""),
                      category: String(fd.get("category") ?? ""),
                      coaCode: String(fd.get("coaCode") ?? ""),
                      accountHolderName: String(fd.get("accountHolderName") ?? ""),
                      bankName: String(fd.get("bankName") ?? ""),
                      accountNumber: String(fd.get("accountNumber") ?? ""),
                      isActive: String(fd.get("isActive") ?? "true") === "true",
                    };
                    await api("/api/master/payment-methods", { method: "POST", json: payload });
                    window.location.reload();
                  })
                }
                className="space-y-4"
              >
                <input type="hidden" name="id" value={row?.id ?? ""} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-800">Code</label>
                    <input
                      name="code"
                      placeholder="Contoh: TF_MANDIRI"
                      defaultValue={row?.code ?? ""}
                      className={`${MASTER_FIELD_CLASS} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-800">Kategori</label>
                    <input
                      name="category"
                      placeholder="Contoh: MANUAL_TRANSFER"
                      defaultValue={row?.category ?? ""}
                      className={`${MASTER_FIELD_CLASS} uppercase`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800">Nama Tampilan</label>
                  <input
                    name="name"
                    placeholder="Contoh: Transfer Bank Mandiri"
                    defaultValue={row?.name ?? ""}
                    className={`${MASTER_FIELD_CLASS} font-bold`}
                  />
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Detail Rekening (Manual Transfer)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                       <label className="text-[10px] font-bold text-slate-700">Nama Bank</label>
                       <input
                         name="bankName"
                         placeholder="Contoh: Bank Mandiri"
                         defaultValue={row?.bankName ?? ""}
                         className={MASTER_FIELD_CLASS}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-700">Nomor Rekening</label>
                       <input
                         name="accountNumber"
                         placeholder="1234567890"
                         defaultValue={row?.accountNumber ?? ""}
                         className={`${MASTER_FIELD_CLASS} font-mono`}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-700">Atas Nama</label>
                       <input
                         name="accountHolderName"
                         placeholder="PT Rumah Qurban"
                         defaultValue={row?.accountHolderName ?? ""}
                         className={MASTER_FIELD_CLASS}
                       />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-800">COA</label>
                    <input
                      name="coaCode"
                      placeholder="110-10-101"
                      defaultValue={row?.coaCode ?? ""}
                      className={MASTER_FIELD_CLASS}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-800">Aktif</label>
                    <select
                      name="isActive"
                      defaultValue={(row?.isActive ?? true) ? "true" : "false"}
                      className={MASTER_FIELD_CLASS}
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 bg-[#1e3a5f] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            );
          })()
        )}
      </Modal>
    </div>
  );
}
