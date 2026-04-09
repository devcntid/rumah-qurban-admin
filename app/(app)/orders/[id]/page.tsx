import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrderWithItems } from "@/lib/db/queries/orders";
import { 
  ArrowLeft, User, Phone, MapPin, Wallet, Receipt, 
  ShoppingCart, ListChecks, Calendar, CheckCircle2, Clock, MapIcon
} from "lucide-react";
import Link from "next/link";

function formatIDR(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

const statusColors: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  DP_PAID: "bg-blue-100 text-blue-700 border-blue-200",
  FULL_PAID: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

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

  const { order, items, participants, transactions } = bundle;
  const participantsByItem = new Map<number, typeof participants>();
  for (const p of participants) {
    const list = participantsByItem.get(Number(p.orderItemId)) ?? [];
    list.push(p);
    participantsByItem.set(Number(p.orderItemId), list);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-10 transition-all hover:shadow-md">
        <Link 
          href="/orders" 
          className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all hover:scale-105"
        >
          <ArrowLeft size={20}/>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Invoice {order.invoiceNumber}</h2>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
              {order.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mt-0.5">
            <Calendar size={12}/> Dibuat pada {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button className="hidden md:flex items-center gap-2 bg-[#102a43] text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-lg hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:scale-95 shadow-blue-900/10">
          <Receipt size={16} /> Cetak Invoice
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-110"></div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <User size={14} className="text-blue-500"/> Informasi Pelanggan
          </h4>
          <div className="space-y-4">
            <div>
              <p className="font-black text-slate-800 text-2xl leading-tight">{order.customerName}</p>
              {order.companyName && <p className="text-sm font-bold text-blue-600 italic mt-0.5">@{order.companyName}</p>}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <Phone size={14} className="text-slate-400"/> {order.customerPhone ?? "-"}
            </div>
            {order.deliveryAddress && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={12} className="text-red-500"/> Alamat Pengiriman
                </p>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">{order.deliveryAddress}</p>
                {(order.latitude && order.longitude) && (
                  <Link 
                    href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:underline mt-1"
                  >
                    <MapIcon size={12}/> Lihat di Peta
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Wallet size={14} className="text-green-500"/> Ringkasan Finansial
          </h4>
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-50">
              <p className="text-3xl font-black text-slate-800 tracking-tight">{formatIDR(order.grandTotal)}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                Subtotal: {formatIDR(order.subtotal)} | Diskon: {formatIDR(order.discount)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                <p className="text-[9px] font-black text-green-600 uppercase tracking-wider mb-1">Diterima (DP)</p>
                <p className="text-base font-black text-green-700">{formatIDR(order.dpPaid)}</p>
              </div>
              <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                <p className="text-[9px] font-black text-red-600 uppercase tracking-wider mb-1">Sisa Tagihan</p>
                <p className="text-base font-black text-red-700">{formatIDR(order.remainingBalance)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md flex flex-col">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} className="text-purple-500"/> Riwayat Pembayaran
          </h4>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar-light">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20 py-4">
                <Receipt size={30}/>
                <p className="text-[10px] font-black uppercase mt-2">Belum ada bayar</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="relative pl-6 pb-4 last:pb-0">
                  <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-blue-500 shadow-md shadow-blue-500/20"></div>
                  <div className="absolute left-[3.5px] top-3 w-[1px] h-full bg-slate-100 last:hidden"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-800 leading-none">{tx.transactionType}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">{new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} • {tx.paymentMethodCode ?? "Transfer"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-green-600">{formatIDR(tx.amount)}</p>
                      <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">{tx.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          <ShoppingCart size={18} className="text-[#102a43]"/> Rincian Pesanan
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-100 font-black tracking-widest">
                <th className="px-6 py-4">Kategori Item</th>
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-right">Harga Satuan</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      {it.itemType}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-800 text-base">{it.itemName}</div>
                    
                    {/* Participants List */}
                    {participantsByItem.has(Number(it.id)) && (
                      <div className="mt-4 space-y-2 border-l-4 border-blue-500/20 pl-4 py-1">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <ListChecks size={14}/> Manifest Peserta:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                          {participantsByItem.get(Number(it.id))!.map((p) => (
                            <div key={p.id} className="flex items-center gap-2 text-xs text-slate-600 group">
                              <CheckCircle2 size={12} className="text-green-500 opacity-50 group-hover:opacity-100"/>
                              <span className="font-bold">{p.participantName}</span>
                              {p.fatherName && <span className="text-slate-400 font-medium italic">(bin {p.fatherName})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center font-black text-slate-700 text-lg">{it.quantity}</td>
                  <td className="px-6 py-5 text-right font-bold text-slate-500">{formatIDR(it.unitPrice)}</td>
                  <td className="px-6 py-5 text-right font-black text-slate-800 text-lg tracking-tight">{formatIDR(it.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
