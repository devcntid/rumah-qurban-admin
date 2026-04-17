import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  CalendarClock,
  ClipboardList,
  Database,
  HelpCircle,
  LayoutDashboard,
  Map as MapIcon,
  MessageSquare,
  Scissors,
  Send,
  ShoppingCart,
  Tags,
  TrendingUp,
  Truck,
  Users,
  UserCog,
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
    | "slaughter"
    | "slaughter-schedules"
    | "logistics"
    | "pricing"
    | "master"
    | "faqs"
    | "users"
    | "logs"
    | "notif-templates"
    | "broadcast";
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
    id: "slaughter",
    label: "Data Penyembelihan",
    href: "/slaughter",
    icon: <Scissors size={20} />,
  },
  {
    id: "slaughter-schedules",
    label: "Jadwal Penyembelihan",
    href: "/slaughter-schedules",
    icon: <CalendarClock size={20} />,
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
    id: "faqs",
    label: "FAQ Management",
    href: "/faqs",
    icon: <HelpCircle size={20} />,
  },
  {
    id: "notif-templates",
    label: "Template Notifikasi",
    href: "/notif-templates",
    icon: <MessageSquare size={20} />,
  },
  {
    id: "broadcast",
    label: "Broadcast WhatsApp",
    href: "/broadcast",
    icon: <Send size={20} />,
  },
  {
    id: "users",
    label: "User Management",
    href: "/users",
    icon: <UserCog size={20} />,
  },
  {
    id: "logs",
    label: "System Logs",
    href: "/logs",
    icon: <Activity size={20} />,
  },
];

