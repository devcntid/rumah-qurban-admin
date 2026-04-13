import { getSession } from "@/lib/auth/session";
import { listCatalogOffers } from "@/lib/db/queries/catalog";
import { listServices } from "@/lib/db/queries/services";
import { PosClient } from "./PosClient";
import { listBranches } from "@/lib/db/queries/master";
import { getOrderWithItems } from "@/lib/db/queries/orders";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const session = await getSession();
  const defaultBranchId = session?.branchId ?? 1;

  const sp = await searchParams;
  const editRaw = sp.edit;
  const editStr = Array.isArray(editRaw) ? editRaw[0] : editRaw;
  const editId = editStr ? Number(editStr) : NaN;

  const branchFilter = session?.role === "SUPER_ADMIN" ? null : session?.branchId ?? null;

  let editBundle: Awaited<ReturnType<typeof getOrderWithItems>> = null;
  let editLoadError: string | null = null;
  if (Number.isFinite(editId)) {
    const b = await getOrderWithItems(editId, branchFilter);
    if (b) editBundle = b;
    else editLoadError = "Pesanan tidak ditemukan atau Anda tidak punya akses ke cabang pesanan ini.";
  }

  const catalogBranchId = editBundle?.order.branchId ?? defaultBranchId;

  const [catalog, allServices, branches] = await Promise.all([
    listCatalogOffers({ branchId: catalogBranchId, limit: 100, offset: 0 }),
    listServices(),
    listBranches(),
  ]);

  const services = allServices.filter(
    (s) => s.branchId === catalogBranchId || s.branchId === null
  );

  return (
    <PosClient
      branchId={defaultBranchId}
      initialCatalog={catalog}
      initialServices={services}
      branches={branches}
      editBundle={editBundle}
      editLoadError={editLoadError}
    />
  );
}
