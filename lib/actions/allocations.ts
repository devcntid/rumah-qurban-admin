"use server";

import { getDb } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import { flushRedisCache } from "@/lib/cache/redis";

export async function allocateAnimalAction(inventoryId: number, orderItemId: number) {
  const sql = getDb();
  try {
    const capacityCheck = (await sql`
      SELECT oi.quantity,
             COUNT(ia.id)::int as allocated
      FROM order_items oi
      LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
      WHERE oi.id = ${orderItemId}
      GROUP BY oi.quantity
    `) as { quantity: number; allocated: number }[];

    if (capacityCheck.length > 0) {
      const { quantity, allocated } = capacityCheck[0];
      if (allocated >= quantity) {
        return { success: false, error: `Kuota sudah penuh (${allocated}/${quantity} hewan terpasang)` };
      }
    }

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

    await sql`
      INSERT INTO animal_trackings (farm_inventory_id, milestone, description, logged_at)
      VALUES (
        ${inventoryId},
        'Dialokasikan ke pesanan',
        'Hewan dicocokkan dengan item pesanan (alokasi ke order).',
        NOW()
      )
    `;

    await flushRedisCache();
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/farm");
    revalidatePath("/logistics");
    return { success: true };
  } catch (error) {
    console.error("Allocate Animal Error:", error);
    return { success: false, error: "Gagal mengalokasikan hewan" };
  }
}

export async function deallocateAnimalAction(allocationId: number) {
  const sql = getDb();
  try {
    const allocation = (await sql`
      SELECT farm_inventory_id, order_item_id FROM inventory_allocations WHERE id = ${allocationId}
    `) as { farm_inventory_id: number; order_item_id: number }[];
    if (allocation.length === 0) throw new Error("Alokasi tidak ditemukan");

    const { farm_inventory_id } = allocation[0];

    // 1. Delete allocation
    await sql`DELETE FROM inventory_allocations WHERE id = ${allocationId}`;
    
    // 2. Reset inventory status
    await sql`
      UPDATE farm_inventories
      SET status = 'AVAILABLE', order_item_id = NULL
      WHERE id = ${farm_inventory_id}
    `;

    await flushRedisCache();
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/farm");
    revalidatePath("/logistics");
    return { success: true };
  } catch (error) {
    console.error("Deallocate Animal Error:", error);
    return { success: false, error: "Gagal membatalkan alokasi" };
  }
}

export async function bulkAllocateAction(inventoryIds: number[], orderItemId: number) {
  const sql = getDb();
  try {
    const capacityCheck = (await sql`
      SELECT oi.quantity,
             COUNT(ia.id)::int as allocated
      FROM order_items oi
      LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
      WHERE oi.id = ${orderItemId}
      GROUP BY oi.quantity
    `) as { quantity: number; allocated: number }[];

    if (capacityCheck.length > 0) {
      const { quantity, allocated } = capacityCheck[0];
      const remaining = quantity - allocated;
      if (remaining <= 0) {
        return { success: false, error: `Kuota sudah penuh (${allocated}/${quantity} hewan terpasang)` };
      }
      if (inventoryIds.length > remaining) {
        return { success: false, error: `Hanya bisa menambah ${remaining} hewan lagi (${allocated}/${quantity} sudah terpasang)` };
      }
    }

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

      await sql`
        INSERT INTO animal_trackings (farm_inventory_id, milestone, description, logged_at)
        VALUES (
          ${id},
          'Dialokasikan ke pesanan',
          'Hewan dicocokkan dengan item pesanan (alokasi ke order).',
          NOW()
        )
      `;
    }

    await flushRedisCache();
    revalidatePath("/orders/[id]", "page");
    revalidatePath("/farm");
    revalidatePath("/logistics");
    return { success: true };
  } catch (error) {
    console.error("Bulk Allocate Error:", error);
    return { success: false, error: "Gagal mengalokasikan hewan secara massal" };
  }
}
