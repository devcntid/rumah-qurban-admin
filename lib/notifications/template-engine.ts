import { getDb } from "@/lib/db/client";
import { getNotifTemplateById } from "@/lib/db/queries/notif-templates";
import { getSlaughterRecordByFarmInventoryId } from "@/lib/db/queries/slaughter-records";

export type OrderData = {
  orderId: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  itemName: string;
  participantNames: string[];
  slaughterDate?: string;
  slaughterLocation?: string;
};

export async function getOrderDataForNotification(orderId: number): Promise<OrderData | null> {
  const sql = getDb();

  type OrderRow = {
    orderId: number;
    invoiceNumber: string;
    customerName: string;
    customerPhone: string | null;
  };

  type ItemRow = {
    orderItemId: number;
    itemName: string;
    farmInventoryId: number | null;
  };

  type ParticipantRow = { participantName: string };

  const orderRows = await sql`
    SELECT 
      o.id as "orderId",
      o.invoice_number as "invoiceNumber",
      o.customer_name as "customerName",
      o.customer_phone as "customerPhone"
    FROM orders o
    WHERE o.id = ${orderId}
  ` as unknown as OrderRow[];

  if (!orderRows[0]) return null;

  const itemRows = await sql`
    SELECT 
      oi.id as "orderItemId",
      oi.item_name as "itemName",
      fi.id as "farmInventoryId"
    FROM order_items oi
    LEFT JOIN farm_inventories fi ON fi.order_item_id = oi.id
    WHERE oi.order_id = ${orderId}
    AND oi.item_type = 'ANIMAL'
    LIMIT 1
  ` as unknown as ItemRow[];

  const participantRows = await sql`
    SELECT op.participant_name as "participantName"
    FROM order_participants op
    JOIN order_items oi ON oi.id = op.order_item_id
    WHERE oi.order_id = ${orderId}
  ` as unknown as ParticipantRow[];

  const order = orderRows[0];
  const item = itemRows[0];
  const participantNames = participantRows.map((p) => p.participantName);

  let slaughterDate: string | undefined;
  let slaughterLocation: string | undefined;

  if (item?.farmInventoryId) {
    const slaughterRecord = await getSlaughterRecordByFarmInventoryId(item.farmInventoryId);
    if (slaughterRecord) {
      slaughterDate = new Date(slaughterRecord.slaughteredAt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      slaughterLocation = slaughterRecord.slaughterLocation || undefined;
    }
  }

  return {
    orderId: order.orderId,
    invoiceNumber: order.invoiceNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    itemName: item?.itemName || "",
    participantNames,
    slaughterDate,
    slaughterLocation,
  };
}

export function buildVariableMap(
  orderData: OrderData,
  customVariables?: Record<string, string>
): Record<string, string> {
  const currentYear = new Date().getFullYear();
  const hijriYear = currentYear - 579;

  const trackingUrl = orderData.customerPhone
    ? `https://tracking.rumahqurban.id/lacak/${orderData.customerPhone.replace(/\D/g, "")}`
    : "https://tracking.rumahqurban.id/lacak/";

  const variables: Record<string, string> = {
    customer_name: orderData.customerName,
    customer_phone: orderData.customerPhone || "-",
    invoice_number: orderData.invoiceNumber,
    item_name: orderData.itemName,
    participant_names:
      orderData.participantNames.length > 0
        ? orderData.participantNames.join(", ")
        : orderData.customerName,
    slaughter_date: orderData.slaughterDate || "-",
    slaughter_location: orderData.slaughterLocation || "-",
    tracking_url: trackingUrl,
    year: String(hijriYear),
    ...customVariables,
  };

  return variables;
}

export function compileTemplate(
  templateText: string,
  variables: Record<string, string>
): string {
  let result = templateText;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    result = result.replace(regex, value);
  }

  return result;
}

export async function compileNotificationMessage(
  templateId: number,
  orderId: number,
  customVariables?: Record<string, string>
): Promise<{ success: boolean; message?: string; error?: string; targetPhone?: string }> {
  const template = await getNotifTemplateById(templateId);
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const orderData = await getOrderDataForNotification(orderId);
  if (!orderData) {
    return { success: false, error: "Order not found" };
  }

  if (!orderData.customerPhone) {
    return { success: false, error: "Customer phone number not available" };
  }

  const variables = buildVariableMap(orderData, customVariables);
  const message = compileTemplate(template.templateText, variables);

  return {
    success: true,
    message,
    targetPhone: orderData.customerPhone,
  };
}
