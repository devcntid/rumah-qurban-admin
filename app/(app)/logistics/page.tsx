import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  listLogisticsTripsSummaryPaged,
  countLogisticsTripsSummary,
} from "@/lib/db/queries/logistics";
import { listBranches } from "@/lib/db/queries/master";
import LogisticsTripsListClient from "@/components/logistics/LogisticsTripsListClient";

const PAGE_SIZES = new Set([10, 20, 50, 100]);

export default async function LogisticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const rawSize = Number(sp.pageSize) || 10;
  const pageSize = PAGE_SIZES.has(rawSize) ? rawSize : 10;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const startDate = typeof sp.startDate === "string" ? sp.startDate : undefined;
  const endDate = typeof sp.endDate === "string" ? sp.endDate : undefined;
  const branchIdRaw = typeof sp.branchId === "string" ? Number(sp.branchId) : undefined;
  const filterBranchId =
    session.role === "SUPER_ADMIN" && branchIdRaw != null && Number.isFinite(branchIdRaw)
      ? branchIdRaw
      : undefined;

  const superAdmin = session.role === "SUPER_ADMIN";
  const filter = {
    sessionBranchId: session.branchId,
    isSuperAdmin: superAdmin,
    filterBranchId,
    q,
    status,
    startDate,
    endDate,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };

  const [branchesRaw, trips, totalCount] = await Promise.all([
    superAdmin ? listBranches() : Promise.resolve([]),
    listLogisticsTripsSummaryPaged(filter),
    countLogisticsTripsSummary({
      sessionBranchId: session.branchId,
      isSuperAdmin: superAdmin,
      filterBranchId,
      q,
      status,
      startDate,
      endDate,
    }),
  ]);

  const branches = branchesRaw
    .filter((b) => b.isActive)
    .map((b) => ({ id: b.id, name: b.name }));

  return (
    <LogisticsTripsListClient
      trips={trips}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      branches={branches}
      isSuperAdmin={superAdmin}
    />
  );
}
