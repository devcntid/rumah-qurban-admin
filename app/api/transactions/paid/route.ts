import { NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { markTransactionAsPaid } from "@/lib/db/queries/transactions";
import { getNotifTemplateByName } from "@/lib/db/queries/notif-templates";
import { compileNotificationMessage } from "@/lib/notifications/template-engine";
import { sendWhatsAppMessage } from "@/lib/notifications/starsender";
import { createNotifLog, updateNotifLogStatus } from "@/lib/db/queries/notif-logs";

const PAID_TEMPLATE_NAME = "PAID";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    const { orderId } = await markTransactionAsPaid(Number(transactionId));

    let waSuccess = false;
    let waError: string | undefined;

    try {
      const template = await getNotifTemplateByName(PAID_TEMPLATE_NAME);
      if (!template) {
        waError = "Template PAID tidak ditemukan di database";
      } else {
        const compiled = await compileNotificationMessage(template.id, orderId);

        if (!compiled.success || !compiled.message || !compiled.targetPhone) {
          waError = compiled.error || "Gagal compile pesan notifikasi";
        } else {
          const logId = await createNotifLog({
            orderId,
            templateId: template.id,
            targetNumber: compiled.targetPhone,
            status: "PENDING",
            payload: {
              transactionId,
              orderId,
              templateId: template.id,
              compiledMessage: compiled.message,
            },
            providerResponse: null,
          });

          const result = await sendWhatsAppMessage(compiled.targetPhone, compiled.message);

          await updateNotifLogStatus(
            logId,
            result.success ? "SENT" : "FAILED",
            result.response
          );

          if (result.success) {
            waSuccess = true;
          } else {
            waError = result.response?.error || "Gagal mengirim WhatsApp";
          }
        }
      }
    } catch (notifErr) {
      console.error("WhatsApp notification error (payment still processed):", notifErr);
      waError = notifErr instanceof Error ? notifErr.message : "Error saat mengirim notifikasi";
    }

    return NextResponse.json({
      success: true,
      orderId,
      waSuccess,
      waError,
    });
  } catch (err) {
    console.error("Mark as paid error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
