"use client";

import { useCallback, useEffect, useMemo, useRef, useTransition, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { toast } from "sonner";
import type { EligibleFarmAnimalRow } from "@/lib/db/queries/logistics";
import { addFarmInventoriesToTripAction } from "@/lib/actions/logistics";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

function filterEligible(
  rows: EligibleFarmAnimalRow[],
  q: string,
  invoice: string,
  customer: string,
  orderItemId: string
): EligibleFarmAnimalRow[] {
  const qq = norm(q);
  const inv = norm(invoice);
  const cust = norm(customer);
  const oi = orderItemId.trim();
  const oiNum = oi ? Number(oi) : null;

  return rows.filter((a) => {
    if (oiNum != null && Number.isFinite(oiNum) && a.orderItemId !== oiNum) return false;
    if (inv && !norm(a.invoiceNumber).includes(inv)) return false;
    if (cust && !norm(a.customerName).includes(cust)) return false;
    if (!qq) return true;
    const hay = [
      a.eartagId,
      a.generatedId ?? "",
      a.invoiceNumber ?? "",
      a.customerName ?? "",
      String(a.id),
      a.orderItemId != null ? String(a.orderItemId) : "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(qq);
  });
}

export default function AddManifestModal({
  open,
  onClose,
  tripId,
  eligibleAnimals,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  tripId: number;
  eligibleAnimals: EligibleFarmAnimalRow[];
  onAdded?: () => void;
}) {
  const [q, setQ] = useState("");
  const [invoice, setInvoice] = useState("");
  const [customer, setCustomer] = useState("");
  const [orderItemId, setOrderItemId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const selectAllRef = useRef<HTMLInputElement>(null);

  const resetLocalState = useCallback(() => {
    setQ("");
    setInvoice("");
    setCustomer("");
    setOrderItemId("");
    setPage(1);
    setPageSize(10);
    setSelectedIds(new Set());
  }, []);

  useEffect(() => {
    if (open) resetLocalState();
  }, [open, resetLocalState]);

  const filtered = useMemo(
    () => filterEligible(eligibleAnimals, q, invoice, customer, orderItemId),
    [eligibleAnimals, q, invoice, customer, orderItemId]
  );

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageSlice = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const pageIds = useMemo(() => pageSlice.map((a) => a.id), [pageSlice]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    const el = selectAllRef.current;
    if (!el) return;
    el.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected]);
  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const a of filtered) next.add(a.id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startItem = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalFiltered);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-manifest-title"
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 id="add-manifest-title" className="text-sm font-bold text-slate-800">
              Tambah manifest (banyak sekaligus)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Filter hewan, centang satu atau lebih baris, lalu simpan. Maksimal 100 hewan per simpan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">
          {eligibleAnimals.length === 0 ? (
            <p className="text-sm text-slate-600">
              Tidak ada hewan yang memenuhi syarat untuk trip ini. Periksa alokasi pesanan atau manifest aktif lain.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter lanjutan</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="am-q" className="text-[10px] font-bold uppercase text-slate-500">
                      Pencarian umum
                    </label>
                    <input
                      id="am-q"
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Eartag, generated, invoice, pelanggan, ID…"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="am-inv" className="text-[10px] font-bold uppercase text-slate-500">
                      Invoice
                    </label>
                    <input
                      id="am-inv"
                      value={invoice}
                      onChange={(e) => {
                        setInvoice(e.target.value);
                        setPage(1);
                      }}
                      placeholder="INV-…"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="am-cust" className="text-[10px] font-bold uppercase text-slate-500">
                      Pelanggan
                    </label>
                    <input
                      id="am-cust"
                      value={customer}
                      onChange={(e) => {
                        setCustomer(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Nama pelanggan"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="am-oi" className="text-[10px] font-bold uppercase text-slate-500">
                      Order item ID
                    </label>
                    <input
                      id="am-oi"
                      inputMode="numeric"
                      value={orderItemId}
                      onChange={(e) => {
                        setOrderItemId(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Angka"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    disabled={totalFiltered === 0}
                    className="text-xs font-bold text-blue-700 hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    Pilih semua hasil filter ({totalFiltered})
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={selectedIds.size === 0}
                    className="text-xs font-bold text-slate-600 hover:underline disabled:opacity-40"
                  >
                    Kosongkan pilihan
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wide">Baris per halaman</span>
                  <select
                    aria-label="Jumlah baris hewan per halaman"
                    title="Jumlah baris per halaman"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold bg-white"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="font-mono text-slate-600">
                  Menampilkan {startItem}–{endItem} dari {totalFiltered} hewan
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[min(420px,45vh)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-[1] bg-slate-50 border-b border-slate-200">
                      <tr className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                        <th className="px-3 py-2.5 w-10 text-center">
                          <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={allPageSelected}
                            onChange={toggleSelectPage}
                            aria-label="Pilih semua di halaman ini"
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-3 py-2.5">ID inv.</th>
                        <th className="px-3 py-2.5">Eartag</th>
                        <th className="px-3 py-2.5">Generated</th>
                        <th className="px-3 py-2.5">Order item</th>
                        <th className="px-3 py-2.5">Invoice</th>
                        <th className="px-3 py-2.5">Pelanggan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pageSlice.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(a.id)}
                              onChange={() => toggleId(a.id)}
                              aria-label={`Pilih hewan ${a.eartagId}`}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-600">{a.id}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-slate-800">{a.eartagId}</td>
                          <td className="px-3 py-2 text-slate-600">{a.generatedId ?? "—"}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{a.orderItemId ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{a.invoiceNumber ?? "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{a.customerName ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalFiltered === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada hewan yang cocok dengan filter.</div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(1)}
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50"
                    aria-label="Halaman pertama"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50"
                    aria-label="Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-600">
                    Hal {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50"
                    aria-label="Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(totalPages)}
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50"
                    aria-label="Halaman terakhir"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
                <div className="text-xs font-bold text-[#102a43]">
                  Terpilih: {selectedIds.size} hewan
                </div>
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={pending || selectedIds.size === 0 || eligibleAnimals.length === 0}
            onClick={() => {
              const ids = [...selectedIds];
              startTransition(async () => {
                const r = await addFarmInventoriesToTripAction(tripId, ids);
                if (!r.success) {
                  toast.error(r.error);
                  return;
                }
                const n = r.added;
                toast.success(n === 1 ? "1 hewan ditambahkan ke manifest." : `${n} hewan ditambahkan ke manifest.`);
                onAdded?.();
                onClose();
              });
            }}
            className="rounded-lg bg-[#102a43] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Menyimpan…" : `Simpan (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
