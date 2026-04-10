import { getSession } from "@/lib/auth/session";
import { 
  listFarmInventories, 
  countFarmInventories, 
  listFarmPens 
} from "@/lib/db/queries/farm";
import { 
  listVendors, 
  listAnimalVariants,
  listBranches
} from "@/lib/db/queries/master";
import FarmClient from "@/components/farm/FarmClient";

export default async function FarmPage(props: {
  searchParams: Promise<{
    branchId?: string;
    vendorId?: string;
    penId?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const session = await getSession();
  const searchParams = await props.searchParams;
  
  const branchIdNum = session?.branchId ?? 1;
  const page = parseInt(searchParams.page ?? "1");
  const pageSize = parseInt(searchParams.pageSize ?? "20");
  const offset = (page - 1) * pageSize;

  const filters = {
    branchId: searchParams.branchId ? parseInt(searchParams.branchId) : branchIdNum,
    vendorId: searchParams.vendorId ? parseInt(searchParams.vendorId) : undefined,
    penId: searchParams.penId ? parseInt(searchParams.penId) : undefined,
    search: searchParams.search,
    limit: pageSize,
    offset,
  };

  const [inventories, totalCount, vendors, pens, variants, branches] = await Promise.all([
    listFarmInventories(filters),
    countFarmInventories(filters),
    listVendors(),
    listFarmPens(filters.branchId),
    listAnimalVariants(),
    listBranches(),
  ]);

  return (
    <FarmClient
      initialData={inventories}
      totalCount={totalCount}
      vendors={vendors}
      pens={pens}
      variants={variants}
      branches={branches}
      branchId={filters.branchId}
      page={page}
      pageSize={pageSize}
    />
  );
}
