import {
  listAnimalVariantBranchLinks,
  listAnimalVariants,
  listBranches,
  listPaymentMethods,
  listSalesAgents,
  listVendors,
} from "@/lib/db/queries/master";
import { listServices } from "@/lib/db/queries/services";
import { MasterCrud } from "@/app/(app)/master/MasterCrud";

export default async function MasterPage() {
  const branches = await listBranches();
  const vendors = await listVendors();
  const payments = await listPaymentMethods();
  const salesAgents = await listSalesAgents();
  const [animalVariants, variantBranchLinks] = await Promise.all([
    listAnimalVariants(),
    listAnimalVariantBranchLinks(),
  ]);
  const services = await listServices();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Master Data</h2>
        <p className="text-slate-500 text-sm">CRUD + filter bertahap (fondasi cepat).</p>
      </div>

      <MasterCrud
        branches={branches}
        vendors={vendors}
        payments={payments}
        salesAgents={salesAgents}
        animalVariants={animalVariants}
        variantBranchLinks={variantBranchLinks}
        services={services}
      />
    </div>
  );
}
