"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ShoppingCart, Building2, User, Phone, MapPin, Plus, Trash2, 
  Wallet, ChevronRight, ListChecks, Search, Tag, Info, Receipt
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createOrderAction } from "@/lib/actions/orders";
import type { CatalogOfferRow } from "@/lib/db/queries/catalog";
import type { ServiceRow } from "@/lib/db/queries/services";
import type { BranchRow } from "@/lib/db/queries/master";

const OrderItemSchema = z.object({
  id: z.string(), // Client-side unique ID
  itemType: z.string(),
  catalogOfferId: z.number().optional().nullable(),
  serviceId: z.number().optional().nullable(),
  itemName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number(),
  totalPrice: z.number(),
  coaCode: z.string().optional().nullable(),
  participants: z.array(
    z.object({
      name: z.string(),
      fatherName: z.string().optional().nullable(),
    })
  ).default([]),
});

type CartItem = z.infer<typeof OrderItemSchema>;

const PosFormSchema = z.object({
  customerType: z.enum(["B2B", "B2C"]),
  customerName: z.string().min(1, "Nama harus diisi"),
  companyName: z.string().optional().nullable(),
  customerPhone: z.string().min(1, "No HP harus diisi"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  deliveryAddress: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  discount: z.number().min(0),
  dpPaid: z.number().min(0),
});

export function PosClient({
  branchId,
  initialCatalog,
  initialServices,
  branches,
}: {
  branchId: number;
  initialCatalog: CatalogOfferRow[];
  initialServices: ServiceRow[];
  branches: BranchRow[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<z.infer<typeof PosFormSchema>>({
    resolver: zodResolver(PosFormSchema),
    defaultValues: {
      customerType: "B2C",
      discount: 0,
      dpPaid: 0,
    }
  });

  const customerType = watch("customerType");
  const discountInput = watch("discount");
  const dpPaidInput = watch("dpPaid");

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.totalPrice, 0), [cart]);
  const grandTotal = Math.max(0, subtotal - (Number(discountInput) || 0));
  const remainingBalance = Math.max(0, grandTotal - (Number(dpPaidInput) || 0));

  const currentBranch = branches.find(b => b.id === branchId)?.name ?? "Cabang";

  const addToCart = (item: Omit<CartItem, "id">) => {
    setCart([...cart, { ...item, id: crypto.randomUUID() }]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  const updateParticipant = (itemIdx: number, partIdx: number, field: "name" | "fatherName", value: string) => {
    const newCart = [...cart];
    newCart[itemIdx].participants[partIdx][field] = value;
    setCart(newCart);
  };

  const addParticipant = (itemIdx: number) => {
    const newCart = [...cart];
    newCart[itemIdx].participants.push({ name: "", fatherName: "" });
    setCart(newCart);
  };

  const removeParticipant = (itemIdx: number, partIdx: number) => {
    const newCart = [...cart];
    newCart[itemIdx].participants.splice(partIdx, 1);
    setCart(newCart);
  };

  const onSubmit = async (values: z.infer<typeof PosFormSchema>) => {
    if (cart.length === 0) {
      setError("Keranjang masih kosong");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await createOrderAction({
        ...values,
        branchId,
        subtotal,
        discount: values.discount ?? 0,
        grandTotal,
        dpPaid: values.dpPaid ?? 0,
        remainingBalance,
        status: dpPaidInput >= grandTotal ? "FULL_PAID" : dpPaidInput > 0 ? "DP_PAID" : "PENDING",
        items: cart.map(({ id, ...rest }) => rest), // Remove client-side id
      });
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan saat menyimpan pesanan");
      setIsSubmitting(false);
    }
  };

  const formatIDR = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">POS / Invoicing</h2>
          <p className="text-slate-500 text-sm">Cabang: <span className="font-bold text-slate-700">{currentBranch}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-6">
        {/* Left Column: Form & Cart */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-[#102a43]"/> Data Pelanggan
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setValue("customerType", "B2C")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${customerType === "B2C" ? "bg-white shadow text-[#102a43]" : "text-slate-500 hover:text-slate-700"}`}
                >
                  B2C (Individu)
                </button>
                <button 
                  type="button"
                  onClick={() => setValue("customerType", "B2B")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${customerType === "B2B" ? "bg-white shadow text-[#102a43]" : "text-slate-500 hover:text-slate-700"}`}
                >
                  B2B (Instansi)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {customerType === "B2B" && (
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Instansi / Perusahaan</label>
                  <input 
                    {...register("companyName")}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-blue-50/30 transition-all font-medium"
                    placeholder="Contoh: PT. Abadi Jaya"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama {customerType === "B2B" ? "PIC" : "Pelanggan"} *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400"/>
                  <input 
                    {...register("customerName")}
                    className={`w-full border ${errors.customerName ? "border-red-300" : "border-slate-200"} rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium`}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">No. WhatsApp *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3 text-slate-400"/>
                  <input 
                    {...register("customerPhone")}
                    className={`w-full border ${errors.customerPhone ? "border-red-300" : "border-slate-200"} rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium`}
                    placeholder="08xxxx"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Alamat Pengiriman</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400"/>
                  <textarea 
                    {...register("deliveryAddress")}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-20 transition-all font-medium"
                    placeholder="Masukkan alamat lengkap tujuan pengiriman"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide italic">Latitude</label>
                  <input 
                    type="number" step="any"
                    {...register("latitude", { valueAsNumber: true })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium bg-slate-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide italic">Longitude</label>
                  <input 
                    type="number" step="any"
                    {...register("longitude", { valueAsNumber: true })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart size={20} className="text-[#102a43]"/> Keranjang Belanja
              </h3>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="bg-[#102a43] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Plus size={14}/> Pilih Hewan
                </button>
                <button 
                  type="button"
                  onClick={() => setIsServiceOpen(true)}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Plus size={14}/> Tambah Layanan
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 min-h-[100px]">
              {cart.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic flex flex-col items-center gap-3">
                  <ShoppingCart size={40} className="opacity-10"/>
                  <p>Keranjang masih kosong. Klik tombol di atas untuk menambah item.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.itemType === "ANIMAL" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                             {item.itemType}
                           </span>
                           <span className="text-[10px] font-mono text-slate-400">COA: {item.coaCode ?? "-"}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.itemName}</h4>
                        <p className="text-sm text-slate-500 font-medium">{item.quantity} x {formatIDR(item.unitPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 text-lg">{formatIDR(item.totalPrice)}</p>
                        <button 
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-600 mt-2 p-1 transition-colors"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>

                    {/* Participants for Animal Items */}
                    {item.itemType === "ANIMAL" && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ListChecks size={14}/> Nama Peserta Qurban</span>
                           <button 
                             type="button"
                             onClick={() => addParticipant(idx)}
                             className="text-blue-600 font-bold text-[10px] uppercase hover:underline"
                           >
                             + Tambah Peserta
                           </button>
                         </div>
                         <div className="space-y-2">
                           {item.participants.map((p, pIdx) => (
                             <div key={pIdx} className="grid grid-cols-2 gap-3 items-center">
                               <input 
                                 type="text"
                                 placeholder="Nama Peserta"
                                 value={p.name}
                                 onChange={(e) => updateParticipant(idx, pIdx, "name", e.target.value)}
                                 className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 transition-all font-medium"
                               />
                               <div className="flex items-center gap-2">
                                 <input 
                                   type="text"
                                   placeholder="Bin (Ayah)"
                                   value={p.fatherName ?? ""}
                                   onChange={(e) => updateParticipant(idx, pIdx, "fatherName", e.target.value)}
                                   className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 transition-all font-medium"
                                 />
                                 <button type="button" onClick={() => removeParticipant(idx, pIdx)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Submit */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6 transition-all hover:shadow-md">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-4 mb-5 flex items-center gap-2">
              <Wallet size={20} className="text-[#102a43]"/> Ringkasan Finansial
            </h3>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-slate-600">Subtotal Item</span>
                 <span className="text-slate-900 font-bold">{formatIDR(subtotal)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-slate-600">Diskon Global</span>
                 <div className="relative">
                   <span className="absolute left-3 top-1.5 text-red-500 font-bold">-</span>
                   <input 
                     type="number"
                     {...register("discount", { valueAsNumber: true })}
                     className="w-32 border border-slate-200 rounded-xl pl-6 pr-3 py-1.5 text-right outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-bold text-red-600 transition-all"
                   />
                 </div>
               </div>

               <div className="h-px bg-slate-100 my-2"></div>

               <div className="flex justify-between items-center pb-2">
                 <span className="font-bold text-slate-800">Grand Total</span>
                 <span className="text-2xl font-black text-[#102a43]">{formatIDR(grandTotal)}</span>
               </div>

               <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="flex justify-between items-center text-sm font-bold text-blue-800">
                    <span className="flex items-center gap-1.5"><Receipt size={14}/> Uang Muka (DP)</span>
                    <input 
                      type="number"
                      {...register("dpPaid", { valueAsNumber: true })}
                      className="w-32 border border-blue-200 bg-white rounded-lg px-3 py-1.5 text-right outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-black text-blue-700 transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-semibold italic">Sisa Tagihan</span>
                    <span className="font-bold text-red-600">{formatIDR(remainingBalance)}</span>
                  </div>
               </div>

               {error && (
                 <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 mb-4 animate-pulse">
                   ❌ {error}
                 </div>
               )}

               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className={`w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-[#102a43] text-white hover:bg-slate-800 hover:-translate-y-1 shadow-blue-900/10"}`}
               >
                 {isSubmitting ? "Memproses..." : "Terbitkan Invoice"}
                 {!isSubmitting && <ChevronRight size={20}/>}
               </button>

               <div className="pt-2 text-[10px] text-slate-400 text-center leading-relaxed">
                 Invoice akan otomatis ter-generate dan data akan tereservasi ke tim kandang & logistik.
               </div>
            </div>
          </div>
        </div>
      </form>

      {/* Catalog Modal */}
      <Modal 
        open={isCatalogOpen} 
        onClose={() => setIsCatalogOpen(false)} 
        title="Katalog Hewan Qurban"
        maxWidthClassName="max-w-4xl"
      >
        <div className="space-y-4">
           {initialCatalog.length === 0 ? (
             <p className="p-8 text-center text-slate-500 italic">Tidak ada produk tersedia di cabang ini.</p>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {initialCatalog.map((offer) => (
                 <div 
                   key={offer.id} 
                   className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all hover:border-blue-300"
                   onClick={() => {
                     addToCart({
                       itemType: "ANIMAL",
                       catalogOfferId: offer.id,
                       itemName: offer.displayName,
                       quantity: 1,
                       unitPrice: Number(offer.price),
                       totalPrice: Number(offer.price),
                       coaCode: "ANIMAL_PRODUCT",
                       participants: [{ name: "", fatherName: "" }]
                     });
                     setIsCatalogOpen(false);
                   }}
                 >
                   <div className="flex gap-4">
                     <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                       {offer.imageUrl ? <img src={offer.imageUrl} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full"><Tag className="text-slate-300"/></div>}
                     </div>
                     <div className="flex-1">
                       <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{offer.displayName}</h4>
                       <p className="text-xs text-slate-500 mb-2">{offer.subType ?? "Standard"} • {offer.weightRange ?? "?"} Kg</p>
                       <p className="text-sm font-bold text-green-700">{formatIDR(Number(offer.price))}</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </Modal>

      {/* Service Modal */}
      <Modal 
        open={isServiceOpen} 
        onClose={() => setIsServiceOpen(false)} 
        title="Pilih Layanan Tambahan"
      >
        <div className="space-y-3">
          {initialServices.map((service) => (
            <div 
              key={service.id}
              className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-all hover:border-blue-300"
              onClick={() => {
                addToCart({
                  itemType: service.serviceType,
                  serviceId: service.id,
                  itemName: service.name,
                  quantity: 1,
                  unitPrice: Number(service.basePrice),
                  totalPrice: Number(service.basePrice),
                  coaCode: service.coaCode,
                  participants: []
                });

                setIsServiceOpen(false);
              }}
            >
              <div>
                <h4 className="font-bold text-slate-800">{service.name}</h4>
                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{service.serviceType}</p>
              </div>
              <span className="font-bold text-blue-700">{formatIDR(Number(service.basePrice))}</span>
            </div>
          ))}

          {/* Optional: Add custom manual item */}
          <div 
            className="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-all hover:border-slate-300"
            onClick={() => {
              const name = prompt("Nama Item:");
              const price = Number(prompt("Harga Satuan:"));
              if (name && !isNaN(price)) {
                addToCart({
                  itemType: "CUSTOM",
                  itemName: name,
                  quantity: 1,
                  unitPrice: price,
                  totalPrice: price,
                  coaCode: "CUSTOM_PRODUCT",
                  participants: []
                });

                setIsServiceOpen(false);
              }
            }}
          >
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><Search size={16} className="text-slate-400"/></div>
             <div>
                <p className="font-bold text-slate-700 text-sm">Input Manual (Custom)</p>
                <p className="text-xs text-slate-400">Tambah deskripsi dan harga bebas</p>
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
