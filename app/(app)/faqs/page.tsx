import { getDb } from "@/lib/db/client";
import { FaqCrud } from "./FaqCrud";

type Product = {
  id: number;
  code: string;
  name: string;
};

async function getProducts(): Promise<Product[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, code, name
    FROM products
    ORDER BY id ASC
  `;
  return rows as unknown as Product[];
}

export default async function FaqsPage() {
  const products = await getProducts();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">FAQ Management</h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola pertanyaan yang sering ditanyakan untuk setiap produk
        </p>
      </div>
      <FaqCrud products={products} />
    </div>
  );
}
