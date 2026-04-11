"use server";

import { getDb } from "@/lib/db/client";
import { revalidatePath } from "next/cache";

export async function allocateAnimalAction(inventoryId: number, orderItemId: number) {
  const sql = getDb();
  try {
    // 1. Create allocation
    await sql`
      INSERT INTO inventory_allocations (order_item_id, farm_inventory_id, allocated_at)
      VALUES (${orderItemId}, ${inventoryId}, NOW())
    `;
    // 2. Update inventory status and link
    await sql`
      UPDATE farm_inventories
      SET status = 'ALLOCATED', order_item_id = ${orderItemId}
      WHERE id = ${inventoryId}
    `;
    
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/farm");
    return { success: true };
  } catch (error) {
    console.error("Allocate Animal Error:", error);
    return { success: false, error: "Gagal mengalokasikan hewan" };
  }
}

export async function deallocateAnimalAction(allocationId: number) {
  const sql = getDb();
  try {
    const allocation = await sql`
      SELECT farm_inventory_id, order_item_id FROM inventory_allocations WHERE id = ${allocationId}
    `;
    if (allocation.length === 0) throw new Error("Alokasi tidak ditemukan");
    
    const { farm_inventory_id } = allocation[0] as any;

    // 1. Delete allocation
    await sql`DELETE FROM inventory_allocations WHERE id = ${allocationId}`;
    
    // 2. Reset inventory status
    await sql`
      UPDATE farm_inventories
      SET status = 'AVAILABLE', order_item_id = NULL
      WHERE id = ${farm_inventory_id}
    `;

    revalidatePath("/orders/[id]", "page");
    revalidatePath("/farm");
    return { success: true };
  } catch (error) {
    console.error("Deallocate Animal Error:", error);
    return { success: false, error: "Gagal membatalkan alokasi" };
  }
}

export async function bulkAllocateAction(inventoryIds: number[], orderItemId: number) {
  const sql = getDb();
  try {
    // Run sequentially for each ID
    for (const id of inventoryIds) {
      await sql`
        INSERT INTO inventory_allocations (order_item_id, farm_inventory_id, allocated_at)
        VALUES (${orderItemId}, ${id}, NOW())
      `;
      await sql`
        UPDATE farm_inventories
        SET status = 'ALLOCATED', order_item_id = ${orderItemId}
        WHERE id = ${id}
      `;
    }
    
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/farm");
    return { success: true };
  } catch (error) {
    console.error("Bulk Allocate Error:", error);
    return { success: false, error: "Gagal mengalokasikan hewan secara massal" };
  }
}
