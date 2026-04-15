import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listBranches } from "@/lib/db/queries/master";
import SlaughterClient from "./SlaughterClient";

export default async function SlaughterPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const branches = await listBranches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Penyembelihan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola dan monitor semua record penyembelihan
          </p>
        </div>
      </div>

      <SlaughterClient 
        branches={branches}
        userRole={session.role}
        userBranchId={session.branchId}
      />
    </div>
  );
}
