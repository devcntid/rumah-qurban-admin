import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, ClipboardList, Wallet, Map as MapIcon, Truck, Tags, Database, Activity,
  LogOut, Bell, Search, Filter, Download, Eye, Camera, Video, Printer, Plus, MapPin, Heart, User, Edit, 
  Trash2, X, Save, CheckCircle, FileJson, ArrowLeft, PlayCircle, TrendingUp, Building2, FileText, 
  ListChecks, ChevronRight, ChevronLeft, Receipt
} from 'lucide-react';

// --- DUMMY INITIAL DATA ---
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard Analytics', icon: <LayoutDashboard size={20} /> },
  { id: 'targets', label: 'Target & Performa', icon: <TrendingUp size={20} /> },
  { id: 'pos', label: 'POS / Invoicing', icon: <ShoppingCart size={20} /> },
  { id: 'orders', label: 'Manajemen Pesanan', icon: <ClipboardList size={20} /> },
  { id: 'finance', label: 'Verifikasi Pembayaran', icon: <Wallet size={20} /> },
  { id: 'farm', label: 'Kandang & Inventaris', icon: <MapIcon size={20} /> },
  { id: 'logistics', label: 'Logistik & Pengiriman', icon: <Truck size={20} /> },
  { id: 'pricing', label: 'Harga, Produk & Kuota', icon: <Tags size={20} /> },
  { id: 'master', label: 'Master Data', icon: <Database size={20} /> },
  { id: 'logs', label: 'System Logs', icon: <Activity size={20} /> },
];

const INITIAL_ORDERS = [
  { 
    id: 'INV-2605001', date: '24 May 2026', customer: 'PT. Telkom Indonesia', type_customer: 'B2B', phone: '085642420971', address: 'Griya Gamersi Lalung RT 005...', type: 'Qurban Antar', branch: 'Bandung Raya', subtotal: 105000000, discount: 5000000, total: 100000000, dp: 50000000, remaining: 50000000, status: 'DP_PAID', lat: '-6.89123', lng: '107.60351',
    items: [ { id: 1, name: 'Paket Corporate Domba', category: 'ANIMAL_PRODUCT', qty: 50, price: 105000000, participants: ['List Terlampir Excel'] } ],
    payments: [ { id: 'TRX-001', type: 'Uang Muka (DP)', date: '24 May 2026', method: 'Transfer Mandiri', amount: 50000000, status: 'VERIFIED', proof_url: '#' } ],
    tracking: { date: '2026-06-15', vehicle: 'Truk Fuso (D 8802)', driver: 'Kusman', status: 'PREPARING' },
    docs: { is_bulk: true, assigned_qty: 12, required_qty: 50, tag: 'Assigned: 12 Ekor', images: [], videos: [] }
  },
  { 
    id: 'INV-2605002', date: '25 May 2026', customer: 'Lili Apriliyani', type_customer: 'B2C', phone: '081317854742', address: 'Pondok Ranggon', type: 'Qurban Antar', branch: 'Jakarta Raya', subtotal: 3450000, discount: 0, total: 3450000, dp: 3450000, remaining: 0, status: 'FULL_PAID', lat: '-6.20876', lng: '106.84559',
    items: [ { id: 4, name: 'Domba Tipe B', category: 'ANIMAL_PRODUCT', qty: 1, price: 3300000, participants: ['Lili Apriliyani'] }, { id: 5, name: 'Ongkir Jakarta', category: 'SHIPPING_FEE', qty: 1, price: 150000 } ],
    payments: [ { id: 'TRX-002', type: 'Pelunasan (Full)', date: '25 May 2026', method: 'QRIS', amount: 3450000, status: 'VERIFIED', proof_url: null } ],
    tracking: { date: 'Belum dijadwalkan', vehicle: '-', driver: '-', status: 'PENDING' },
    docs: { is_bulk: false, tag: 'TAG-2268', assigned_qty: 1, required_qty: 1, images: ['https://images.pexels.com/photos/288621/pexels-photo-288621.jpeg?auto=compress&cs=tinysrgb&w=400'], videos: ['https://images.pexels.com/photos/840111/pexels-photo-840111.jpeg?auto=compress&cs=tinysrgb&w=400'] }
  }
];

const INITIAL_INVENTORY = [
  { tag: 'TAG-1001', type: 'Domba Tipe B', weight: 23.5, status: 'BOOKED', order_id: 'INV-2605001' },
  { tag: 'TAG-1002', type: 'Domba Tipe B', weight: 24.1, status: 'BOOKED', order_id: 'INV-2605001' },
  { tag: 'TAG-1003', type: 'Domba Tipe B', weight: 25.0, status: 'AVAILABLE', order_id: null },
  { tag: 'TAG-1004', type: 'Domba Tipe B', weight: 23.8, status: 'AVAILABLE', order_id: null },
  { tag: 'TAG-1005', type: 'Domba Tipe B', weight: 24.5, status: 'AVAILABLE', order_id: null },
  { tag: 'TAG-2268', type: 'Domba Tipe B', weight: 24.2, status: 'BOOKED', order_id: 'INV-2605002' },
  { tag: 'TAG-9001', type: 'Sapi Limousin', weight: 255.0, status: 'AVAILABLE', order_id: null },
];

const INITIAL_FARM = [
  { id: 1, invoice: 'INV-2605001', customer: 'PT. Telkom Indonesia', type: 'Domba Tipe B', tag: 'Assigned: 12 Ekor', status: 'BOOKED', is_bulk: true },
  { id: 2, invoice: 'INV-2605002', customer: 'Lili Apriliyani', type: 'Domba Tipe B', tag: '', status: 'MENUNGGU', is_bulk: false }
];

const INITIAL_LOGISTICS = [
  { id: 1, invoice: 'INV-2605001', customer: 'PT. Telkom Indonesia', address: 'Griya Gamersi Lalung RT 005...', lat: '-6.89123', lng: '107.60351', tag: 'Multiple (50)', date: '2026-06-15', vehicle: 'Truk Fuso (D 8802 TO) - Kusman', status: 'PREPARING' }
];

const INITIAL_FINANCE = [
  { id: 1, time: 'Hari ini, 10:30', invoice: 'INV-2605001', customer: 'PT. Telkom Indonesia', method: 'Transfer Mandiri', amount: 50000000 }
];

const INITIAL_PRICING = [
  { id: 1, branch: 'Bandung Raya', vendor: 'Pusat Sukamiskin', type: 'Domba Tipe B', weight: '23.00 - 25.00 Kg', price: 2100000 },
  { id: 2, branch: 'Jakarta Raya', vendor: 'Mitra Gembong', type: 'Domba Tipe B', weight: '23.00 - 25.00 Kg', price: 3300000 }
];

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Qurban Berbagi Sapi di Desa Oebufu', category: 'BERBAGI', target: 80, current: 40, price: 1700000, coa: '400-20-101' },
];

const INITIAL_ADDONS = [
  { id: 1, name: 'Ongkos Kirim Area Bandung', category: 'SHIPPING_FEE', price: 50000, branch: 'Bandung Raya', coa: '400-40-101' },
  { id: 2, name: 'Jasa Potong Sapi', category: 'SLAUGHTER_FEE', price: 150000, branch: 'Semua Cabang', coa: '400-50-101' }
];

const INITIAL_BRANCHES = [
  { id: 1, name: 'Bandung Raya', address: 'Jl. Golf Barat Raya No 36...', coa: '400-10-101', status: 'Aktif' },
];

const INITIAL_VENDORS = [
  { id: 1, name: 'Pusat Sukamiskin', location: 'Bandung', status: 'Aktif' },
];

const INITIAL_PAYMENTS = [
  { id: 1, code: 'TF_MANDIRI', name: 'Transfer Bank Mandiri', category: 'MANUAL_TRANSFER', coa: '110-10-101', status: 'Aktif' },
];

const INITIAL_SALES = [
  { id: 1, name: 'Agro Great', category: 'KEMITRAAN', phone: '08123456789' },
];

const INITIAL_USERS = [
  { id: 1, name: 'Budi (SA)', email: 'budi@rumahqurban.id', role: 'SUPER_ADMIN', status: 'Aktif' },
];

const INITIAL_LOGS = {
  notif: [
    { id: 1, time: '2026-05-24 10:05:12', target: '085642420971', status: 'SENT', payload: { template: "INVOICE", invoice_no: "INV-2605001" }, response: { status: "success" } }
  ],
  payment: [],
  zains: []
};

const CHART_DATA = [
  { day: '20 Mei', val: 40, label: 'Rp 400 Juta' }, { day: '21 Mei', val: 60, label: 'Rp 600 Juta' }, { day: '22 Mei', val: 45, label: 'Rp 450 Juta' },
  { day: '23 Mei', val: 80, label: 'Rp 800 Juta' }, { day: '24 Mei', val: 65, label: 'Rp 650 Juta' }, { day: '25 Mei', val: 90, label: 'Rp 900 Juta' }, { day: '26 Mei', val: 100, label: 'Rp 1.45 Miliar' }
];

// --- PURE MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar-light">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function AdminDashboard() {
  
  // 1. Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 2. Navigation & UI States
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', data: null });

  // 3. Core App States
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [finance, setFinance] = useState(INITIAL_FINANCE);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [farm, setFarm] = useState(INITIAL_FARM);
  const [logistics, setLogistics] = useState(INITIAL_LOGISTICS);
  const [viewingOrder, setViewingOrder] = useState(null);

  // 4. Pricing States
  const [pricingTab, setPricingTab] = useState('matrix'); 
  const [pricing, setPricing] = useState(INITIAL_PRICING);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [addons, setAddons] = useState(INITIAL_ADDONS);

  // 5. Master Data States
  const [masterTab, setMasterTab] = useState('branches');
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [sales, setSales] = useState(INITIAL_SALES);
  const [users, setUsers] = useState(INITIAL_USERS);

  // 6. POS Interactive States
  const [posCustomer, setPosCustomer] = useState({ name: '', company: '', phone: '', address: '', type: 'B2C', lat: '', lng: '' });
  const [posItems, setPosItems] = useState([]); 
  const [posDiscount, setPosDiscount] = useState(0);
  const [posDP, setPosDp] = useState(0);
  const [posCurrentAnimal, setPosCurrentAnimal] = useState({
    branch: 'Bandung Raya', type: 'Domba Tipe B', price: 2100000, participants: [{ name: '', fatherName: '' }],
    hasShipping: false, shippingPrice: 50000, hasSlaughter: false, slaughterPrice: 100000
  });

  // 7. Bulk Assign States (Farm)
  const [assignData, setAssignData] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [farmSearch, setFarmSearch] = useState('');
  const [farmMinWeight, setFarmMinWeight] = useState('');

  // 8. Logs State
  const [logTab, setLogTab] = useState('notif'); 

  // --- USE EFFECTS ---
  useEffect(() => { 
    setViewingOrder(null); 
  }, [activeMenu]);

  // --- HELPERS ---
  const formatIDR = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  const closeModal = () => setModal({ isOpen: false, type: '', title: '', data: null });

  // --- LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center font-[Source_Sans_Pro] relative overflow-hidden">
        <div className="absolute inset-0 z-0">
           <img src="https://images.pexels.com/photos/840111/pexels-photo-840111.jpeg?auto=compress&cs=tinysrgb&w=1200" className="w-full h-full object-cover opacity-20" alt="Background"/>
           <div className="absolute inset-0 bg-gradient-to-b from-[#1e3a5f]/90 to-slate-900/90 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center border-b border-slate-100 bg-slate-50 flex flex-col items-center">
            <Heart className="text-red-600 fill-red-600 mb-2" size={40} />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">rumah<span className="text-red-600">qurban</span></h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Admin Portal</p>
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Selamat Datang Kembali</h2>
            <p className="text-sm text-slate-500 text-center mb-8">Masuk menggunakan akun Google korporat Anda untuk mengakses dashboard.</p>
            <button onClick={() => setIsAuthenticated(true)} className="w-full bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-lg shadow-sm hover:bg-slate-50 hover:shadow transition-all flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SUB VIEW RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div><h2 className="text-2xl font-bold text-slate-800">Dashboard Analytics</h2><p className="text-slate-500 text-sm">Ringkasan performa penjualan Qurban 2026</p></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { title: 'Total Omset', value: 'Rp 12.487.695.000', color: 'text-green-600' }, { title: 'Total Ekor Terjual', value: '1.286 Ekor', color: 'text-blue-600' },
          { title: 'Pesanan Menunggu Bayar', value: `${orders.filter(o => o.status === 'PENDING').length} Pesanan`, color: 'text-orange-600' }, { title: 'Transaksi B2B (Kolektif)', value: '60% Proporsi', color: 'text-purple-600' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"><p className="text-xs font-semibold text-slate-500 mb-1">{stat.title}</p><p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
          <h3 className="font-bold text-slate-800 border-b pb-3 mb-4">Tren Penjualan (Harian)</h3>
          <div className="flex-1 flex items-end gap-4 justify-around px-2 pb-2">
            {CHART_DATA.map((data, i) => (
              <div key={i} className="flex flex-col items-center gap-2 group relative">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap absolute -top-8 pointer-events-none z-10">{data.label}</div>
                <div className="w-12 h-40 flex items-end justify-center"><div className="w-full bg-[#1e3a5f] rounded-t-md transition-all hover:bg-blue-600" style={{ height: `${data.val}%` }}></div></div>
                <span className="text-[10px] font-semibold text-slate-500">{data.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-80">
          <h3 className="font-bold text-slate-800 border-b pb-3 mb-4">Penjualan per Kategori</h3>
          <div className="space-y-5 mt-4">
            <div><div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-700">Qurban Antar (QA)</span><span className="text-slate-500">916 Ekor</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-[#1e3a5f] h-2 rounded-full w-[70%]"></div></div></div>
            <div><div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-700">Qurban Berbagi (QB)</span><span className="text-slate-500">310 Ekor</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-red-700 h-2 rounded-full w-[25%]"></div></div></div>
            <div><div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-700">Qurban Kaleng (QK)</span><span className="text-slate-500">60 Ekor</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-amber-500 h-2 rounded-full w-[5%]"></div></div></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTargets = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div><h2 className="text-2xl font-bold text-slate-800">Target & Performa Penjualan</h2><p className="text-slate-500 text-sm">Dashboard integrasi target berdasarkan spreadsheet operasional.</p></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1e3a5f] p-5 rounded-xl shadow-sm text-white relative overflow-hidden">
          <div className="relative z-10"><p className="text-xs font-semibold text-blue-200 mb-1 uppercase tracking-wider">Target Sales (Global)</p><p className="text-3xl font-bold">1.286 Ekor</p></div><TrendingUp className="absolute -right-4 -bottom-4 text-white/10" size={100} />
        </div>
        <div className="bg-green-700 p-5 rounded-xl shadow-sm text-white relative overflow-hidden">
          <div className="relative z-10"><p className="text-xs font-semibold text-green-200 mb-1 uppercase tracking-wider">Target Omset (Global)</p><p className="text-3xl font-bold">Rp 12,48 M</p></div><Wallet className="absolute -right-4 -bottom-4 text-white/10" size={100} />
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Estimasi HPP Global</p><p className="text-3xl font-bold text-slate-800">Rp 9,47 M</p>
        </div>
      </div>
    </div>
  );

  const renderPOS = () => {
    const handleAddItem = (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.itemName.value;
      const qty = Number(form.qty.value);
      const unitPrice = Number(form.unitPrice.value);

      if(!name || qty <= 0 || unitPrice < 0) return alert("Mohon isi form item dengan valid!");
      const newItem = { id: Date.now(), type: form.itemType.value, name, category: form.itemCategory.value, qty, unit_price: unitPrice, price: qty * unitPrice, participants: [] };
      setPosItems([...posItems, newItem]);
      form.reset(); form.itemType.value = 'HEWAN'; form.itemCategory.value = 'ANIMAL_PRODUCT';
    };

    const subtotal = posItems.reduce((sum, item) => sum + item.price, 0);
    const grandTotal = subtotal - posDiscount;
    const remaining = grandTotal - posDP;

    const handleSubmitOrder = () => {
      if(posItems.length === 0) return alert('Keranjang kosong! Tambahkan minimal 1 item.');
      let calculatedStatus = 'PENDING';
      if(posDP > 0 && posDP < grandTotal) calculatedStatus = 'DP_PAID';
      if(posDP >= grandTotal && grandTotal > 0) calculatedStatus = 'FULL_PAID';

      const newOrder = {
        id: `INV-260500${orders.length + 1}`, date: 'Hari ini', customer: posCustomer.name || 'Pelanggan Corporate/POS',
        type_customer: posCustomer.type, phone: posCustomer.phone || '-', address: posCustomer.address || '-',
        type: posCustomer.type === 'B2B' ? 'Pesanan B2B/Bulk' : 'Qurban Antar', branch: 'Berdasarkan Input',
        subtotal, discount: posDiscount, total: grandTotal, dp: posDP, remaining: remaining < 0 ? 0 : remaining, status: calculatedStatus,
        lat: posCustomer.lat || '-', lng: posCustomer.lng || '-', items: [...posItems],
        payments: posDP > 0 ? [{ id: `TRX-${Date.now()}`, type: 'Uang Muka (DP)', date: 'Hari Ini', method: 'POS Payment', amount: posDP, status: 'VERIFIED' }] : [],
        tracking: null, docs: { tag: '', images: [], videos: [] }
      };

      setOrders([newOrder, ...orders]);
      alert(`Pesanan ${posCustomer.type} berhasil di-generate menjadi Invoice!`);
      setPosCustomer({ name: '', company: '', phone: '', address: '', type: 'B2C', lat: '', lng: '' });
      setPosItems([]); setPosDiscount(0); setPosDp(0); setActiveMenu('orders');
    };

    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold text-slate-800">POS / Invoicing B2B & B2C</h2><p className="text-slate-500 text-sm">Pembuatan Invoice fleksibel (multi-item, custom quantity, diskon, dan uang muka).</p></div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={18} className="text-[#1e3a5f]"/> Info Pelanggan / Institusi</h3>
                 <div className="flex gap-2 bg-slate-100 p-1 rounded-md">
                   <button onClick={() => setPosCustomer({...posCustomer, type: 'B2C'})} className={`px-3 py-1 text-xs font-bold rounded ${posCustomer.type === 'B2C' ? 'bg-white shadow text-[#1e3a5f]' : 'text-slate-500'}`}>B2C (Individu)</button>
                   <button onClick={() => setPosCustomer({...posCustomer, type: 'B2B'})} className={`px-3 py-1 text-xs font-bold rounded ${posCustomer.type === 'B2B' ? 'bg-white shadow text-[#1e3a5f]' : 'text-slate-500'}`}>B2B (Instansi)</button>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {posCustomer.type === 'B2B' && (
                  <div className="col-span-2"><label className="text-xs font-semibold text-slate-500 mb-1 block">Nama Instansi / Perusahaan</label><input type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-[#1e3a5f] bg-blue-50" value={posCustomer.company} onChange={e => setPosCustomer({...posCustomer, company: e.target.value})} /></div>
                )}
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Nama PIC / Pelanggan</label><input type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-[#1e3a5f]" value={posCustomer.name} onChange={e => setPosCustomer({...posCustomer, name: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">No WhatsApp</label><input type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-[#1e3a5f]" value={posCustomer.phone} onChange={e => setPosCustomer({...posCustomer, phone: e.target.value})} /></div>
                <div className="col-span-2"><label className="text-xs font-semibold text-slate-500 mb-1 block">Alamat Pengiriman</label><textarea className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-[#1e3a5f] h-12" value={posCustomer.address} onChange={e => setPosCustomer({...posCustomer, address: e.target.value})} /></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
              <h3 className="font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-500"/> Tambah Item (Custom)</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tipe</label><select name="itemType" className="w-full border border-slate-300 rounded-md p-2 text-xs outline-none bg-slate-50"><option value="HEWAN">Hewan Qurban</option><option value="SHIPPING">Biaya Logistik</option><option value="SLAUGHTER">Jasa Sembelih</option><option value="CUSTOM">Lainnya</option></select></div>
                  <div className="col-span-5"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nama Item / Deskripsi</label><input name="itemName" type="text" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none" required /></div>
                  <div className="col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kategori (COA)</label><select name="itemCategory" className="w-full border border-slate-300 rounded-md p-2 text-xs outline-none bg-slate-50"><option value="ANIMAL_PRODUCT">Penjualan Hewan</option><option value="SHIPPING_FEE">Pendapatan Logistik</option><option value="SLAUGHTER_FEE">Pendapatan Jasa</option></select></div>
                </div>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Quantity</label><input name="qty" type="number" defaultValue="1" min="1" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none" required /></div>
                  <div className="col-span-6"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Harga Satuan (Rp)</label><input name="unitPrice" type="number" className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none" required /></div>
                  <div className="col-span-3"><button type="submit" className="w-full bg-[#1e3a5f] text-white py-2 rounded-md font-bold hover:bg-blue-900 text-sm">+ Add</button></div>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 font-bold text-sm text-slate-800 flex justify-between"><div className="flex items-center gap-2"><ClipboardList size={16}/> Draft Baris Tagihan</div><span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">{posItems.length} Item</span></div>
               <table className="w-full text-left border-collapse">
                 <thead><tr className="bg-white text-[10px] uppercase text-slate-500 border-b border-slate-100"><th className="px-4 py-2">Nama Item</th><th className="px-4 py-2 text-center">Qty</th><th className="px-4 py-2 text-right">Harga</th><th className="px-4 py-2 text-right">Subtotal</th><th className="px-4 py-2 text-center">Aksi</th></tr></thead>
                 <tbody className="text-sm">
                   {posItems.map((item) => (
                     <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                       <td className="px-4 py-3"><p className="font-bold text-slate-800">{item.name}</p><p className="text-[10px] text-slate-400 font-mono mt-0.5">COA: {item.category}</p></td>
                       <td className="px-4 py-3 text-center font-semibold">{item.qty}</td>
                       <td className="px-4 py-3 text-right">{formatIDR(item.unit_price)}</td>
                       <td className="px-4 py-3 text-right font-bold text-[#1e3a5f]">{formatIDR(item.price)}</td>
                       <td className="px-4 py-3 text-center"><button onClick={() => setPosItems(posItems.filter(i => i.id !== item.id))} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-green-600">
              <h3 className="font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2"><Wallet size={18} className="text-green-600"/> Kalkulasi Finansial</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center text-sm"><span className="text-slate-600 font-semibold">Subtotal Item</span><span className="font-bold">{formatIDR(subtotal)}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-slate-600 font-semibold">Diskon Global (Rp)</span><input type="number" className="w-32 border border-slate-300 rounded p-1 text-right outline-none font-bold text-red-600" value={posDiscount} onChange={(e) => setPosDiscount(Number(e.target.value))}/></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 mt-2 items-center"><span className="font-bold text-slate-800">Grand Total</span><span className="font-bold text-green-700 text-xl">{formatIDR(grandTotal)}</span></div>
                <div className="flex justify-between items-center text-sm pt-4"><span className="text-slate-600 font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Uang Muka (DP)</span><input type="number" className="w-32 border border-yellow-300 bg-yellow-50 rounded p-1 text-right outline-none font-bold" value={posDP} onChange={(e) => setPosDp(Number(e.target.value))}/></div>
                <div className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded border border-slate-100"><span className="text-slate-500 font-semibold">Sisa Tagihan</span><span className="font-bold text-red-600">{formatIDR(remaining < 0 ? 0 : remaining)}</span></div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <button onClick={handleSubmitOrder} className="w-full bg-[#1e3a5f] text-white py-3.5 rounded-md font-bold hover:bg-blue-900 shadow-sm text-lg">Terbitkan Invoice</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    if (viewingOrder) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => setViewingOrder(null)} className="p-2 bg-slate-50 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"><ArrowLeft size={20}/></button>
            <div className="flex-1"><h2 className="text-xl font-bold text-slate-800">Detail Pesanan: {viewingOrder.id}</h2><p className="text-slate-500 text-sm">Informasi pelanggan, item tagihan (COA), riwayat bayar, dan logistik.</p></div>
            <div className="flex gap-2"><button className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-blue-900"><FileText size={16} /> Lihat Invoice PDF</button></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              {viewingOrder.type_customer === 'B2B' && <span className="absolute top-4 right-4 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Corporate / B2B</span>}
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><User size={16}/> Info Pelanggan</h4>
              <p className="font-bold text-slate-800 text-xl leading-tight mb-1">{viewingOrder.customer}</p>
              <p className="text-sm text-slate-600 mb-3">{viewingOrder.phone}</p>
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100"><p className="text-xs text-slate-500 flex items-start gap-1.5"><MapPin size={14} className="shrink-0 mt-0.5 text-blue-600"/> {viewingOrder.address}</p></div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Wallet size={16}/> Ringkasan Transaksi</h4>
              <p className="text-sm font-bold text-slate-800 mb-2">{viewingOrder.id} <span className="font-normal text-slate-500">| {viewingOrder.date}</span></p>
              <p className="text-3xl font-bold text-slate-800 mb-1">{formatIDR(viewingOrder.total)}</p>
              <div className="flex gap-4 text-xs mt-2 mb-3">
                <div className="bg-slate-50 border border-slate-100 p-2 rounded w-full"><p className="text-slate-500 font-semibold mb-0.5">Uang Muka (DP)</p><p className="font-bold text-green-700">{formatIDR(viewingOrder.dp || 0)}</p></div>
                <div className="bg-slate-50 border border-slate-100 p-2 rounded w-full"><p className="text-slate-500 font-semibold mb-0.5">Sisa Tagihan</p><p className="font-bold text-red-600">{formatIDR(viewingOrder.remaining || 0)}</p></div>
              </div>
              <span className={`absolute top-5 right-5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${viewingOrder.status === 'FULL_PAID' ? 'bg-green-50 border-green-200 text-green-700' : viewingOrder.status === 'DP_PAID' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>{viewingOrder.status.replace('_', ' ')}</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Receipt size={16}/> Riwayat Pembayaran</h4>
               <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar-light">
                 {viewingOrder.payments && viewingOrder.payments.length > 0 ? (
                   viewingOrder.payments.map((pay, i) => (
                     <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                        <p className="text-xs font-bold text-slate-800">{pay.type}</p>
                        <p className="text-[10px] text-slate-500 mb-1">{pay.date} • {pay.method}</p>
                        <p className="text-sm font-bold text-green-700 mb-2">{formatIDR(pay.amount)}</p>
                        <div className="flex gap-2">
                           <span className="text-[9px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded">{pay.status}</span>
                           {pay.proof_url && <button className="text-[9px] bg-white border border-slate-300 text-slate-600 font-bold px-2 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1"><Eye size={10}/> Bukti</button>}
                        </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-xs text-slate-400 italic mt-4 text-center">Belum ada riwayat pembayaran tercatat.</p>
                 )}
               </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center gap-2"><ShoppingCart size={18} className="text-[#1e3a5f]"/> Rincian Order Items (COA)</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[10px] uppercase text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 font-semibold">Kategori Item</th><th className="px-5 py-3 font-semibold">Nama Item</th><th className="px-5 py-3 font-semibold text-center">Qty</th><th className="px-5 py-3 font-semibold text-right">Harga Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {viewingOrder.items?.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4"><span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1.5 rounded text-[10px] font-bold">{item.category}</span></td>
                    <td className="px-5 py-4"><p className="font-bold text-[#1e3a5f]">{item.name}</p></td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700">{item.qty || 1}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800 text-lg">{formatIDR(item.price || item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {viewingOrder.docs && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center gap-2"><Camera size={18} className="text-[#1e3a5f]"/> Dokumentasi Kandang & Penyembelihan</div>
              <div className="p-5">
                <p className="text-sm text-slate-500 mb-4">Eartag Tersambung: <span className="font-bold text-[#1e3a5f] bg-blue-50 px-3 py-1 rounded-md border border-blue-200">{viewingOrder.docs.tag || 'Belum Di-assign'}</span></p>
                {viewingOrder.docs.images?.length > 0 ? (
                  <div className="space-y-6">
                    <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Galeri Foto</p><div className="flex gap-3 overflow-x-auto pb-2">{viewingOrder.docs.images.map((img, i) => (<img key={i} src={img} alt="doc" className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200 shadow-sm hover:border-blue-400 transition-colors cursor-pointer" />))}</div></div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-center"><p className="text-sm text-slate-400 italic">Belum ada dokumentasi diunggah oleh tim kandang.</p></div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div><h2 className="text-2xl font-bold text-slate-800">Manajemen Pesanan</h2><p className="text-slate-500 text-sm">Daftar transaksi masuk dan rincian COA</p></div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-slate-50"><Filter size={16} /> Filter</button>
            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-green-700"><Download size={16} /> Export Excel (COA)</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="p-4 font-semibold">No. Invoice</th><th className="p-4 font-semibold">Pelanggan</th><th className="p-4 font-semibold">Tipe Order</th>
                <th className="p-4 font-semibold">Total Transaksi</th><th className="p-4 font-semibold">DP & Sisa</th><th className="p-4 font-semibold">Status Bayar</th><th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold text-[#1e3a5f] whitespace-nowrap">{order.id}</td>
                  <td className="p-4"><p className="font-semibold text-slate-800">{order.customer}</p>{order.type_customer === 'B2B' && <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mt-0.5 inline-block">B2B</span>}</td>
                  <td className="p-4"><p className="text-slate-800 font-semibold">{order.type}</p></td>
                  <td className="p-4 font-bold text-slate-800">{formatIDR(order.total)}</td>
                  <td className="p-4"><p className="text-xs text-green-700 font-semibold">DP: {formatIDR(order.dp || 0)}</p><p className="text-[10px] text-red-500">Sisa: {formatIDR(order.remaining || 0)}</p></td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${order.status === 'FULL_PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.status.replace('_', ' ')}</span></td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => setViewingOrder(order)} className="text-slate-500 hover:text-white hover:bg-[#1e3a5f] transition-colors bg-white border border-slate-200 rounded flex items-center gap-1 text-xs font-bold px-3 py-1.5"><Eye size={14} /> Detail</button>
                    <button onClick={() => setModal({ isOpen: true, type: 'EDIT_ORDER', title: `Edit Pesanan: ${order.id}`, data: order })} className="text-slate-400 hover:text-blue-600 bg-white border border-slate-200 p-1.5 rounded"><Edit size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFinance = () => {
    const handleApprove = (id, invoiceId) => {
      setFinance(finance.filter(f => f.id !== id));
      setOrders(orders.map(o => o.id === invoiceId ? { ...o, status: 'FULL_PAID', remaining: 0, dp: o.total } : o));
      alert(`Pembayaran untuk ${invoiceId} berhasil di Approve!`);
    };

    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold text-slate-800">Verifikasi Pembayaran</h2><p className="text-slate-500 text-sm">Validasi bukti transfer manual yang diupload pelanggan</p></div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="p-4 font-semibold">Waktu Upload</th><th className="p-4 font-semibold">Pesanan</th><th className="p-4 font-semibold">Metode / Nominal</th><th className="p-4 font-semibold text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {finance.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Tidak ada verifikasi tertunda.</td></tr>
              ) : (
                finance.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4"><p className="font-semibold text-slate-800">{item.time}</p></td>
                    <td className="p-4"><p className="font-bold text-[#1e3a5f]">{item.invoice}</p><p className="text-xs text-slate-500">{item.customer}</p></td>
                    <td className="p-4"><p className="text-slate-800 font-semibold">{item.method}</p><p className="text-xs text-slate-500 font-bold text-green-700">{formatIDR(item.amount)}</p></td>
                    <td className="p-4 flex justify-center gap-2">
                      <button className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-200 border border-slate-300">Lihat Bukti</button>
                      <button onClick={() => handleApprove(item.id, item.invoice)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">Approve</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFarm = () => {
    const handleBulkAssignModal = () => {
      const tagString = selectedTags.length > 1 ? `Multiple (${selectedTags.length})` : selectedTags[0] || '';
      setFarm(farm.map(f => f.id === assignData?.id ? { ...f, tag: tagString, status: 'BOOKED', assigned_qty: selectedTags.length } : f));
      const updatedInv = inventory.map(inv => selectedTags.includes(inv.tag) ? { ...inv, status: 'BOOKED', order_id: assignData?.invoice } : inv);
      setInventory(updatedInv);
      alert(`Berhasil mengalokasikan ${selectedTags.length} ekor hewan untuk pesanan ${assignData?.invoice}!`);
      closeModal();
    };

    const availableInventory = inventory.filter(i => {
      if (i.status !== 'AVAILABLE') return false;
      if (farmSearch && !i.tag.toLowerCase().includes(farmSearch.toLowerCase())) return false;
      if (farmMinWeight && i.weight < Number(farmMinWeight)) return false;
      return true;
    });

    return (
      <div className="space-y-6">
        <div><h2 className="text-2xl font-bold text-slate-800">Manajemen Kandang & Alokasi Hewan</h2><p className="text-slate-500 text-sm">Alokasi Eartag fisik secara retail (satuan) maupun bulk (B2B) dari gudang inventory.</p></div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="p-4 font-semibold">Pesanan (Invoice)</th><th className="p-4 font-semibold text-center">Qty Dibutuhkan</th><th className="p-4 font-semibold">Alokasi (Eartag)</th><th className="p-4 font-semibold">Status Fisik</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {farm.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-bold text-[#1e3a5f]">{item.invoice}</p><p className="text-xs text-slate-500 mb-1">{item.customer}</p>
                    {item.is_bulk ? <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">B2B (Bulk)</span> : <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">B2C</span>}
                  </td>
                  <td className="p-4 text-center font-bold text-slate-800">{item.is_bulk ? '50 Ekor' : '1 Ekor'}</td>
                  <td className="p-4">
                     <button onClick={() => {
                         const reqQty = item.is_bulk ? 50 : 1;
                         setAssignData({ id: item.id, invoice: item.invoice, required_qty: reqQty, type: item.type });
                         setSelectedTags([]);
                         setModal({ isOpen: true, type: 'BULK_ASSIGN', title: `Alokasi Hewan - ${item.invoice}` });
                       }}
                       className="bg-white border border-[#1e3a5f] text-[#1e3a5f] px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-50 flex items-center gap-2"
                     >
                       <ListChecks size={14}/> Pilih Hewan
                     </button>
                     {item.tag && <p className="text-[10px] text-green-600 font-bold mt-2 border border-green-200 bg-green-50 px-2 py-1 rounded inline-block">✅ {item.tag}</p>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'BOOKED' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inline Modal logic specifically isolated for the Farm to avoid re-renders */}
        {modal.isOpen && modal.type === 'BULK_ASSIGN' && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">{modal.title}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar-light">
                <div className="mb-4">
                  <div className="flex items-center gap-4 mt-2">
                     <div className="bg-slate-100 px-3 py-2 rounded-md border border-slate-200 text-center"><span className="text-[10px] text-slate-500 font-bold uppercase">Dibutuhkan</span><span className="block font-bold text-slate-800 text-xl">{assignData?.required_qty}</span></div>
                     <div className="bg-slate-100 px-3 py-2 rounded-md border border-slate-200 text-center"><span className="text-[10px] text-slate-500 font-bold uppercase">Dipilih</span><span className={`block font-bold text-xl ${selectedTags.length === assignData?.required_qty ? 'text-green-600' : 'text-blue-600'}`}>{selectedTags.length}</span></div>
                     <div className="bg-slate-50 px-3 py-2 rounded-md border border-slate-200 flex-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Filter Pencarian Inventaris</span>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Cari Eartag..." className="border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-[#1e3a5f] w-full" value={farmSearch} onChange={(e)=>setFarmSearch(e.target.value)} />
                          <input type="number" placeholder="Min Berat (Kg)" className="border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-[#1e3a5f] w-32" value={farmMinWeight} onChange={(e)=>setFarmMinWeight(e.target.value)} />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 h-[350px]">
                  <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white shadow-sm">
                    <div className="bg-slate-100 p-3 border-b border-slate-300 font-bold text-sm text-slate-700 flex justify-between"><span>Tersedia di Kandang</span><span className="text-xs font-normal text-slate-500">{availableInventory.length} Item</span></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar-light">
                      {availableInventory.filter(inv => !selectedTags.includes(inv.tag)).map((inv) => (
                        <div key={inv.tag} className="flex items-center justify-between p-2 hover:bg-slate-50 border border-slate-100 rounded">
                          <div><p className="font-bold text-sm text-slate-800">{inv.tag}</p><p className="text-xs text-slate-500 font-mono">Berat: <b className="text-slate-700">{inv.weight} Kg</b></p></div>
                          <button onClick={() => setSelectedTags([...selectedTags, inv.tag])} disabled={selectedTags.length >= assignData?.required_qty} className={`p-1 rounded-md transition-colors ${selectedTags.length >= assignData?.required_qty ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}`}><ChevronRight size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-blue-300 rounded-lg overflow-hidden flex flex-col bg-blue-50/30 shadow-sm">
                    <div className="bg-blue-100 p-3 border-b border-blue-300 font-bold text-sm text-[#1e3a5f] flex justify-between"><span>Alokasi Terpilih</span><span className="text-xs font-normal text-slate-500">{selectedTags.length} Item</span></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar-light">
                      {selectedTags.map((tag) => {
                        const inv = inventory.find(i => i.tag === tag);
                        return (
                          <div key={tag} className="flex items-center justify-between p-2 bg-white border border-blue-100 rounded shadow-sm">
                            <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} className="p-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-md"><ChevronLeft size={16}/></button>
                            <div className="text-right"><p className="font-bold text-sm text-slate-800">{inv?.tag}</p><p className="text-xs text-slate-500 font-mono">Berat: {inv?.weight} Kg</p></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-3">
                   <button onClick={closeModal} className="px-6 py-2.5 rounded-md font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Batal</button>
                   <button onClick={handleBulkAssignModal} disabled={selectedTags.length === 0} className={`px-6 py-2.5 rounded-md font-bold transition-colors flex items-center gap-2 ${selectedTags.length > 0 ? 'bg-[#1e3a5f] text-white hover:bg-blue-900 shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Save size={18}/> Simpan Alokasi ({selectedTags.length})</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLogistics = () => (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">Logistik & Pengiriman</h2></div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200"><th className="p-4 font-semibold">Tujuan Pengiriman</th><th className="p-4 font-semibold">Hewan (Tag)</th><th className="p-4 font-semibold">Jadwal & Armada</th></tr></thead>
          <tbody className="text-sm">
            {logistics.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4"><p className="font-bold text-slate-800">{item.customer}</p><p className="text-xs text-slate-500 truncate w-48">{item.address}</p></td>
                <td className="p-4"><span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-700">{item.tag}</span></td>
                <td className="p-4"><p className="text-xs">{item.date}</p><p className="text-xs font-bold">{item.vehicle}</p></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">Harga, Produk & Kuota</h2></div>
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button onClick={() => setPricingTab('matrix')} className={`px-4 py-2 border-b-2 font-bold text-sm transition-colors ${pricingTab === 'matrix' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Matriks Harga (Per Kg)</button>
        <button onClick={() => setPricingTab('products')} className={`px-4 py-2 border-b-2 font-bold text-sm transition-colors ${pricingTab === 'products' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Produk Kuota</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {pricingTab === 'matrix' && (
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200"><th className="p-4 font-semibold">Cabang</th><th className="p-4 font-semibold">Vendor</th><th className="p-4 font-semibold">Harga Dasar</th><th className="p-4 font-semibold">Aksi</th></tr></thead>
            <tbody className="text-sm">
              {pricing.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-semibold text-slate-700">{p.branch}</td><td className="p-4 text-slate-600">{p.vendor}</td><td className="p-4 font-bold text-red-700">{formatIDR(p.price)}</td>
                <td className="p-4"><button onClick={() => setModal({ isOpen: true, type: 'EDIT_PRICING', title: 'Edit Matriks', data: p })} className="text-blue-500"><Edit size={16}/></button></td></tr>
              ))}
            </tbody>
          </table>
        )}
        {pricingTab === 'products' && (
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200"><th className="p-4 font-semibold">Nama Produk</th><th className="p-4 font-semibold">Kuota</th><th className="p-4 font-semibold">Harga Jual</th></tr></thead>
            <tbody className="text-sm">
              {products.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-semibold text-slate-700">{p.name}</td><td className="p-4 text-slate-600 font-bold">{p.current} / {p.target}</td><td className="p-4 font-bold text-red-700">{formatIDR(p.price)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderMaster = () => (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">Master Data & COA</h2></div>
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
           {['branches', 'vendors', 'payments', 'sales', 'users'].map(tab => (
             <button key={tab} onClick={() => setMasterTab(tab)} className={`w-full text-left p-4 font-semibold transition-colors border-l-4 ${masterTab === tab ? 'text-[#1e3a5f] bg-blue-50 border-[#1e3a5f] font-bold' : 'text-slate-600 border-transparent hover:bg-slate-50'}`}>{tab.toUpperCase()}</button>
           ))}
        </div>
        <div className="col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
           <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800 capitalize">Master: {masterTab}</h3></div>
           <div className="overflow-x-auto">
              {masterTab === 'branches' && (
                <table className="w-full text-left border-collapse">
                  <thead><tr className="text-xs uppercase text-slate-500 border-b border-slate-200"><th className="p-4">Nama Cabang</th><th className="p-4">Alamat</th><th className="p-4">Kode COA</th><th className="p-4">Status</th></tr></thead>
                  <tbody className="text-sm">{branches.map(b => <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-semibold">{b.name}</td><td className="p-4 text-slate-600 truncate max-w-[150px]">{b.address}</td><td className="p-4 font-mono text-xs text-blue-600">{b.coa}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700`}>{b.status}</span></td></tr>)}</tbody>
                </table>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-800">System Logs & Integrasi</h2></div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex gap-4 p-4 border-b border-slate-200 bg-slate-50">
          {['notif', 'payment', 'zains'].map(t => <button key={t} onClick={() => setLogTab(t)} className={`font-bold text-sm px-4 py-2 rounded-md ${logTab === t ? 'bg-[#1e3a5f] text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}>{t.toUpperCase()} LOGS</button>)}
        </div>
        <table className="w-full text-left border-collapse">
          <thead><tr className="text-xs uppercase text-slate-500 border-b border-slate-200 bg-white"><th className="p-4">Timestamp</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
          <tbody className="text-sm font-mono">
            {INITIAL_LOGS[logTab]?.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-xs text-slate-600">{log.time}</td>
                <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">{log.status}</span></td>
                <td className="p-4"><button onClick={() => setModal({ isOpen: true, type: 'VIEW_JSON', title: 'Detail JSON', data: log })} className="flex items-center gap-1 text-[10px] font-bold bg-[#1e3a5f] text-white px-3 py-1.5 rounded hover:bg-blue-900"><FileJson size={14}/> Lihat JSON</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeMenu) {
      case 'dashboard': return renderDashboard();
      case 'targets': return renderTargets();
      case 'pos': return renderPOS();
      case 'orders': return renderOrders();
      case 'finance': return renderFinance();
      case 'farm': return renderFarm();
      case 'logistics': return renderLogistics();
      case 'pricing': return renderPricing();
      case 'master': return renderMaster();
      case 'logs': return renderLogs();
      default: return <div className="p-8 text-center text-slate-500">Modul sedang dikembangkan.</div>;
    }
  };

  const handleEditStatus = (e) => {
    e.preventDefault();
    const newStatus = e.target.status.value;
    setOrders(orders.map(o => o.id === modal.data.id ? { ...o, status: newStatus } : o));
    closeModal();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap');
        body { font-family: 'Source Sans Pro', sans-serif; background-color: #f8fafc; margin: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar-light::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />
      
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-[Source_Sans_Pro]">
        <aside className="w-64 bg-[#1e3a5f] text-white flex flex-col shadow-xl z-20 shrink-0">
          <div className="p-6 pb-8">
             <div className="flex items-center gap-2 mb-1">
               <Heart className="text-red-500 fill-red-500" size={28} />
               <span className="font-bold text-2xl tracking-tight">rumah<span className="text-red-500">qurban</span></span>
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-9">Admin Panel</p>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-2 space-y-1 px-3 custom-scrollbar">
             {MENU_ITEMS.map((item) => (
               <button key={item.id} onClick={() => setActiveMenu(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${activeMenu === item.id ? 'bg-blue-800 text-white shadow-inner font-medium' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white font-normal'}`}>
                 {item.icon} {item.label}
               </button>
             ))}
          </nav>

          <div className="p-4 border-t border-slate-700 mt-auto">
             <div className="flex items-center gap-3 mb-4 px-2">
               <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold">SA</div>
               <div><p className="text-sm font-bold leading-tight">Super Admin</p><p className="text-[10px] text-slate-400">Management</p></div>
             </div>
             <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
               <LogOut size={16} /> Logout
             </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
             <div className="flex items-center gap-2 text-slate-500">
               {MENU_ITEMS.find(m => m.id === activeMenu)?.icon}
               <span className="font-semibold text-sm">{MENU_ITEMS.find(m => m.id === activeMenu)?.label}</span>
             </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-light">
            <div className="max-w-6xl mx-auto">
               {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {modal.isOpen && modal.type === 'VIEW_JSON' && (
        <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} maxWidth="max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 rounded-lg p-4 shadow-inner overflow-hidden h-[500px] flex flex-col"><h4 className="text-xs font-bold text-slate-400 mb-2 border-b border-slate-700 pb-2">Payload</h4><pre className="text-green-400 text-[11px] font-mono overflow-auto flex-1">{JSON.stringify(modal.data?.payload, null, 2)}</pre></div>
            <div className="bg-slate-900 rounded-lg p-4 shadow-inner overflow-hidden h-[500px] flex flex-col"><h4 className="text-xs font-bold text-slate-400 mb-2 border-b border-slate-700 pb-2">Response</h4><pre className="text-blue-400 text-[11px] font-mono overflow-auto flex-1">{JSON.stringify(modal.data?.response, null, 2)}</pre></div>
          </div>
        </Modal>
      )}

      {modal.isOpen && modal.type === 'EDIT_ORDER' && (
        <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title}>
          <form onSubmit={handleEditStatus} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Status Pesanan</label>
              <select name="status" defaultValue={modal.data?.status} className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-[#1e3a5f]">
                <option value="PENDING">PENDING</option><option value="DP_PAID">DP PAID</option><option value="FULL_PAID">FULL PAID</option><option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-md font-semibold hover:bg-slate-200">Batal</button>
              <button type="submit" className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-md font-semibold flex justify-center items-center gap-2"><Save size={16}/> Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}