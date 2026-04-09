import { getSession } from "@/lib/auth/session";
import { listCatalogOffers } from "@/lib/db/queries/catalog";
import { listServices } from "@/lib/db/queries/services";
import { PosClient } from "./PosClient";
import { listBranches } from "@/lib/db/queries/master";

export default async function PosPage() {
  const session = await getSession();
  const branchId = session?.branchId ?? 1; // Fallback to 1 for demo/safety

  const [catalog, allServices, branches] = await Promise.all([
    listCatalogOffers({ branchId, limit: 100, offset: 0 }),
    listServices(),
    listBranches(),
  ]);

  // Filter services relevant to this branch or global (branchId null)
  const services = allServices.filter(
    (s) => s.branchId === branchId || s.branchId === null
  );

  return (
    <PosClient 
      branchId={branchId}
      initialCatalog={catalog}
      initialServices={services}
      branches={branches}
    />
  );
}
