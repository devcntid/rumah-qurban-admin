import type { EligibleFarmAnimalRow } from "@/lib/db/queries/logistics";

export const TRIP_STATUS_OPTIONS = [
  { value: "PREPARING", label: "Persiapan (isi manifest)" },
  { value: "ON_DELIVERY", label: "Berangkat / dalam perjalanan" },
  { value: "DELIVERED", label: "Trip selesai" },
] as const;

export const MANIFEST_STATUS_HINTS = ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;

const statusTripClass: Record<string, string> = {
  PREPARING: "bg-amber-100 text-amber-800 border-amber-200",
  ON_DELIVERY: "bg-sky-100 text-sky-800 border-sky-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const statusManifestClass: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  IN_TRANSIT: "bg-sky-100 text-sky-800 border-sky-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export function tripStatusStyle(status: string | null) {
  const key = status ?? "PREPARING";
  return statusTripClass[key] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

export function manifestStatusStyle(status: string | null) {
  const key = status ?? "PENDING";
  return statusManifestClass[key] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

export function eligibleForTrip(
  tripBranchId: number | null,
  animals: EligibleFarmAnimalRow[]
): EligibleFarmAnimalRow[] {
  if (tripBranchId == null) return [];
  return animals.filter((a) => a.branchId === tripBranchId);
}

export function todayInputDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
