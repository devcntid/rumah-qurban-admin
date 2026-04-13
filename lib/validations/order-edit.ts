import { z } from "zod";

function emptyToCoord(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function branchFromForm(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Header-only update: grand total & sisa dihitung di server dari subtotal, diskon, DP. */
export const updateOrderFormSchema = z.object({
  orderId: z.number().int().positive(),
  branchId: z.preprocess(
    branchFromForm,
    z.union([z.number().int().positive(), z.null()])
  ),
  customerType: z.enum(["B2B", "B2C"]),
  customerName: z.string().min(1, "Nama pelanggan wajib diisi"),
  companyName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerEmail: z.preprocess(
    (v) => (v == null || String(v).trim() === "" ? null : String(v).trim()),
    z.union([z.string().email(), z.null()])
  ),
  deliveryAddress: z.string().optional().nullable(),
  latitude: z.preprocess(emptyToCoord, z.union([z.number().finite(), z.null()])),
  longitude: z.preprocess(emptyToCoord, z.union([z.number().finite(), z.null()])),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  dpPaid: z.number().nonnegative(),
  status: z.enum(["PENDING", "DP_PAID", "FULL_PAID", "CANCELLED"]),
});

export type UpdateOrderFormValues = z.infer<typeof updateOrderFormSchema>;
export type UpdateOrderFormDraft = z.input<typeof updateOrderFormSchema>;
