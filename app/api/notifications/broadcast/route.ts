import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { compileNotificationMessage } from "@/lib/notifications/template-engine";
import { sendWhatsAppMessage } from "@/lib/notifications/starsender";
import { createNotifLog, updateNotifLogStatus } from "@/lib/db/queries/notif-logs";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderIds, templateId, customVariables } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "orderIds array is required" },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    const results: Array<{
      orderId: number;
      success: boolean;
      error?: string;
      logId?: number;
    }> = [];

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const orderId of orderIds) {
      try {
        const compiled = await compileNotificationMessage(
          templateId,
          orderId,
          customVariables
        );

        if (!compiled.success || !compiled.message || !compiled.targetPhone) {
          failedCount++;
          errors.push(`Order ${orderId}: ${compiled.error || "Failed to compile"}`);
          results.push({
            orderId,
            success: false,
            error: compiled.error,
          });
          continue;
        }

        const logId = await createNotifLog({
          orderId,
          templateId,
          targetNumber: compiled.targetPhone,
          status: "PENDING",
          payload: {
            orderId,
            templateId,
            customVariables,
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
          successCount++;
          results.push({
            orderId,
            success: true,
            logId,
          });
        } else {
          failedCount++;
          errors.push(`Order ${orderId}: ${result.response.error || "Send failed"}`);
          results.push({
            orderId,
            success: false,
            error: result.response.error,
            logId,
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        failedCount++;
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Order ${orderId}: ${errorMsg}`);
        results.push({
          orderId,
          success: false,
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: failedCount === 0,
      successCount,
      failedCount,
      totalProcessed: orderIds.length,
      errors: errors.slice(0, 10),
      results,
    });
  } catch (error) {
    console.error("Error broadcasting notifications:", error);
    const message = error instanceof Error ? error.message : "Failed to broadcast";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
