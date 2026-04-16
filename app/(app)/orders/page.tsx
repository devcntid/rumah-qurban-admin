import { getDb } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { listOrders, countOrders } from "@/lib/db/queries/orders";
import OrdersClient from "../../../components/orders/OrdersClient";

export default async function OrdersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  const showPosEditOrder =
    session?.role === "SUPER_ADMIN" || session?.role === "ADMIN_CABANG";

  const searchParams = await props.searchParams;
  
  const branchId = searchParams.branchId ? Number(searchParams.branchId) : undefined;
  const status = searchParams.status as string | undefined;
  const customerType = searchParams.customerType as string | undefined;
  const q = searchParams.q as string | undefined;
  const startDate = searchParams.startDate as string | undefined;
  const endDate = searchParams.endDate as string | undefined;
  const allocationStatus = searchParams.allocationStatus as string | undefined;
  const slaughterStatus = searchParams.slaughterStatus as string | undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const pageSize = searchParams.pageSize ? Number(searchParams.pageSize) : 10;

  const sql = getDb();

  const filterParams = {
    branchId,
    status,
    customerType,
    q,
    startDate,
    endDate,
    allocationStatus,
    slaughterStatus,
  };

  const [branches, initialData, totalCount] = await Promise.all([
    sql`SELECT id, name FROM branches WHERE is_active = TRUE ORDER BY name`,
    listOrders({
      ...filterParams,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    countOrders(filterParams),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <OrdersClient
        initialData={initialData}
        totalCount={totalCount}
        branches={branches as any}
        page={page}
        pageSize={pageSize}
        showPosEditOrder={showPosEditOrder}
      />
    </div>
  );
}

