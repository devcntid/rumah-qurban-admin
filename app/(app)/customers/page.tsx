import { getDb } from "@/lib/db/client";
import { listCustomers, countCustomers } from "@/lib/db/queries/customers";
import CustomersClient from "@/components/customers/CustomersClient";

export default async function CustomersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  
  const customerType = searchParams.customerType as string | undefined;
  const q = searchParams.q as string | undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const pageSize = searchParams.pageSize ? Number(searchParams.pageSize) : 10;

  const [initialData, totalCount] = await Promise.all([
    listCustomers({
      customerType,
      q,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    countCustomers({
      customerType,
      q,
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <CustomersClient
        initialData={initialData}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
