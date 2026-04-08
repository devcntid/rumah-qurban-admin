"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import type { SalesTargetRow } from "@/lib/db/queries/targets";
import { api } from "@/lib/api/client";

function formatIDR(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export function TargetsCrud({ rows }: { rows: SalesTargetRow[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalesTargetRow | null>(null);
  const [pending, start] = useTransition();

  const initial = useMemo(() => {
    if (!editing) {
      return {
        year: new Date().getFullYear(),
        season: "",
        species: "DOMBA",
        category: "QA",
        targetEkor: 0,
        targetOmset: 0,
        targetHpp: 0,
        notes: "",
      };
    }
    return {
      year: editing.year,
      season: editing.season ?? "",
      species: editing.species,
      category: editing.category,
      targetEkor: editing.targetEkor,
      targetOmset: Number(editing.targetOmset),
      targetHpp: Number(editing.targetHpp),
      notes: editing.notes ?? "",
    };
  }, [editing]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Matriks Target</h3>
          <p className="text-xs text-slate-500 mt-1">
            Edit menggunakan upsert (unik: branch+year+species+category).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="rounded-md bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
        >
          + Tambah / Upsert
        </button>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white">
            <th className="p-4">Tahun</th>
            <th className="p-4">Season</th>
            <th className="p-4">Species</th>
            <th className="p-4">Kategori</th>
            <th className="p-4 text-right">Ekor</th>
            <th className="p-4 text-right">Omset</th>
            <th className="p-4 text-right">HPP</th>
            <th className="p-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="p-4 font-semibold text-slate-700">{r.year}</td>
              <td className="p-4 text-slate-600">{r.season ?? "-"}</td>
              <td className="p-4 font-semibold text-slate-800">{r.species}</td>
              <td className="p-4">
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 border border-slate-200">
                  {r.category}
                </span>
              </td>
              <td className="p-4 text-right font-bold">{r.targetEkor}</td>
              <td className="p-4 text-right font-semibold text-slate-800">
                {formatIDR(r.targetOmset)}
              </td>
              <td className="p-4 text-right font-semibold text-slate-800">
                {formatIDR(r.targetHpp)}
              </td>
              <td className="p-4 text-center">
                <div className="inline-flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                    className="px-3 py-1.5 rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <form
                    action={() =>
                      start(async () => {
                        await api(`/api/targets?id=${r.id}`, { method: "DELETE" });
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
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-slate-500">
                Tidak ada target.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal
        open={open}
        title={editing ? "Edit Target" : "Tambah / Upsert Target"}
        onClose={() => setOpen(false)}
        maxWidthClassName="max-w-xl"
      >
        <form
          action={(fd) =>
            start(async () => {
              const payload = {
                year: Number(fd.get("year")),
                season: String(fd.get("season") ?? ""),
                species: String(fd.get("species") ?? ""),
                category: String(fd.get("category") ?? ""),
                targetEkor: Number(fd.get("targetEkor") ?? 0),
                targetOmset: Number(fd.get("targetOmset") ?? 0),
                targetHpp: Number(fd.get("targetHpp") ?? 0),
                notes: String(fd.get("notes") ?? ""),
              };
              await api("/api/targets", { method: "POST", json: payload });
              window.location.reload();
            })
          }
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Tahun</label>
              <input
                name="year"
                type="number"
                defaultValue={initial.year}
                aria-label="Tahun"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Season</label>
              <input
                name="season"
                type="text"
                defaultValue={initial.season}
                aria-label="Season"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Species</label>
              <select
                name="species"
                defaultValue={initial.species}
                aria-label="Species"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none bg-white"
              >
                <option value="DOMBA">DOMBA</option>
                <option value="SAPI">SAPI</option>
                <option value="KAMBING">KAMBING</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Kategori</label>
              <select
                name="category"
                defaultValue={initial.category}
                aria-label="Kategori"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none bg-white"
              >
                <option value="QA">QA</option>
                <option value="QB">QB</option>
                <option value="QK">QK</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Target Ekor</label>
              <input
                name="targetEkor"
                type="number"
                defaultValue={initial.targetEkor}
                aria-label="Target Ekor"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Target Omset (Rp)</label>
              <input
                name="targetOmset"
                type="number"
                defaultValue={initial.targetOmset}
                aria-label="Target Omset"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Target HPP (Rp)</label>
              <input
                name="targetHpp"
                type="number"
                defaultValue={initial.targetHpp}
                aria-label="Target HPP"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-600">Catatan</label>
              <textarea
                name="notes"
                defaultValue={initial.notes}
                aria-label="Catatan"
                className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none h-20"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
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
      </Modal>
    </div>
  );
}

