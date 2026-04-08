import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrderWithItems } from "@/lib/db/queries/orders";

function formatIDR(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const session = await getSession();
  if (!session) notFound();

  const bundle = await getOrderWithItems(orderId, session.branchId);
  if (!bundle) notFound();

  const { order, items, participants } = bundle;
  const participantsByItem = new Map<number, typeof participants>();
  for (const p of participants) {
    const list = participantsByItem.get(p.orderItemId) ?? [];
    list.push(p);
    participantsByItem.set(p.orderItemId, list);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Detail Pesanan</h2>
        <p className="text-slate-500 text-sm">Invoice {order.invoiceNumber}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pelanggan
          </div>
          <div className="text-xl font-bold text-slate-800">{order.customerName}</div>
          {order.companyName && (
            <div className="text-sm text-slate-600 mt-1">{order.companyName}</div>
          )}
          <div className="text-sm text-slate-600">{order.customerPhone ?? "-"}</div>
          <div className="text-xs text-slate-500 mt-2">
            Tipe: <span className="font-bold text-slate-700">{order.customerType ?? "B2C"}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Ringkasan
          </div>
          <div className="text-3xl font-bold text-slate-800">{formatIDR(order.grandTotal)}</div>
          <div className="mt-3 text-xs text-slate-500">
            Subtotal: {formatIDR(order.subtotal)} • Diskon: {formatIDR(order.discount)}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            DP: <span className="font-bold text-green-700">{formatIDR(order.dpPaid)}</span> • Sisa:{" "}
            <span className="font-bold text-red-600">{formatIDR(order.remainingBalance)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Status
          </div>
          <span className="inline-block px-3 py-2 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {order.status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-bold text-slate-800">
          Baris pesanan
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-slate-500 border-b border-slate-100">
              <th className="p-3">Tipe</th>
              <th className="p-3">Nama</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Harga</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-slate-50">
                <td className="p-3 font-mono text-xs">{it.itemType}</td>
                <td className="p-3">
                  <div className="font-medium">{it.itemName}</div>
                  {(participantsByItem.get(it.id) ?? []).map((p) => (
                    <div key={p.id} className="text-xs text-slate-500 mt-1">
                      Peserta: {p.participantName}
                      {p.fatherName ? ` (bin ${p.fatherName})` : ""}
                    </div>
                  ))}
                </td>
                <td className="p-3 text-right">{it.quantity}</td>
                <td className="p-3 text-right">{formatIDR(it.unitPrice)}</td>
                <td className="p-3 text-right font-semibold">{formatIDR(it.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
