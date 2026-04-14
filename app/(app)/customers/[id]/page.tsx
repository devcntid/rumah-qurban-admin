import { getDb } from "@/lib/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, Building2, ShoppingCart, TrendingUp, Calendar, Eye } from "lucide-react";

function formatIDR(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatPhone(phone: string) {
  if (phone.startsWith("62")) {
    const withoutPrefix = phone.slice(2);
    const part1 = withoutPrefix.slice(0, 3);
    const part2 = withoutPrefix.slice(3, 7);
    const part3 = withoutPrefix.slice(7);
    return `+62 ${part1}-${part2}-${part3}`;
  }
  return phone;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  
  const customerRows = await sql`
    SELECT
      id,
      phone_normalized as "phoneNormalized",
      name,
      email,
      customer_type as "customerType",
      company_name as "companyName",
      total_orders as "totalOrders",
      total_spent::text as "totalSpent",
      first_order_date as "firstOrderDate",
      last_order_date as "lastOrderDate",
      created_at as "createdAt"
    FROM customers
    WHERE id = ${id}
    LIMIT 1
  ` as any[];
  
  if (customerRows.length === 0) {
    notFound();
  }
  
  const customer = customerRows[0];
  
  const orders = await sql`
    SELECT
      id,
      invoice_number as "invoiceNumber",
      grand_total::text as "grandTotal",
      status,
      created_at as "createdAt"
    FROM orders
    WHERE customer_id = ${id}
    ORDER BY created_at DESC
  ` as any[];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/customers"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={14} /> Kembali
        </Link>
        <h1 className="text-2xl font-black text-[#102a43] flex items-center gap-2">
          <User className="text-blue-600" size={24} />
          Detail Customer
        </h1>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Nama Customer</label>
              <p className="text-lg font-bold text-slate-800 mt-1">{customer.name}</p>
            </div>
            
            {customer.companyName && (
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <Building2 size={12} /> Nama Perusahaan
                </label>
                <p className="text-sm font-bold text-slate-700 mt-1">{customer.companyName}</p>
              </div>
            )}
            
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                <Phone size={12} /> Nomor Telepon
              </label>
              <p className="text-sm font-mono font-bold text-slate-700 mt-1">{formatPhone(customer.phoneNormalized)}</p>
            </div>
            
            {customer.email && (
              <div>
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                  <Mail size={12} /> Email
                </label>
                <p className="text-sm font-medium text-slate-700 mt-1">{customer.email}</p>
              </div>
            )}
            
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Tipe Customer</label>
              <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${customer.customerType === 'B2B' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                {customer.customerType || "B2C"}
              </span>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <ShoppingCart size={16} />
                <label className="text-[10px] uppercase font-black tracking-wider">Total Orders</label>
              </div>
              <p className="text-3xl font-black text-blue-900">{customer.totalOrders}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <TrendingUp size={16} />
                <label className="text-[10px] uppercase font-black tracking-wider">Total Belanja</label>
              </div>
              <p className="text-2xl font-black text-green-900">{formatIDR(customer.totalSpent)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-700 mb-2">
                <Calendar size={16} />
                <label className="text-[10px] uppercase font-black tracking-wider">Order Dates</label>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">First: </span>
                  <span className="font-bold text-slate-800">
                    {customer.firstOrderDate 
                      ? new Date(customer.firstOrderDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                      : "-"
                    }
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Last: </span>
                  <span className="font-bold text-slate-800">
                    {customer.lastOrderDate 
                      ? new Date(customer.lastOrderDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                      : "-"
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-black text-[#102a43] uppercase tracking-wide">
            Riwayat Pesanan ({orders.length})
          </h3>
        </div>
        
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] uppercase text-slate-500 border-b border-slate-100 font-black tracking-widest">
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-black text-[#102a43]">{order.invoiceNumber}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-slate-600 font-medium">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", { 
                          day: "2-digit", 
                          month: "short", 
                          year: "numeric" 
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-black text-slate-800">{formatIDR(order.grandTotal)}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-block px-2 py-1 rounded text-[9px] font-black uppercase">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-blue-100 transition-all"
                      >
                        <Eye size={12} /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400 font-bold">Belum ada riwayat pesanan</p>
          </div>
        )}
      </div>
    </div>
  );
}
