"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  DeliveryManifestRow,
  EligibleFarmAnimalRow,
  LogisticsTripRow,
} from "@/lib/db/queries/logistics";
import { updateDeliveryManifestAction } from "@/lib/actions/logistics";
import { eligibleForTrip, MANIFEST_STATUS_HINTS } from "./logisticsShared";

export default function ManifestEditForm({
  pageTripId,
  tripBranchId,
  manifest,
  tripsSameBranch,
  eligibleAnimals,
}: {
  pageTripId: number;
  tripBranchId: number | null;
  manifest: DeliveryManifestRow;
  tripsSameBranch: LogisticsTripRow[];
  eligibleAnimals: EligibleFarmAnimalRow[];
}) {
  const router = useRouter();
  const addrInit = manifest.destinationAddressSnapshot ?? manifest.destinationAddress ?? "";
  const [destinationAddress, setDestinationAddress] = useState(addrInit);
  const [destinationLat, setDestinationLat] = useState(
    (manifest.destinationLatSnapshot ?? manifest.destinationLat ?? "").toString()
  );
  const [destinationLng, setDestinationLng] = useState(
    (manifest.destinationLngSnapshot ?? manifest.destinationLng ?? "").toString()
  );
  const [deliveryStatus, setDeliveryStatus] = useState(manifest.deliveryStatus ?? "PENDING");
  const [tripId, setTripId] = useState(String(manifest.tripId));

  const baseAnimals = eligibleForTrip(tripBranchId, eligibleAnimals);
  const fi = manifest.farmInventoryId;
  const animals: EligibleFarmAnimalRow[] = [...baseAnimals];
  if (fi != null && tripBranchId != null && !animals.some((a) => a.id === fi)) {
    animals.push({
      id: fi,
      branchId: tripBranchId,
      eartagId: manifest.eartagId ?? `#${fi}`,
      generatedId: manifest.generatedId,
      orderItemId: manifest.orderItemId,
      invoiceNumber: manifest.invoiceNumber,
      customerName: manifest.customerName,
    });
  }
  const [farmKey, setFarmKey] = useState(fi != null ? String(fi) : "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
          <Link href="/logistics" className="hover:text-slate-600">
            Logistik
          </Link>{" "}
          /{" "}
          <Link href={`/logistics/trips/${pageTripId}`} className="hover:text-slate-600">
            Trip #{pageTripId}
          </Link>{" "}
          / Manifest #{manifest.id}
        </div>
        <h2 className="text-xl font-bold text-slate-800">Edit manifest</h2>
        <p className="text-sm text-slate-500 mt-1">Alamat snapshot, status, trip se-cabang, dan pemetaan hewan.</p>
      </div>

      <form
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const tid = Number(tripId);
          if (!Number.isFinite(tid)) return;
          const fiNum = farmKey === "" ? null : Number(farmKey);
          if (farmKey !== "" && !Number.isFinite(fiNum)) return;
          startTransition(async () => {
            const r = await updateDeliveryManifestAction({
              manifestId: manifest.id,
              destinationAddress,
              destinationLat,
              destinationLng,
              deliveryStatus,
              tripId: tid,
              farmInventoryId: fiNum,
            });
            if (!r.success) {
              toast.error(r.error);
              return;
            }
            toast.success("Manifest diperbarui.");
            router.push(`/logistics/trips/${tid}`);
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="mf-addr" className="text-[10px] font-bold uppercase text-slate-500">
              Alamat tujuan (snapshot)
            </label>
            <textarea
              id="mf-addr"
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mf-lat" className="text-[10px] font-bold uppercase text-slate-500">
              Latitude
            </label>
            <input
              id="mf-lat"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={destinationLat}
              onChange={(e) => setDestinationLat(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mf-lng" className="text-[10px] font-bold uppercase text-slate-500">
              Longitude
            </label>
            <input
              id="mf-lng"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={destinationLng}
              onChange={(e) => setDestinationLng(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mf-st" className="text-[10px] font-bold uppercase text-slate-500">
              Status pengiriman
            </label>
            <input
              id="mf-st"
              list="mf-st-dl"
              maxLength={50}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              disabled={pending}
            />
            <datalist id="mf-st-dl">
              {MANIFEST_STATUS_HINTS.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mf-trip" className="text-[10px] font-bold uppercase text-slate-500">
              Trip (cabang sama)
            </label>
            <select
              id="mf-trip"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              disabled={pending}
            >
              {tripsSameBranch.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.vehiclePlate} · {t.scheduledDate.slice(0, 10)} · {t.driverName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="mf-fi" className="text-[10px] font-bold uppercase text-slate-500">
              Hewan (inventaris)
            </label>
            <select
              id="mf-fi"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={farmKey}
              onChange={(e) => setFarmKey(e.target.value)}
              disabled={pending}
            >
              <option value="">— tanpa hewan / kosongkan —</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.eartagId} · {a.invoiceNumber ?? "?"} · {a.customerName ?? "?"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={pending || tripsSameBranch.length === 0}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {pending ? "Menyimpan…" : "Simpan manifest"}
          </button>
          <Link
            href={`/logistics/trips/${pageTripId}`}
            className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
