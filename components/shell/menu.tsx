import type { ReactNode } from "react";
import {
  Activity,
  ClipboardList,
  Database,
  LayoutDashboard,
  Map as MapIcon,
  ShoppingCart,
  Tags,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export type MenuItem = {
  id:
    | "dashboard"
    | "targets"
    | "pos"
    | "orders"
    | "customers"
    | "finance"
    | "farm"
    | "logistics"
    | "pricing"
    | "master"
    | "logs";
  label: string;
  href: string;
  icon: ReactNode;
};

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard Analytics",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    id: "targets",
    label: "Target & Performa",
    href: "/targets",
    icon: <TrendingUp size={20} />,
  },
  {
    id: "pos",
    label: "POS / Invoicing",
    href: "/pos",
    icon: <ShoppingCart size={20} />,
  },
  {
    id: "orders",
    label: "Manajemen Pesanan",
    href: "/orders",
    icon: <ClipboardList size={20} />,
  },
  {
    id: "customers",
    label: "Database Customers",
    href: "/customers",
    icon: <Users size={20} />,
  },
  {
    id: "finance",
    label: "Transaksi",
    href: "/transactions",
    icon: <Wallet size={20} />,
  },
  {
    id: "farm",
    label: "Kandang & Inventaris",
    href: "/farm",
    icon: <MapIcon size={20} />,
  },
  {
    id: "logistics",
    label: "Logistik & Pengiriman",
    href: "/logistics",
    icon: <Truck size={20} />,
  },
  {
    id: "pricing",
    label: "Harga, Produk & Kuota",
    href: "/pricing",
    icon: <Tags size={20} />,
  },
  {
    id: "master",
    label: "Master Data",
    href: "/master",
    icon: <Database size={20} />,
  },
  {
    id: "logs",
    label: "System Logs",
    href: "/logs",
    icon: <Activity size={20} />,
  },
];

