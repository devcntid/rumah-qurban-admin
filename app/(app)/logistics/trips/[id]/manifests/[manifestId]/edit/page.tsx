import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  getDeliveryManifestById,
  listFarmInventoryIdsEligibleForManifest,
  listFarmInventoryIdsEligibleGlobally,
  listLogisticsTrips,
} from "@/lib/db/queries/logistics";
import ManifestEditForm from "@/components/logistics/ManifestEditForm";

export default async function EditManifestPage({
  params,
}: {
  params: Promise<{ id: string; manifestId: string }>;
}) {
  const { id, manifestId } = await params;
  const tripId = Number(id);
  const mid = Number(manifestId);
  if (!Number.isFinite(tripId) || !Number.isFinite(mid)) notFound();

  const session = await getSession();
  if (!session) notFound();

  const superAdmin = session.role === "SUPER_ADMIN";
  const [row, eligibleAnimals] = await Promise.all([
    getDeliveryManifestById(mid, session.branchId, superAdmin),
    superAdmin
      ? listFarmInventoryIdsEligibleGlobally()
      : listFarmInventoryIdsEligibleForManifest(session.branchId),
  ]);

  if (!row) notFound();
  if (row.tripId !== tripId) notFound();

  const { tripBranchId, ...manifest } = row;
  const tripsSameBranch =
    tripBranchId == null ? [] : await listLogisticsTrips(tripBranchId);

  return (
    <ManifestEditForm
      pageTripId={tripId}
      tripBranchId={tripBranchId}
      manifest={manifest}
      tripsSameBranch={tripsSameBranch}
      eligibleAnimals={eligibleAnimals}
    />
  );
}
