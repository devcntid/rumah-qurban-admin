"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import type {
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

export function MasterCrud({
  branches,
  vendors,
  payments,
  salesAgents,
  animalVariants,
  services,
}: {
  branches: BranchRow[];
  vendors: VendorRow[];
  payments: PaymentMethodRow[];
  salesAgents: SalesAgentRow[];
  animalVariants: AnimalVariantRow[];
  services: ServiceRow[];
}) {
  const [tab, setTab] = useState<Tab>("branches");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState>(null);
  const [pending, start] = useTransition();

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
            onClick={() => setTab(key)}
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
              <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white">
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">COA</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
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
              <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white">
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Lokasi</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-semibold">{v.id}</td>
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
              <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white">
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
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-semibold">{p.id}</td>
                  <td className="p-4 font-mono text-xs text-blue-600">{p.code}</td>
                  <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                  <td className="p-4 text-slate-600">{p.category}</td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-slate-800">{p.bankName ?? "-"}</div>
                    <div className="text-[10px] font-mono text-slate-400">{p.accountNumber ?? "-"}</div>
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
              <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white">
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">HP</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {salesAgents.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-semibold">{s.id}</td>
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white">
                <th className="p-4">ID</th>
                <th className="p-4">Species</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">Rentang berat</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {animalVariants.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-semibold">{a.id}</td>
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
              ))}
            </tbody>
          </table>
        )}

        {tab === "services" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white">
                <th className="p-4">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Tipe</th>
                <th className="p-4 text-right">Harga</th>
                <th className="p-4">Cabang</th>
                <th className="p-4">Varian</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {services.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-semibold">{s.id}</td>
                  <td className="p-4 font-semibold text-slate-800">{s.name}</td>
                  <td className="p-4 text-slate-600">{s.serviceType}</td>
                  <td className="p-4 text-right font-mono text-xs">{s.basePrice}</td>
                  <td className="p-4">{s.branchId ?? "-"}</td>
                  <td className="p-4">{s.animalVariantId ?? "-"}</td>
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
                  <label className="text-xs font-semibold text-slate-600">Nama</label>
                  <input
                    name="name"
                    aria-label="Nama cabang"
                    defaultValue={row?.name ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">COA</label>
                  <input
                    name="coaCode"
                    aria-label="COA"
                    defaultValue={row?.coaCode ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Aktif</label>
                  <select
                    name="isActive"
                    aria-label="Aktif"
                    defaultValue={(row?.isActive ?? true) ? "true" : "false"}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none bg-white"
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
                  <label className="text-xs font-semibold text-slate-600">Nama</label>
                  <input
                    name="name"
                    aria-label="Nama vendor"
                    defaultValue={row?.name ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Lokasi</label>
                  <input
                    name="location"
                    aria-label="Lokasi"
                    defaultValue={row?.location ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
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
                  <label className="text-xs font-semibold text-slate-600">Nama</label>
                  <input
                    name="name"
                    aria-label="Nama sales"
                    defaultValue={row?.name ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Kategori</label>
                  <input
                    name="category"
                    aria-label="Kategori"
                    defaultValue={row?.category ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Telepon (wajib)</label>
                  <input
                    name="phone"
                    aria-label="Telepon"
                    defaultValue={row?.phone ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
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
                  <label className="text-xs font-semibold text-slate-600">Species</label>
                  <input
                    name="species"
                    aria-label="Species"
                    defaultValue={row?.species ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Kelas (A/B/-)</label>
                  <input
                    name="classGrade"
                    aria-label="Kelas"
                    defaultValue={row?.classGrade ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Rentang berat</label>
                  <input
                    name="weightRange"
                    aria-label="Rentang berat"
                    defaultValue={row?.weightRange ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Deskripsi</label>
                  <textarea
                    name="description"
                    aria-label="Deskripsi"
                    defaultValue={row?.description ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none h-20"
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
                  <label className="text-xs font-semibold text-slate-600">Nama</label>
                  <input
                    name="name"
                    defaultValue={row?.name ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tipe (SHIPPING / SLAUGHTER)</label>
                  <input
                    name="serviceType"
                    defaultValue={row?.serviceType ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Harga dasar</label>
                  <input
                    name="basePrice"
                    type="number"
                    defaultValue={row ? Number(row.basePrice) : 0}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Cabang ID (kosong = nasional)</label>
                  <input
                    name="branchId"
                    defaultValue={row?.branchId ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Varian hewan ID (opsional)</label>
                  <input
                    name="animalVariantId"
                    defaultValue={row?.animalVariantId ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">COA</label>
                  <input
                    name="coaCode"
                    defaultValue={row?.coaCode ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
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
                    <label className="text-xs font-semibold text-slate-600">Code</label>
                    <input
                      name="code"
                      placeholder="Contoh: TF_MANDIRI"
                      defaultValue={row?.code ?? ""}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Kategori</label>
                    <input
                      name="category"
                      placeholder="Contoh: MANUAL_TRANSFER"
                      defaultValue={row?.category ?? ""}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Nama Tampilan</label>
                  <input
                    name="name"
                    placeholder="Contoh: Transfer Bank Mandiri"
                    defaultValue={row?.name ?? ""}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none font-bold"
                  />
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Rekening (Manual Transfer)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                       <label className="text-[10px] font-bold text-slate-500">Nama Bank</label>
                       <input
                         name="bankName"
                         placeholder="Contoh: Bank Mandiri"
                         defaultValue={row?.bankName ?? ""}
                         className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-500">Nomor Rekening</label>
                       <input
                         name="accountNumber"
                         placeholder="1234567890"
                         defaultValue={row?.accountNumber ?? ""}
                         className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none font-mono"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-500">Atas Nama</label>
                       <input
                         name="accountHolderName"
                         placeholder="PT Rumah Qurban"
                         defaultValue={row?.accountHolderName ?? ""}
                         className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                       />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">COA</label>
                    <input
                      name="coaCode"
                      placeholder="110-10-101"
                      defaultValue={row?.coaCode ?? ""}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Aktif</label>
                    <select
                      name="isActive"
                      defaultValue={(row?.isActive ?? true) ? "true" : "false"}
                      className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none bg-white"
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
