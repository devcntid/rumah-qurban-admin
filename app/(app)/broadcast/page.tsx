import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { BroadcastClient } from "./BroadcastClient";

async function getBranches() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name FROM branches WHERE is_active = TRUE ORDER BY name
  `;
  return rows as Array<{ id: number; name: string }>;
}

async function getProducts() {
  const sql = getDb();
  const rows = await sql`
    SELECT id, code, name FROM products ORDER BY id
  `;
  return rows as Array<{ id: number; code: string; name: string }>;
}

export default async function BroadcastPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [branches, products] = await Promise.all([
    getBranches(),
    getProducts(),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Broadcast Notifikasi</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kirim notifikasi WhatsApp ke banyak pelanggan sekaligus
        </p>
      </div>
      <BroadcastClient branches={branches} products={products} />
    </div>
  );
}
