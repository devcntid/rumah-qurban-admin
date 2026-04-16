export type NotifTemplate = {
  id: number;
  name: string;
  templateText: string;
  createdAt: string;
};

export type NotifTemplateInput = {
  id?: number;
  name: string;
  templateText: string;
};

export type NotifLog = {
  id: number;
  orderId: number | null;
  templateId: number | null;
  templateName?: string;
  targetNumber: string;
  status: string;
  payload: Record<string, unknown> | null;
  providerResponse: Record<string, unknown> | null;
  createdAt: string;
};

export type NotifLogInput = {
  orderId: number | null;
  templateId: number;
  targetNumber: string;
  status: string;
  payload: Record<string, unknown>;
  providerResponse: Record<string, unknown> | null;
};

export type DocumentationPhoto = {
  url: string;
  uploadedAt: string;
};

export type SlaughterRecord = {
  id: number;
  farmInventoryId: number;
  orderItemId: number;
  slaughteredAt: string;
  slaughterLocation: string | null;
  slaughterLatitude: string | null;
  slaughterLongitude: string | null;
  documentationPhotos: DocumentationPhoto[];
  certificateUrl: string | null;
  notes: string | null;
  performedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SlaughterRecordInput = {
  farmInventoryId: number;
  orderItemId: number;
  slaughteredAt: string;
  slaughterLocation?: string;
  slaughterLatitude?: number;
  slaughterLongitude?: number;
  documentationPhotos?: DocumentationPhoto[];
  notes?: string;
  performedBy?: string;
};

export type SlaughterRecordWithDetails = SlaughterRecord & {
  eartagId: string;
  itemName: string;
  customerName: string;
  customerPhone: string | null;
  invoiceNumber: string;
  orderId: number;
  participantNames: string[];
};

export type CertificateData = {
  slaughterRecord: SlaughterRecord;
  customerName: string;
  participantNames: string[];
  itemName: string;
  invoiceNumber: string;
  slaughterDate: string;
  slaughterLocation: string;
  documentationPhotos: DocumentationPhoto[];
  branchName: string;
};

export type SendNotificationPayload = {
  orderId: number;
  templateId: number;
  customVariables?: Record<string, string>;
};

export type BulkNotificationPayload = {
  orderIds: number[];
  templateId: number;
  customVariables?: Record<string, string>;
};

export type NotificationResult = {
  success: boolean;
  error?: string;
  logId?: number;
};

export type BulkNotificationResult = {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
};

export type TemplateVariable = {
  name: string;
  description: string;
  example: string;
};

export const AVAILABLE_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: "customer_name", description: "Nama pelanggan/pequrban", example: "Muhammad Fatih" },
  { name: "customer_phone", description: "Nomor telepon pelanggan", example: "+6281462206437" },
  { name: "invoice_number", description: "Nomor invoice order", example: "INV-QB-2026-01" },
  { name: "item_name", description: "Nama produk qurban", example: "QURBAN BERBAGI KADO" },
  { name: "participant_names", description: "Nama-nama peserta qurban", example: "Ahmad bin Fulan" },
  { name: "slaughter_date", description: "Tanggal penyembelihan", example: "17/06/2024" },
  { name: "slaughter_location", description: "Lokasi penyembelihan", example: "Desa Dukuhturi - Kabupaten Brebes" },
  { name: "tracking_url", description: "URL tracking pesanan", example: "https://tracking.rumahqurban.id/lacak/6281462206437" },
  { name: "year", description: "Tahun Hijriah", example: "1445" },
  { name: "delivery_date", description: "Tanggal pengiriman hewan", example: "19/06/2026" },
  { name: "vehicle_plate", description: "Plat nomor kendaraan pengiriman", example: "D 1234 AB" },
  { name: "driver_name", description: "Nama driver pengiriman", example: "Budi Santoso" },
  { name: "driver_phone", description: "Nomor telepon driver pengiriman", example: "081234567890" },
  { name: "order_date", description: "Tanggal pemesanan", example: "04 Apr 2026, 16:56" },
  { name: "grand_total", description: "Total tagihan order", example: "IDR 1,699,000" },
  { name: "payment_method", description: "Nama metode pembayaran", example: "Virtual Account Mandiri" },
  { name: "va_number", description: "Nomor Virtual Account", example: "5919000009714648" },
  { name: "payment_info", description: "Info lengkap metode pembayaran (otomatis dari data transaksi)", example: "- Virtual Account Mandiri\n- Kode pembayaran : 591900009714648" },
  { name: "destination_address", description: "Alamat tujuan pengiriman", example: "Jl. Dipatiukur No. 1, Bandung" },
];
