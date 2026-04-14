import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getFarmInventoryById, getAnimalTrackingsByFarmInventoryId } from "@/lib/db/queries/farm";
import FarmDetailClient from "@/components/farm/FarmDetailClient";

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farmInventoryId = Number(id);
  
  if (!Number.isFinite(farmInventoryId)) {
    notFound();
  }

  const session = await getSession();
  if (!session) {
    notFound();
  }

  const animal = await getFarmInventoryById(farmInventoryId);
  
  if (!animal) {
    notFound();
  }

  // Check branch access for non-super admins
  if (session.role !== "SUPER_ADMIN" && animal.branchId !== session.branchId) {
    notFound();
  }

  const trackings = await getAnimalTrackingsByFarmInventoryId(farmInventoryId);

  return (
    <FarmDetailClient 
      animal={animal} 
      trackings={trackings}
      canEdit={session.role === "SUPER_ADMIN" || session.role === "ADMIN_CABANG"}
    />
  );
}
