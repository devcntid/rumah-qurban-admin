import { getDb } from "@/lib/db/client";
import { UserCrud } from "./UserCrud";

type Branch = {
  id: number;
  name: string;
};

async function getBranches(): Promise<Branch[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name
    FROM branches
    WHERE is_active = true
    ORDER BY name ASC
  `;
  return rows as unknown as Branch[];
}

export default async function UsersPage() {
  const branches = await getBranches();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola admin users dan permissions
        </p>
      </div>
      <UserCrud branches={branches} />
    </div>
  );
}
