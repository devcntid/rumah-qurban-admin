"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { flushRedisCache } from "@/lib/cache/redis";
import {
  createSlaughterSchedule,
  updateSlaughterSchedule,
  deleteSlaughterSchedule,
  assignOrderItemsToSchedule,
  unassignOrderItemsFromSchedule,
} from "@/lib/db/queries/slaughter-schedules";
import type { SlaughterScheduleInput, SlaughterScheduleStatus } from "@/types/slaughter-schedule";

export async function createScheduleAction(
  data: SlaughterScheduleInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const id = await createSlaughterSchedule(data);
    await flushRedisCache();
    revalidatePath("/slaughter-schedules");
    return { success: true, id };
  } catch (error) {
    console.error("Error creating schedule:", error);
    const msg = error instanceof Error ? error.message : "Gagal membuat jadwal";
    if (msg.includes("slaughter_schedules_branch_date_location_uniq")) {
      return { success: false, error: "Jadwal dengan cabang, tanggal, dan lokasi yang sama sudah ada" };
    }
    return { success: false, error: msg };
  }
}

export async function updateScheduleAction(
  id: number,
  data: Partial<SlaughterScheduleInput>
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await updateSlaughterSchedule(id, data);
    await flushRedisCache();
    revalidatePath("/slaughter-schedules");
    return { success: true };
  } catch (error) {
    console.error("Error updating schedule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengupdate jadwal",
    };
  }
}

export async function updateScheduleStatusAction(
  id: number,
  status: SlaughterScheduleStatus
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await updateSlaughterSchedule(id, { status });
    await flushRedisCache();
    revalidatePath("/slaughter-schedules");
    return { success: true };
  } catch (error) {
    console.error("Error updating schedule status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengupdate status",
    };
  }
}

export async function deleteScheduleAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await deleteSlaughterSchedule(id);
    await flushRedisCache();
    revalidatePath("/slaughter-schedules");
    return { success: true };
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus jadwal",
    };
  }
}

export async function assignItemsAction(
  scheduleId: number,
  orderItemIds: number[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await assignOrderItemsToSchedule(scheduleId, orderItemIds);
    await flushRedisCache();
    revalidatePath("/slaughter-schedules");
    return { success: true };
  } catch (error) {
    console.error("Error assigning items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal assign item",
    };
  }
}

export async function unassignItemsAction(
  orderItemIds: number[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await unassignOrderItemsFromSchedule(orderItemIds);
    await flushRedisCache();
    revalidatePath("/slaughter-schedules");
    return { success: true };
  } catch (error) {
    console.error("Error unassigning items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal unassign item",
    };
  }
}
