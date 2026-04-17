import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listBranches } from "@/lib/db/queries/master";
import SlaughterScheduleClient from "./SlaughterScheduleClient";

export default async function SlaughterSchedulesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const branches = await listBranches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Jadwal Penyembelihan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola jadwal penyembelihan dan assign order ke jadwal yang tersedia
        </p>
      </div>

      <SlaughterScheduleClient
        branches={branches}
        userRole={session.role}
        userBranchId={session.branchId}
      />
    </div>
  );
}
