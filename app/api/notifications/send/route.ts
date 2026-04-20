import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { compileNotificationMessage } from "@/lib/notifications/template-engine";
import { sendWhatsAppMessage } from "@/lib/notifications/starsender";
import { createNotifLog, updateNotifLogStatus } from "@/lib/db/queries/notif-logs";
import { flushRedisCache } from "@/lib/cache/redis";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, templateId, customVariables, preview } = body;

    if (!orderId || !templateId) {
      return NextResponse.json(
        { error: "orderId and templateId are required" },
        { status: 400 }
      );
    }

    const compiled = await compileNotificationMessage(
      templateId,
      orderId,
      customVariables
    );

    if (!compiled.success || !compiled.message || !compiled.targetPhone) {
      return NextResponse.json(
        { error: compiled.error || "Failed to compile message" },
        { status: 400 }
      );
    }

    if (preview) {
      return NextResponse.json({
        success: true,
        message: compiled.message,
      });
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

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.response.error || "Failed to send message",
          logId,
        },
        { status: 500 }
      );
    }

    await flushRedisCache();

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      logId,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    const message = error instanceof Error ? error.message : "Failed to send notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
