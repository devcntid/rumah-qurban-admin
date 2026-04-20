"use server";

import { getDb } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { flushRedisCache } from "@/lib/cache/redis";

async function getTripBranchId(tripId: number): Promise<number | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT branch_id FROM logistics_trips WHERE id = ${tripId} LIMIT 1
  `) as { branch_id: number | null }[];
  if (rows.length === 0) return null;
  return rows[0].branch_id;
}

function canAccessTripBranch(sessionBranchId: number, tripBranchId: number | null, isSuperAdmin: boolean) {
  if (isSuperAdmin) return true;
  if (tripBranchId == null) return false;
  return tripBranchId === sessionBranchId;
}

function clipVarchar50(value: string | null | undefined, fallback: string): string {
  const s = (value ?? "").trim();
  if (!s) return fallback.slice(0, 50);
  return s.slice(0, 50);
}

export async function createLogisticsTripAction(input: {
  branchId: number;
  vehiclePlate: string;
  driverName: string;
  scheduledDate: string;
  status?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const superAdmin = session.role === "SUPER_ADMIN";
  const branchId = superAdmin ? input.branchId : session.branchId;
  if (!Number.isFinite(branchId)) {
    return { success: false as const, error: "Cabang tidak valid." };
  }

  const plate = input.vehiclePlate?.trim() ?? "";
  const driver = input.driverName?.trim() ?? "";
  if (!plate || !driver) {
    return { success: false as const, error: "Plat kendaraan dan nama supir wajib diisi." };
  }
  const scheduled = (input.scheduledDate ?? "").trim();
  if (!scheduled) {
    return { success: false as const, error: "Tanggal jadwal wajib diisi." };
  }

  if (!superAdmin && branchId !== session.branchId) {
    return { success: false as const, error: "Cabang tidak diizinkan." };
  }

  const sql = getDb();
  const branchOk = (await sql`
    SELECT 1 AS x FROM branches WHERE id = ${branchId} AND is_active = TRUE LIMIT 1
  `) as { x: number }[];
  if (branchOk.length === 0) {
    return { success: false as const, error: "Cabang tidak ditemukan atau tidak aktif." };
  }

  const status = clipVarchar50(input.status, "PREPARING");

  try {
    const inserted = (await sql`
      INSERT INTO logistics_trips (branch_id, vehicle_plate, driver_name, scheduled_date, status)
      VALUES (${branchId}, ${plate}, ${driver}, ${scheduled}::date, ${status})
      RETURNING id
    `) as { id: number }[];
    const tripId = inserted[0]?.id;
    if (tripId == null) {
      return { success: false as const, error: "Gagal menyimpan jadwal trip." };
    }
    await flushRedisCache();
    revalidatePath("/logistics");
    revalidatePath(`/logistics/trips/${tripId}`);
    return { success: true as const, tripId };
  } catch (e) {
    console.error(e);
    return { success: false as const, error: "Gagal menyimpan jadwal trip." };
  }
}

export async function updateLogisticsTripAction(input: {
  tripId: number;
  vehiclePlate: string;
  driverName: string;
  scheduledDate: string;
  status?: string;
  /** Hanya SUPER_ADMIN: pindahkan trip ke cabang lain */
  branchId?: number;
}) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const tripBranchId = await getTripBranchId(input.tripId);
  if (tripBranchId == null) {
    return { success: false as const, error: "Trip tidak ditemukan." };
  }
  const superAdmin = session.role === "SUPER_ADMIN";
  if (!canAccessTripBranch(session.branchId, tripBranchId, superAdmin)) {
    return { success: false as const, error: "Trip tidak ditemukan atau bukan cabang Anda." };
  }

  const plate = input.vehiclePlate?.trim() ?? "";
  const driver = input.driverName?.trim() ?? "";
  if (!plate || !driver) {
    return { success: false as const, error: "Plat kendaraan dan nama supir wajib diisi." };
  }
  const scheduled = (input.scheduledDate ?? "").trim();
  if (!scheduled) {
    return { success: false as const, error: "Tanggal jadwal wajib diisi." };
  }

  const status = clipVarchar50(input.status, "PREPARING");
  const sql = getDb();

  let nextBranchId = tripBranchId;
  if (input.branchId !== undefined && superAdmin) {
    const b = Number(input.branchId);
    if (!Number.isFinite(b)) {
      return { success: false as const, error: "Cabang tidak valid." };
    }
    const branchOk = (await sql`
      SELECT 1 AS x FROM branches WHERE id = ${b} AND is_active = TRUE LIMIT 1
    `) as { x: number }[];
    if (branchOk.length === 0) {
      return { success: false as const, error: "Cabang tidak ditemukan atau tidak aktif." };
    }
    nextBranchId = b;
  }

  try {
    await sql`
      UPDATE logistics_trips
      SET
        branch_id = ${nextBranchId},
        vehicle_plate = ${plate},
        driver_name = ${driver},
        scheduled_date = ${scheduled}::date,
        status = ${status}
      WHERE id = ${input.tripId}
    `;
  } catch (e) {
    console.error(e);
    return { success: false as const, error: "Gagal memperbarui trip." };
  }

  await flushRedisCache();
  revalidatePath("/logistics");
  revalidatePath(`/logistics/trips/${input.tripId}`);
  return { success: true as const };
}

export async function deleteLogisticsTripAction(tripId: number) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const tripBranchId = await getTripBranchId(tripId);
  if (tripBranchId == null) {
    return { success: false as const, error: "Trip tidak ditemukan." };
  }
  const superAdmin = session.role === "SUPER_ADMIN";
  if (!canAccessTripBranch(session.branchId, tripBranchId, superAdmin)) {
    return { success: false as const, error: "Trip tidak ditemukan atau bukan cabang Anda." };
  }

  const sql = getDb();
  try {
    await sql`DELETE FROM logistics_trips WHERE id = ${tripId}`;
  } catch (e) {
    console.error(e);
    return { success: false as const, error: "Gagal menghapus trip." };
  }

  await flushRedisCache();
  revalidatePath("/logistics");
  revalidatePath(`/logistics/trips/${tripId}`);
  return { success: true as const };
}

export async function bulkAddTrackingToManifestAnimalsAction(input: {
  farmInventoryIds: number[];
  milestone: string;
  description?: string;
  locationLat?: string;
  locationLng?: string;
  mediaUrl?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const { farmInventoryIds, milestone, description, locationLat, locationLng, mediaUrl } = input;
  
  if (!farmInventoryIds || farmInventoryIds.length === 0) {
    return { success: false as const, error: "Pilih minimal satu hewan." };
  }
  
  if (!milestone || milestone.trim().length === 0) {
    return { success: false as const, error: "Milestone wajib diisi." };
  }
  
  const trimmedMilestone = milestone.trim().slice(0, 50);
  const trimmedDescription = description?.trim() || null;
  
  const sql = getDb();
  
  try {
    for (const farmInventoryId of farmInventoryIds) {
      await sql`
        INSERT INTO animal_trackings (
          farm_inventory_id, milestone, description, location_lat, location_lng, media_url, logged_at
        )
        VALUES (
          ${farmInventoryId},
          ${trimmedMilestone},
          ${trimmedDescription},
          ${locationLat ?? null},
          ${locationLng ?? null},
          ${mediaUrl ?? null},
          NOW()
        )
      `;
    }
    
    await flushRedisCache();
    revalidatePath("/logistics");
    revalidatePath("/farm");
    
    return { success: true as const, count: farmInventoryIds.length };
  } catch (e) {
    console.error("Bulk Add Tracking Error:", e);
    return { success: false as const, error: "Gagal menambahkan tracking secara massal." };
  }
}

export async function addFarmInventoryToTripAction(tripId: number, farmInventoryId: number) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const tripBranchId = await getTripBranchId(tripId);
  if (tripBranchId == null) {
    return { success: false as const, error: "Trip tidak ditemukan." };
  }
  const superAdmin = session.role === "SUPER_ADMIN";
  if (!canAccessTripBranch(session.branchId, tripBranchId, superAdmin)) {
    return { success: false as const, error: "Trip tidak ditemukan atau bukan cabang Anda." };
  }

  const sql = getDb();

  const destRows = (await sql`
    SELECT
      o.delivery_address AS addr,
      o.latitude AS lat,
      o.longitude AS lng,
      fi.branch_id AS "branchId"
    FROM farm_inventories fi
    LEFT JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE fi.id = ${farmInventoryId}
    LIMIT 1
  `) as {
    addr: string | null;
    lat: string | null;
    lng: string | null;
    branchId: number | null;
  }[];

  if (destRows.length === 0) {
    return { success: false as const, error: "Hewan tidak ditemukan." };
  }

  const { addr, lat, lng, branchId: fiBranch } = destRows[0];
  if (fiBranch == null || fiBranch !== tripBranchId) {
    return {
      success: false as const,
      error: "Hewan harus berada di cabang yang sama dengan trip armada ini.",
    };
  }
  if (!superAdmin && fiBranch !== session.branchId) {
    return { success: false as const, error: "Hewan tidak berada di cabang Anda." };
  }
  if (!addr) {
    return { success: false as const, error: "Pesanan belum memiliki alamat pengiriman." };
  }

  const dup = (await sql`
    SELECT 1 AS x
    FROM delivery_manifests dm
    WHERE dm.trip_id = ${tripId}
      AND dm.farm_inventory_id = ${farmInventoryId}
      AND COALESCE(dm.delivery_status, 'PENDING') NOT IN ('DELIVERED', 'CANCELLED')
    LIMIT 1
  `) as { x: number }[];
  if (dup.length > 0) {
    return { success: false as const, error: "Hewan ini sudah ada di manifest trip ini." };
  }

  try {
    await sql`
      INSERT INTO delivery_manifests (
        trip_id, farm_inventory_id, destination_address, destination_lat, destination_lng, delivery_status
      )
      VALUES (${tripId}, ${farmInventoryId}, ${addr}, ${lat}, ${lng}, 'PENDING')
    `;
  } catch (e) {
    console.error(e);
    return { success: false as const, error: "Gagal menambah manifest (mungkin sudah terdaftar)." };
  }

  await sql`
    INSERT INTO animal_trackings (farm_inventory_id, milestone, description, location_lat, location_lng, logged_at)
    VALUES (
      ${farmInventoryId},
      'Persiapan Pengiriman',
      'Hewan dimasukkan ke manifest pengiriman armada.',
      NULL,
      NULL,
      NOW()
    )
  `;

  await flushRedisCache();
  revalidatePath("/logistics");
  revalidatePath(`/logistics/trips/${tripId}`);
  revalidatePath("/farm");
  return { success: true as const };
}

const MAX_BULK_MANIFEST = 100;

export async function addFarmInventoriesToTripAction(tripId: number, farmInventoryIds: number[]) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const unique = [...new Set(farmInventoryIds.map((n) => Number(n)))].filter((n) => Number.isFinite(n));
  if (unique.length === 0) {
    return { success: false as const, error: "Pilih minimal satu hewan." };
  }
  if (unique.length > MAX_BULK_MANIFEST) {
    return {
      success: false as const,
      error: `Maksimal ${MAX_BULK_MANIFEST} hewan per penyimpanan. Kurangi pilihan lalu simpan lagi.`,
    };
  }

  const tripBranchId = await getTripBranchId(tripId);
  if (tripBranchId == null) {
    return { success: false as const, error: "Trip tidak ditemukan." };
  }
  const superAdmin = session.role === "SUPER_ADMIN";
  if (!canAccessTripBranch(session.branchId, tripBranchId, superAdmin)) {
    return { success: false as const, error: "Trip tidak ditemukan atau bukan cabang Anda." };
  }

  const sql = getDb();

  type DestRow = {
    addr: string | null;
    lat: string | null;
    lng: string | null;
    branchId: number | null;
  };

  const prepared: { farmInventoryId: number; addr: string; lat: string | null; lng: string | null }[] = [];

  for (const farmInventoryId of unique) {
    const destRows = (await sql`
      SELECT
        o.delivery_address AS addr,
        o.latitude::text AS lat,
        o.longitude::text AS lng,
        fi.branch_id AS "branchId"
      FROM farm_inventories fi
      LEFT JOIN order_items oi
        ON oi.id = COALESCE(
          fi.order_item_id,
          (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
        )
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE fi.id = ${farmInventoryId}
      LIMIT 1
    `) as DestRow[];

    if (destRows.length === 0) {
      return { success: false as const, error: `Hewan #${farmInventoryId} tidak ditemukan.` };
    }

    const { addr, lat, lng, branchId: fiBranch } = destRows[0];
    if (fiBranch == null || fiBranch !== tripBranchId) {
      return {
        success: false as const,
        error: `Hewan #${farmInventoryId} harus berada di cabang yang sama dengan trip ini.`,
      };
    }
    if (!superAdmin && fiBranch !== session.branchId) {
      return { success: false as const, error: `Hewan #${farmInventoryId} tidak berada di cabang Anda.` };
    }
    if (!addr) {
      return {
        success: false as const,
        error: `Pesanan untuk hewan #${farmInventoryId} belum memiliki alamat pengiriman.`,
      };
    }

    const dup = (await sql`
      SELECT 1 AS x
      FROM delivery_manifests dm
      WHERE dm.trip_id = ${tripId}
        AND dm.farm_inventory_id = ${farmInventoryId}
        AND COALESCE(dm.delivery_status, 'PENDING') NOT IN ('DELIVERED', 'CANCELLED')
      LIMIT 1
    `) as { x: number }[];
    if (dup.length > 0) {
      return {
        success: false as const,
        error: `Hewan #${farmInventoryId} sudah ada di manifest trip ini.`,
      };
    }

    prepared.push({ farmInventoryId, addr, lat, lng });
  }

  try {
    for (const row of prepared) {
      await sql`
        INSERT INTO delivery_manifests (
          trip_id, farm_inventory_id, destination_address, destination_lat, destination_lng, delivery_status
        )
        VALUES (${tripId}, ${row.farmInventoryId}, ${row.addr}, ${row.lat}, ${row.lng}, 'PENDING')
      `;
      await sql`
        INSERT INTO animal_trackings (farm_inventory_id, milestone, description, location_lat, location_lng, logged_at)
        VALUES (
          ${row.farmInventoryId},
          'Persiapan Pengiriman',
          'Hewan dimasukkan ke manifest pengiriman armada.',
          NULL,
          NULL,
          NOW()
        )
      `;
    }
  } catch (e) {
    console.error(e);
    return {
      success: false as const,
      error: "Gagal menambah sebagian manifest. Muat ulang halaman dan coba lagi.",
    };
  }

  await flushRedisCache();
  revalidatePath("/logistics");
  revalidatePath(`/logistics/trips/${tripId}`);
  revalidatePath("/farm");
  return { success: true as const, added: prepared.length };
}

export async function markManifestDeliveredAction(manifestId: number) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const sql = getDb();
  const rows = (await sql`
    SELECT
      dm.id,
      dm.trip_id AS "tripId",
      dm.farm_inventory_id AS "farmInventoryId",
      dm.destination_lat,
      dm.destination_lng,
      lt.branch_id,
      dm.delivery_status AS "deliveryStatus"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    WHERE dm.id = ${manifestId}
    LIMIT 1
  `) as {
    id: number;
    tripId: number;
    farmInventoryId: number | null;
    destination_lat: string | null;
    destination_lng: string | null;
    branch_id: number | null;
    deliveryStatus: string | null;
  }[];

  if (rows.length === 0) {
    return { success: false as const, error: "Manifest tidak ditemukan." };
  }
  const row = rows[0];
  const superAdmin = session.role === "SUPER_ADMIN";
  if (!superAdmin && row.branch_id !== session.branchId) {
    return { success: false as const, error: "Akses ditolak." };
  }
  const wasDelivered = row.deliveryStatus === "DELIVERED";

  await sql`
    UPDATE delivery_manifests
    SET delivery_status = 'DELIVERED'
    WHERE id = ${manifestId}
  `;

  if (row.farmInventoryId && !wasDelivered) {
    await sql`
      INSERT INTO animal_trackings (
        farm_inventory_id, milestone, description, location_lat, location_lng, logged_at
      )
      VALUES (
        ${row.farmInventoryId},
        'Hewan Tiba di Lokasi',
        'Hewan qurban telah tiba di alamat tujuan.',
        ${row.destination_lat},
        ${row.destination_lng},
        NOW()
      )
    `;
  }

  await flushRedisCache();
  revalidatePath("/logistics");
  revalidatePath(`/logistics/trips/${row.tripId}`);
  revalidatePath("/farm");
  revalidatePath("/orders/[id]", "page");
  return { success: true as const };
}

export async function updateDeliveryManifestAction(input: {
  manifestId: number;
  destinationAddress: string;
  destinationLat: string;
  destinationLng: string;
  deliveryStatus: string;
  tripId: number;
  farmInventoryId: number | null;
}) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const sql = getDb();
  const curRows = (await sql`
    SELECT
      dm.id,
      dm.trip_id AS "tripId",
      dm.farm_inventory_id AS "farmInventoryId",
      lt.branch_id AS "branchId"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    WHERE dm.id = ${input.manifestId}
    LIMIT 1
  `) as {
    id: number;
    tripId: number;
    farmInventoryId: number | null;
    branchId: number | null;
  }[];

  if (curRows.length === 0) {
    return { success: false as const, error: "Manifest tidak ditemukan." };
  }
  const cur = curRows[0];
  const superAdmin = session.role === "SUPER_ADMIN";
  if (!canAccessTripBranch(session.branchId, cur.branchId, superAdmin)) {
    return { success: false as const, error: "Akses ditolak." };
  }

  const tripRows = (await sql`
    SELECT branch_id FROM logistics_trips WHERE id = ${input.tripId} LIMIT 1
  `) as { branch_id: number | null }[];
  if (tripRows.length === 0) {
    return { success: false as const, error: "Trip tujuan tidak ditemukan." };
  }
  const targetBranchId = tripRows[0].branch_id;
  if (!canAccessTripBranch(session.branchId, targetBranchId, superAdmin)) {
    return { success: false as const, error: "Trip tujuan tidak diizinkan untuk cabang Anda." };
  }

  const fiId = input.farmInventoryId;
  if (fiId != null) {
    const fiRows = (await sql`
      SELECT branch_id FROM farm_inventories WHERE id = ${fiId} LIMIT 1
    `) as { branch_id: number | null }[];
    if (fiRows.length === 0) {
      return { success: false as const, error: "Hewan inventaris tidak ditemukan." };
    }
    if (fiRows[0].branch_id !== targetBranchId) {
      return {
        success: false as const,
        error: "Hewan harus berada di cabang yang sama dengan trip yang dipilih.",
      };
    }
    const dup = (await sql`
      SELECT 1 AS x
      FROM delivery_manifests d2
      WHERE d2.id <> ${input.manifestId}
        AND d2.farm_inventory_id = ${fiId}
        AND COALESCE(d2.delivery_status, 'PENDING') NOT IN ('DELIVERED', 'CANCELLED')
      LIMIT 1
    `) as { x: number }[];
    if (dup.length > 0) {
      return {
        success: false as const,
        error: "Hewan ini masih aktif di manifest lain. Selesaikan atau ubah manifest lain dulu.",
      };
    }
  }

  const addr = input.destinationAddress.trim() || null;
  const lat = input.destinationLat.trim() || null;
  const lng = input.destinationLng.trim() || null;
  const delStatus = clipVarchar50(input.deliveryStatus, "PENDING");

  try {
    await sql`
      UPDATE delivery_manifests
      SET
        trip_id = ${input.tripId},
        farm_inventory_id = ${fiId},
        destination_address = ${addr},
        destination_lat = ${lat},
        destination_lng = ${lng},
        delivery_status = ${delStatus}
      WHERE id = ${input.manifestId}
    `;
  } catch (e) {
    console.error(e);
    return { success: false as const, error: "Gagal memperbarui manifest." };
  }

  await flushRedisCache();
  revalidatePath("/logistics");
  revalidatePath(`/logistics/trips/${input.tripId}`);
  if (cur.tripId !== input.tripId) {
    revalidatePath(`/logistics/trips/${cur.tripId}`);
  }
  revalidatePath("/farm");
  revalidatePath("/orders/[id]", "page");
  return { success: true as const };
}

export async function deleteDeliveryManifestAction(manifestId: number) {
  const session = await getSession();
  if (!session) return { success: false as const, error: "Sesi tidak valid." };

  const sql = getDb();
  const rows = (await sql`
    SELECT dm.id, dm.trip_id AS "tripId", lt.branch_id AS "branchId"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    WHERE dm.id = ${manifestId}
    LIMIT 1
  `) as { id: number; tripId: number; branchId: number | null }[];

  if (rows.length === 0) {
    return { success: false as const, error: "Manifest tidak ditemukan." };
  }
  const row = rows[0];
  const superAdmin = session.role === "SUPER_ADMIN";
  if (!canAccessTripBranch(session.branchId, row.branchId, superAdmin)) {
    return { success: false as const, error: "Akses ditolak." };
  }

  try {
    await sql`DELETE FROM delivery_manifests WHERE id = ${manifestId}`;
  } catch (e) {
    console.error(e);
    return { success: false as const, error: "Gagal menghapus manifest." };
  }

  await flushRedisCache();
  revalidatePath("/logistics");
  revalidatePath(`/logistics/trips/${row.tripId}`);
  revalidatePath("/farm");
  revalidatePath("/orders/[id]", "page");
  return { success: true as const };
}
