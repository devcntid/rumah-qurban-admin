import { listTransactions } from "@/lib/db/queries/transactions";
import { TransactionList } from "./TransactionList";
import { Wallet } from "lucide-react";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const status = typeof params.status === "string" ? params.status : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;

  const { rows, total } = await listTransactions({
    page,
    status,
    type,
    search,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="text-blue-600" size={24} />
          Riwayat Transaksi
        </h2>
        <p className="text-slate-500 text-sm">
          Kelola data transaksi, verifikasi bukti transfer, dan matching order B2C/B2B.
        </p>
      </div>

      <TransactionList initialData={rows} total={total} currentPage={page} />
    </div>
  );
}
