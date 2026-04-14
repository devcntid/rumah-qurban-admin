"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ShoppingCart, Building2, User, Phone, MapPin, Plus, Trash2, 
  Wallet, ChevronRight, ListChecks, Search, Tag, Info, Receipt,
  Minus, Filter, ChevronLeft, Map as MapIcon
} from "lucide-react";
import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { createOrderAction, updateOrderViaPosAction } from "@/lib/actions/orders";
import { searchCatalogAction, getCatalogFiltersAction } from "@/lib/actions/catalog";
import type { CatalogOfferRow } from "@/lib/db/queries/catalog";
import type { ServiceRow } from "@/lib/db/queries/services";
import type { BranchRow } from "@/lib/db/queries/master";
import type {
  OrderDetail,
  OrderItemRow,
  OrderParticipantRow,
} from "@/lib/db/queries/orders";

const MapPicker = dynamic(() => import("@/components/ui/MapPicker").then(mod => mod.MapPicker), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">Memuat Peta...</div>
});

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

type CartItem = z.infer<typeof OrderItemSchema> & { orderItemId?: number };

/** Server Actions hanya boleh menerima struktur JSON murni (tanpa undefined / NaN / field tak terduga). */
function toServerActionJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return Number(v);
      if (typeof v === "number" && !Number.isFinite(v)) return null;
      return v;
    })
  ) as T;
}

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
  branchId: defaultBranchId,
  initialCatalog,
  initialServices,
  branches,
  editBundle,
  editLoadError,
}: {
  branchId: number;
  initialCatalog: CatalogOfferRow[];
  initialServices: ServiceRow[];
  branches: BranchRow[];
  editBundle: {
    order: OrderDetail;
    items: OrderItemRow[];
    participants: OrderParticipantRow[];
  } | null;
  editLoadError?: string | null;
}) {
  const router = useRouter();
  const editInitRef = useRef<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalog Search & Filter State
  const [catalogData, setCatalogData] = useState<CatalogOfferRow[]>(initialCatalog);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranchId, setFilterBranchId] = useState<number | undefined>(defaultBranchId);
  const [filterSpecies, setFilterSpecies] = useState("");
  const [filterProductCode, setFilterProductCode] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  
  // Filter Options
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);
  const [productOptions, setProductOptions] = useState<{id: number, name: string, code: string}[]>([]);
  const [gradeOptions, setGradeOptions] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<z.infer<typeof PosFormSchema>>({
    resolver: zodResolver(PosFormSchema),
    defaultValues: {
      customerType: "B2C",
      discount: 0,
      dpPaid: 0,
    }
  });

  useEffect(() => {
    if (editLoadError) setError(editLoadError);
  }, [editLoadError]);

  useEffect(() => {
    if (!editBundle) {
      editInitRef.current = null;
      return;
    }
    const oid = editBundle.order.id;
    if (editInitRef.current === oid) return;
    editInitRef.current = oid;

    const { order, items, participants } = editBundle;
    setCart(
      items.map((it) => {
        const parts = participants
          .filter((p) => Number(p.orderItemId) === Number(it.id))
          .map((p) => ({
            name: p.participantName,
            fatherName: p.fatherName ?? "",
          }));
        const defaultParts =
          it.itemType === "ANIMAL"
            ? parts.length > 0
              ? parts
              : [{ name: "", fatherName: "" }]
            : [];
        return {
          id: `oi-${it.id}`,
          orderItemId: Number(it.id),
          itemType: it.itemType,
          catalogOfferId: it.catalogOfferId,
          serviceId: it.serviceId,
          itemName: it.itemName,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
          coaCode: it.coaCode ?? null,
          participants: defaultParts,
        };
      })
    );

    const latRaw = order.latitude;
    const lngRaw = order.longitude;
    const lat =
      latRaw != null && String(latRaw) !== ""
        ? Number(latRaw)
        : undefined;
    const lng =
      lngRaw != null && String(lngRaw) !== ""
        ? Number(lngRaw)
        : undefined;

    reset({
      customerType: order.customerType === "B2B" ? "B2B" : "B2C",
      customerName: order.customerName,
      companyName: order.companyName ?? "",
      customerPhone: order.customerPhone ?? "",
      customerEmail: order.customerEmail ?? "",
      deliveryAddress: order.deliveryAddress ?? "",
      latitude: lat != null && Number.isFinite(lat) ? lat : undefined,
      longitude: lng != null && Number.isFinite(lng) ? lng : undefined,
      discount: Number(order.discount),
      dpPaid: Number(order.dpPaid),
    });
    setFilterBranchId(order.branchId ?? defaultBranchId);
    setCatalogData(initialCatalog);
  }, [editBundle, reset, defaultBranchId, initialCatalog]);

  const customerType = watch("customerType");
  const discountInput = watch("discount");
  const dpPaidInput = watch("dpPaid");

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.totalPrice, 0), [cart]);
  const grandTotal = Math.max(0, subtotal - (Number(discountInput) || 0));
  const remainingBalance = Math.max(0, grandTotal - (Number(dpPaidInput) || 0));

  const displayBranchId = editBundle?.order.branchId ?? defaultBranchId;
  const currentBranch = branches.find((b) => b.id === displayBranchId)?.name ?? "Cabang";

  // Fetch Filters on Mount
  useEffect(() => {
    getCatalogFiltersAction().then(res => {
      if (res.success) {
        // Type narrowing for successful response
        const data = res as { species: string[]; products: any[]; grades: string[] };
        setSpeciesOptions(data.species || []);
        setProductOptions(data.products || []);
        setGradeOptions(data.grades || []);
      }
    });
  }, []);

  // Fetch Catalog when filters change
  useEffect(() => {
    if (!isCatalogOpen) return;

    const timer = setTimeout(() => {
      setCatalogLoading(true);
      searchCatalogAction({
        branchId: filterBranchId,
        species: filterSpecies || undefined,
        productCode: filterProductCode || undefined,
        classGrade: filterGrade || undefined,
        q: searchTerm || undefined,
        limit: catalogPageSize,
        offset: (catalogPage - 1) * catalogPageSize
      }).then(res => {
        if (res.success && res.data) {
          setCatalogData(res.data);
          setCatalogTotal(res.total ?? 0);
        }
        setCatalogLoading(false);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [isCatalogOpen, catalogPage, searchTerm, filterBranchId, filterSpecies, filterProductCode, filterGrade, catalogPageSize]);

  const addToCart = (item: Omit<CartItem, "id">) => {
    setCart([...cart, { ...item, id: crypto.randomUUID() }]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          totalPrice: newQty * item.unitPrice
        };
      }
      return item;
    }));
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

    const editingId = editBundle?.order.id;
    const payStatus =
      dpPaidInput >= grandTotal ? "FULL_PAID" : dpPaidInput > 0 ? "DP_PAID" : "PENDING";
    const lat =
      typeof values.latitude === "number" && Number.isFinite(values.latitude)
        ? values.latitude
        : null;
    const lng =
      typeof values.longitude === "number" && Number.isFinite(values.longitude)
        ? values.longitude
        : null;

    try {
      if (editingId != null) {
        const itemsPayload = cart.map((row) => {
          const participants = (row.participants ?? []).map((p) => ({
            name: String(p.name ?? ""),
            fatherName:
              p.fatherName != null && String(p.fatherName).trim() !== ""
                ? String(p.fatherName)
                : null,
          }));
          const line: {
            orderItemId?: number;
            itemType: string;
            catalogOfferId: number | null;
            serviceId: number | null;
            itemName: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            coaCode: string | null;
            participants: { name: string; fatherName: string | null }[];
          } = {
            itemType: String(row.itemType),
            catalogOfferId:
              row.catalogOfferId != null && Number.isFinite(Number(row.catalogOfferId))
                ? Number(row.catalogOfferId)
                : null,
            serviceId:
              row.serviceId != null && Number.isFinite(Number(row.serviceId))
                ? Number(row.serviceId)
                : null,
            itemName: String(row.itemName),
            quantity: Math.max(1, Math.floor(Number(row.quantity)) || 1),
            unitPrice: Number(row.unitPrice),
            totalPrice: Number(row.totalPrice),
            coaCode: row.coaCode != null ? String(row.coaCode) : null,
            participants,
          };
          const rawOid = row.orderItemId as unknown;
          const oid =
            typeof rawOid === "bigint"
              ? Number(rawOid)
              : typeof rawOid === "number"
                ? rawOid
                : typeof rawOid === "string" && rawOid.trim() !== ""
                  ? Number(rawOid)
                  : NaN;
          if (Number.isFinite(oid) && oid > 0) {
            line.orderItemId = Math.trunc(oid);
          }
          return line;
        });

        const payload = {
          orderId: editingId,
          customerType: values.customerType,
          customerName: values.customerName,
          companyName: values.companyName?.trim() ? values.companyName.trim() : null,
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail?.trim() ? values.customerEmail.trim() : null,
          deliveryAddress: values.deliveryAddress?.trim() ? values.deliveryAddress.trim() : null,
          latitude: lat,
          longitude: lng,
          discount: Number.isFinite(values.discount) ? Number(values.discount) : 0,
          dpPaid: Number.isFinite(values.dpPaid) ? Number(values.dpPaid) : 0,
          subtotal: Number.isFinite(subtotal) ? subtotal : 0,
          status: payStatus,
          items: itemsPayload,
        };

        const res = await updateOrderViaPosAction(toServerActionJson(payload));
        setIsSubmitting(false);
        if (res.success) {
          toast.success("Pesanan diperbarui.");
          router.push(`/orders/${res.orderId}`);
        } else {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      const res = await createOrderAction({
        ...values,
        branchId: defaultBranchId,
        subtotal,
        discount: values.discount ?? 0,
        grandTotal,
        dpPaid: values.dpPaid ?? 0,
        remainingBalance,
        status: payStatus,
        items: cart.map(({ id: _cid, orderItemId: _oid, ...rest }) => rest),
      });
      setCart([]);
      setValue("discount", 0);
      setValue("dpPaid", 0);
      setIsSubmitting(false);

      if (res.success && (res as { orderId?: number }).orderId) {
        window.open(`/api/orders/${(res as { orderId: number }).orderId}/invoice`, "_blank");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan pesanan";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const formatIDR = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">POS / Invoicing</h2>
          <p className="text-slate-500 text-sm">
            Cabang: <span className="font-bold text-slate-700">{currentBranch}</span>
          </p>
          {editBundle && (
            <p className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-2xl leading-relaxed">
              Mengedit {editBundle.order.invoiceNumber}. Baris yang sudah terhubung ke inventori
              hewan tidak bisa dihapus dari keranjang.
            </p>
          )}
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
              <div className="md:col-span-2 space-y-4 pt-2">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <MapIcon size={18} className="text-blue-600"/>
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Titik Lokasi Pengiriman (Opsional)</span>
                     </div>
                     <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">Map Picker</span>
                  </div>
                  
                  <MapPicker 
                    initialLat={watch("latitude") || undefined}
                    initialLng={watch("longitude") || undefined}
                    onLocationSelect={(lat, lng, addr) => {
                      setValue("latitude", lat);
                      setValue("longitude", lng);
                      if (addr && !watch("deliveryAddress")) {
                        setValue("deliveryAddress", addr);
                      }
                    }}
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Latitude</label>
                      <input 
                        type="number" step="any"
                        {...register("latitude", { valueAsNumber: true })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Longitude</label>
                      <input 
                        type="number" step="any"
                        {...register("longitude", { valueAsNumber: true })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 bg-white font-mono"
                      />
                    </div>
                  </div>
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
                        <div className="flex items-center gap-2 mt-2">
                           <button 
                             type="button" 
                             onClick={() => updateQuantity(item.id, -1)}
                             className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100 hover:border-slate-400 text-slate-700 transition-all shadow-sm active:scale-95"
                           >
                             <Minus size={14} strokeWidth={3}/>
                           </button>
                           <span className="w-10 text-center font-black text-lg text-[#102a43]">{item.quantity}</span>
                           <button 
                             type="button" 
                             onClick={() => updateQuantity(item.id, 1)}
                             className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-400 text-blue-600 transition-all shadow-sm active:scale-95"
                           >
                             <Plus size={14} strokeWidth={3}/>
                           </button>
                           <span className="text-[11px] text-slate-600 font-bold ml-2 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                             @ {formatIDR(item.unitPrice)}
                           </span>
                        </div>
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
                 {isSubmitting
                   ? "Memproses..."
                   : editBundle
                     ? "Simpan perubahan"
                     : "Terbitkan Invoice"}
                 {!isSubmitting && <ChevronRight size={20}/>}
               </button>

               <div className="pt-2 text-[10px] text-slate-400 text-center leading-relaxed">
                 {editBundle
                   ? "Setelah simpan Anda akan diarahkan ke halaman detail pesanan."
                   : "Invoice akan otomatis ter-generate dan data akan tereservasi ke tim kandang & logistik."}
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
        maxWidthClassName="max-w-5xl"
      >
        <div className="space-y-6">
           {/* Filters & Search */}
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cabang</label>
                  <select 
                    value={filterBranchId || ""} 
                    onChange={(e) => {
                      setFilterBranchId(e.target.value ? Number(e.target.value) : undefined);
                      setCatalogPage(1);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Semua Cabang</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Spesies</label>
                  <select 
                    value={filterSpecies} 
                    onChange={(e) => {
                      setFilterSpecies(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Semua Spesies</option>
                    {speciesOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Variasi/Grade</label>
                  <select 
                    value={filterGrade} 
                    onChange={(e) => {
                      setFilterGrade(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Semua Grade</option>
                    {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Produk</label>
                  <select 
                    value={filterProductCode} 
                    onChange={(e) => {
                      setFilterProductCode(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Semua Produk</option>
                    {productOptions.map(p => <option key={p.id} value={p.code}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cari Term</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                    <input 
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCatalogPage(1);
                      }}
                      placeholder="Nama, SKU, Tipe..."
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs outline-none bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
           </div>

           {/* Catalog List */}
           {catalogLoading ? (
             <div className="p-12 text-center flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-sm text-slate-500 font-medium">Memuat katalog...</p>
             </div>
           ) : catalogData.length === 0 ? (
             <p className="p-12 text-center text-slate-500 italic bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
               Tidak ada produk yang sesuai dengan filter.
             </p>
           ) : (
             <>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {catalogData.map((offer) => (
                   <div 
                     key={offer.id} 
                     className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all hover:border-blue-400 hover:shadow-sm"
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
                     <div className="flex gap-3">
                       <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                         {offer.imageUrl ? <img src={offer.imageUrl} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full"><Tag className="text-slate-300"/></div>}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-1.5 mb-0.5">
                           <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 flex items-center gap-1">
                             <Building2 size={10}/> {offer.branchName || "Global"}
                           </span>
                         </div>
                         <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate">{offer.displayName}</h4>
                         <p className="text-[10px] text-slate-500 mb-1 font-medium">{offer.subType ?? "Standard"} • {offer.offerWeightRange ?? "?"} Kg</p>
                         <p className="text-xs font-black text-blue-700">{formatIDR(Number(offer.price))}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               {/* Pagination UI - Custom for Modal */}
               <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Menampilkan <span className="text-slate-700">{catalogData.length}</span> dari <span className="text-slate-700">{catalogTotal}</span> produk
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={catalogPage <= 1}
                      onClick={() => setCatalogPage(p => p - 1)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1"
                    >
                      <ChevronLeft size={14}/> Prev
                    </button>
                    <span className="text-xs font-black px-3 py-1.5 bg-slate-100 rounded-lg">{catalogPage}</span>
                    <button 
                      disabled={catalogPage * catalogPageSize >= catalogTotal}
                      onClick={() => setCatalogPage(p => p + 1)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1"
                    >
                      Next <ChevronRight size={14}/>
                    </button>
                  </div>
               </div>
             </>
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
