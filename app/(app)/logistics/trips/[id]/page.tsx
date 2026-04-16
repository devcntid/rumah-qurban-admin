import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getLogisticsTripById,
  listDeliveryManifestsForTripIdPaged,
  countDeliveryManifestsForTripId,
  listFarmInventoryIdsEligibleForManifest,
  listFarmInventoryIdsEligibleGlobally,
} from "@/lib/db/queries/logistics";
import { getAllNotifTemplates } from "@/lib/db/queries/notif-templates";
import TripDetailClient from "@/components/logistics/TripDetailClient";

const PAGE_SIZES = new Set([10, 20, 50, 100]);

export default async function LogisticsTripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tripId = Number(id);
  if (!Number.isFinite(tripId)) notFound();

  const page = Math.max(1, Number(sp.page) || 1);
  const rawSize = Number(sp.pageSize) || 10;
  const pageSize = PAGE_SIZES.has(rawSize) ? rawSize : 10;
  const mq = typeof sp.mq === "string" ? sp.mq : undefined;
  const mstatus = typeof sp.mstatus === "string" ? sp.mstatus : undefined;
  const manifestHasFilters = Boolean((mq ?? "").trim() || (mstatus ?? "").trim());

  const session = await getSession();
  if (!session) notFound();

  const superAdmin = session.role === "SUPER_ADMIN";
  const [trip, manifests, manifestTotal, eligibleAnimals, notifTemplates] = await Promise.all([
    getLogisticsTripById(tripId, session.branchId, superAdmin),
    listDeliveryManifestsForTripIdPaged({
      tripId,
      mq,
      mstatus,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    countDeliveryManifestsForTripId(tripId, mq, mstatus),
    superAdmin
      ? listFarmInventoryIdsEligibleGlobally()
      : listFarmInventoryIdsEligibleForManifest(session.branchId),
    getAllNotifTemplates(),
  ]);

  if (!trip) notFound();

  return (
    <TripDetailClient
      trip={trip}
      manifests={manifests}
      manifestTotal={manifestTotal}
      manifestHasFilters={manifestHasFilters}
      page={page}
      pageSize={pageSize}
      eligibleAnimals={eligibleAnimals}
      notifTemplates={notifTemplates}
    />
  );
}
