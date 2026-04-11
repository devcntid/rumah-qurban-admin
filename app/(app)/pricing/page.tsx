import { getDb } from "@/lib/db/client";
import { listCatalogOffers, countCatalogOffers } from "@/lib/db/queries/catalog";
import PricingClient from "../../../components/pricing/PricingClient";

export default async function PricingPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const branchId = searchParams.branchId ? Number(searchParams.branchId) : undefined;
  const productCode = searchParams.productCode as string | undefined;
  const species = searchParams.species as string | undefined;
  const q = searchParams.q as string | undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const pageSize = searchParams.pageSize ? Number(searchParams.pageSize) : 10;

  const sql = getDb();
  
  // Fetch common data for selects
  const [branches, products, variants, vendors, initialData, totalCount] = await Promise.all([
    sql`SELECT id, name FROM branches WHERE is_active = TRUE ORDER BY name`,
    sql`SELECT id, code, name FROM products ORDER BY name`,
    sql`SELECT id, species, class_grade as "classGrade", weight_range as "weightRange" FROM animal_variants ORDER BY species, class_grade`,
    sql`SELECT id, name FROM vendors ORDER BY name`,
    listCatalogOffers({
      branchId,
      productCode,
      species,
      q,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    countCatalogOffers({
      branchId,
      productCode,
      species,
      q,
    }),
  ]);

  return (
    <PricingClient 
      initialData={initialData}
      branches={branches as any}
      products={products as any}
      variants={variants as any}
      vendors={vendors as any}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
    />
  );
}


