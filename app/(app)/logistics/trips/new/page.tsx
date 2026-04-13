import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listBranches } from "@/lib/db/queries/master";
import TripForm from "@/components/logistics/TripForm";

export default async function NewLogisticsTripPage() {
  const session = await getSession();
  if (!session) notFound();

  const branchesRaw = await listBranches();
  const branches = branchesRaw
    .filter((b) => b.isActive)
    .map((b) => ({ id: b.id, name: b.name }));

  return (
    <TripForm
      mode="create"
      branches={branches}
      defaultBranchId={session.branchId}
      isSuperAdmin={session.role === "SUPER_ADMIN"}
    />
  );
}
