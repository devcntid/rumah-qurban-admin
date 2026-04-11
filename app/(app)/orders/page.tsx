import { getDb } from "@/lib/db/client";
import { listOrders, countOrders } from "@/lib/db/queries/orders";
import OrdersClient from "../../../components/orders/OrdersClient";

export default async function OrdersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  
  const branchId = searchParams.branchId ? Number(searchParams.branchId) : undefined;
  const status = searchParams.status as string | undefined;
  const customerType = searchParams.customerType as string | undefined;
  const q = searchParams.q as string | undefined;
  const startDate = searchParams.startDate as string | undefined;
  const endDate = searchParams.endDate as string | undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const pageSize = searchParams.pageSize ? Number(searchParams.pageSize) : 10;

  const sql = getDb();

  const [branches, initialData, totalCount] = await Promise.all([
    sql`SELECT id, name FROM branches WHERE is_active = TRUE ORDER BY name`,
    listOrders({
      branchId,
      status,
      customerType,
      q,
      startDate,
      endDate,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    countOrders({
      branchId,
      status,
      customerType,
      q,
      startDate,
      endDate,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <OrdersClient
        initialData={initialData}
        totalCount={totalCount}
        branches={branches as any}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}

