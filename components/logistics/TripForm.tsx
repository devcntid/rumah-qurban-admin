"use client";

import { useTransition } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LogisticsTripRow } from "@/lib/db/queries/logistics";
import { createLogisticsTripAction, updateLogisticsTripAction } from "@/lib/actions/logistics";
import { TRIP_STATUS_OPTIONS, todayInputDate } from "./logisticsShared";

type BranchOption = { id: number; name: string };

export default function TripForm({
  mode,
  initialTrip,
  branches,
  defaultBranchId,
  isSuperAdmin,
}: {
  mode: "create" | "edit";
  initialTrip?: LogisticsTripRow;
  branches: BranchOption[];
  defaultBranchId: number;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(
    String(initialTrip?.branchId ?? defaultBranchId)
  );
  const [vehiclePlate, setVehiclePlate] = useState(initialTrip?.vehiclePlate ?? "");
  const [driverName, setDriverName] = useState(initialTrip?.driverName ?? "");
  const [scheduledDate, setScheduledDate] = useState(
    initialTrip ? initialTrip.scheduledDate.slice(0, 10) : todayInputDate()
  );
  const [status, setStatus] = useState(initialTrip?.status ?? "PREPARING");
  const [pending, startTransition] = useTransition();

  const activeBranches = branches.filter(Boolean);
  const backHref = mode === "edit" && initialTrip ? `/logistics/trips/${initialTrip.id}` : "/logistics";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {mode === "create" ? "Trip baru" : "Ubah trip"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {mode === "create"
              ? "Simpan jadwal armada, lalu isi manifest di halaman detail trip."
              : "Perbarui plat, supir, tanggal, atau status trip."}
          </p>
        </div>
        <Link
          href={backHref}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl px-4 py-2 bg-white"
        >
          Kembali
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const bid = Number(branchId);
            startTransition(async () => {
              if (mode === "create") {
                const r = await createLogisticsTripAction({
                  branchId: bid,
                  vehiclePlate,
                  driverName,
                  scheduledDate,
                  status,
                });
                if (!r.success) {
                  toast.error(r.error);
                  return;
                }
                toast.success("Jadwal trip tersimpan.");
                router.push(`/logistics/trips/${r.tripId}`);
                router.refresh();
                return;
              }
              if (!initialTrip) return;
              const r = await updateLogisticsTripAction({
                tripId: initialTrip.id,
                vehiclePlate,
                driverName,
                scheduledDate,
                status,
                ...(isSuperAdmin ? { branchId: bid } : {}),
              });
              if (!r.success) {
                toast.error(r.error);
                return;
              }
              toast.success("Perubahan disimpan.");
              router.push(`/logistics/trips/${initialTrip.id}`);
              router.refresh();
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {isSuperAdmin && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label htmlFor="trip-branch" className="text-[10px] font-bold uppercase text-slate-500">
                  Cabang
                </label>
                <select
                  id="trip-branch"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm max-w-md"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={pending}
                >
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label htmlFor="trip-plate" className="text-[10px] font-bold uppercase text-slate-500">
                Plat kendaraan
              </label>
              <input
                id="trip-plate"
                required
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="D 1234 AB"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="trip-driver" className="text-[10px] font-bold uppercase text-slate-500">
                Nama supir
              </label>
              <input
                id="trip-driver"
                required
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Nama lengkap"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="trip-date" className="text-[10px] font-bold uppercase text-slate-500">
                Tanggal jadwal
              </label>
              <input
                id="trip-date"
                type="date"
                required
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="trip-status" className="text-[10px] font-bold uppercase text-slate-500">
                Status trip (max 50 karakter)
              </label>
              <input
                id="trip-status"
                list="trip-status-dl"
                maxLength={50}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="PREPARING"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={pending}
              />
              <datalist id="trip-status-dl">
                {TRIP_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} label={o.label} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              {pending ? "Menyimpan…" : mode === "create" ? "Simpan trip" : "Simpan perubahan"}
            </button>
            <Link
              href={backHref}
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
