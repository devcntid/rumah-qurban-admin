"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { compileNotificationMessage } from "@/lib/notifications/template-engine";
import { sendWhatsAppMessage } from "@/lib/notifications/starsender";
import { createNotifLog, updateNotifLogStatus } from "@/lib/db/queries/notif-logs";
import type { NotificationResult, BulkNotificationResult } from "@/types/notifications";

export async function sendNotificationAction(data: {
  orderId: number;
  templateId: number;
  customVariables?: Record<string, string>;
}): Promise<NotificationResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const compiled = await compileNotificationMessage(
      data.templateId,
      data.orderId,
      data.customVariables
    );

    if (!compiled.success || !compiled.message || !compiled.targetPhone) {
      return { success: false, error: compiled.error || "Failed to compile message" };
    }

    const logId = await createNotifLog({
      orderId: data.orderId,
      templateId: data.templateId,
      targetNumber: compiled.targetPhone,
      status: "PENDING",
      payload: {
        orderId: data.orderId,
        templateId: data.templateId,
        customVariables: data.customVariables,
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
      return {
        success: false,
        error: result.response.error || "Failed to send message",
        logId,
      };
    }

    revalidatePath("/orders");
    revalidatePath("/broadcast");

    return { success: true, logId };
  } catch (error) {
    console.error("Error sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
    };
  }
}

export async function sendBulkNotificationsAction(data: {
  orderIds: number[];
  templateId: number;
  customVariables?: Record<string, string>;
}): Promise<BulkNotificationResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, successCount: 0, failedCount: 0, errors: ["Unauthorized"] };
  }

  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const orderId of data.orderIds) {
    try {
      const compiled = await compileNotificationMessage(
        data.templateId,
        orderId,
        data.customVariables
      );

      if (!compiled.success || !compiled.message || !compiled.targetPhone) {
        failedCount++;
        errors.push(`Order ${orderId}: ${compiled.error || "Failed to compile"}`);
        continue;
      }

      const logId = await createNotifLog({
        orderId,
        templateId: data.templateId,
        targetNumber: compiled.targetPhone,
        status: "PENDING",
        payload: {
          orderId,
          templateId: data.templateId,
          customVariables: data.customVariables,
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
      } else {
        failedCount++;
        errors.push(`Order ${orderId}: ${result.response.error || "Send failed"}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      failedCount++;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Order ${orderId}: ${errorMsg}`);
    }
  }

  revalidatePath("/orders");
  revalidatePath("/broadcast");

  return {
    success: failedCount === 0,
    successCount,
    failedCount,
    errors: errors.slice(0, 20),
  };
}

export async function previewNotificationAction(data: {
  orderId: number;
  templateId: number;
  customVariables?: Record<string, string>;
}): Promise<{ success: boolean; message?: string; targetPhone?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const compiled = await compileNotificationMessage(
    data.templateId,
    data.orderId,
    data.customVariables
  );

  return compiled;
}
