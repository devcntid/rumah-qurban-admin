import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getLogisticsTripById, type LogisticsTripRow } from "@/lib/db/queries/logistics";
import { listBranches } from "@/lib/db/queries/master";
import TripForm from "@/components/logistics/TripForm";

export default async function EditLogisticsTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tripId = Number(id);
  if (!Number.isFinite(tripId)) notFound();

  const session = await getSession();
  if (!session) notFound();

  const superAdmin = session.role === "SUPER_ADMIN";
  const trip = await getLogisticsTripById(tripId, session.branchId, superAdmin);
  if (!trip) notFound();

  const branchesRaw = await listBranches();
  const branches = branchesRaw
    .filter((b) => b.isActive)
    .map((b) => ({ id: b.id, name: b.name }));

  const initialTrip: LogisticsTripRow = {
    id: trip.id,
    branchId: trip.branchId,
    branchName: trip.branchName,
    vehiclePlate: trip.vehiclePlate,
    driverName: trip.driverName,
    scheduledDate: trip.scheduledDate,
    status: trip.status,
  };

  return (
    <TripForm
      mode="edit"
      initialTrip={initialTrip}
      branches={branches}
      defaultBranchId={session.branchId}
      isSuperAdmin={superAdmin}
    />
  );
}
