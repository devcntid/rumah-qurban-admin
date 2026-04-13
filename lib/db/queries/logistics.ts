import { getDb } from "@/lib/db/client";

export type LogisticsTripRow = {
  id: number;
  branchId: number | null;
  branchName: string | null;
  vehiclePlate: string;
  driverName: string;
  scheduledDate: string;
  status: string | null;
};

export type DeliveryManifestRow = {
  id: number;
  tripId: number;
  farmInventoryId: number | null;
  destinationAddressSnapshot: string | null;
  destinationLatSnapshot: string | null;
  destinationLngSnapshot: string | null;
  deliveryStatus: string | null;
  eartagId: string | null;
  generatedId: string | null;
  orderItemId: number | null;
  orderId: number | null;
  invoiceNumber: string | null;
  customerName: string | null;
  destinationAddress: string | null;
  destinationLat: string | null;
  destinationLng: string | null;
};

export type TripWithManifests = LogisticsTripRow & { manifests: DeliveryManifestRow[] };

export async function listLogisticsTrips(branchId: number): Promise<LogisticsTripRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      lt.id,
      lt.branch_id AS "branchId",
      b.name AS "branchName",
      lt.vehicle_plate AS "vehiclePlate",
      lt.driver_name AS "driverName",
      lt.scheduled_date::text AS "scheduledDate",
      lt.status
    FROM logistics_trips lt
    LEFT JOIN branches b ON b.id = lt.branch_id
    WHERE lt.branch_id = ${branchId}
    ORDER BY lt.scheduled_date DESC NULLS LAST, lt.id DESC
  `) as LogisticsTripRow[];
}

export async function listAllLogisticsTrips(): Promise<LogisticsTripRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      lt.id,
      lt.branch_id AS "branchId",
      b.name AS "branchName",
      lt.vehicle_plate AS "vehiclePlate",
      lt.driver_name AS "driverName",
      lt.scheduled_date::text AS "scheduledDate",
      lt.status
    FROM logistics_trips lt
    LEFT JOIN branches b ON b.id = lt.branch_id
    ORDER BY lt.scheduled_date DESC NULLS LAST, lt.id DESC
  `) as LogisticsTripRow[];
}

export async function listDeliveryManifestsForBranch(
  branchId: number
): Promise<DeliveryManifestRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      dm.id,
      dm.trip_id AS "tripId",
      dm.farm_inventory_id AS "farmInventoryId",
      dm.destination_address AS "destinationAddressSnapshot",
      dm.destination_lat::text AS "destinationLatSnapshot",
      dm.destination_lng::text AS "destinationLngSnapshot",
      dm.delivery_status AS "deliveryStatus",
      fi.eartag_id AS "eartagId",
      fi.generated_id AS "generatedId",
      oi.id AS "orderItemId",
      o.id AS "orderId",
      o.invoice_number AS "invoiceNumber",
      o.customer_name AS "customerName",
      COALESCE(dm.destination_address, o.delivery_address) AS "destinationAddress",
      COALESCE(dm.destination_lat::text, o.latitude::text) AS "destinationLat",
      COALESCE(dm.destination_lng::text, o.longitude::text) AS "destinationLng"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id AND lt.branch_id = ${branchId}
    LEFT JOIN farm_inventories fi ON fi.id = dm.farm_inventory_id
    LEFT JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    LEFT JOIN orders o ON o.id = oi.order_id
    ORDER BY dm.trip_id ASC, dm.id ASC
  `) as DeliveryManifestRow[];
}

export async function listAllDeliveryManifests(): Promise<DeliveryManifestRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      dm.id,
      dm.trip_id AS "tripId",
      dm.farm_inventory_id AS "farmInventoryId",
      dm.destination_address AS "destinationAddressSnapshot",
      dm.destination_lat::text AS "destinationLatSnapshot",
      dm.destination_lng::text AS "destinationLngSnapshot",
      dm.delivery_status AS "deliveryStatus",
      fi.eartag_id AS "eartagId",
      fi.generated_id AS "generatedId",
      oi.id AS "orderItemId",
      o.id AS "orderId",
      o.invoice_number AS "invoiceNumber",
      o.customer_name AS "customerName",
      COALESCE(dm.destination_address, o.delivery_address) AS "destinationAddress",
      COALESCE(dm.destination_lat::text, o.latitude::text) AS "destinationLat",
      COALESCE(dm.destination_lng::text, o.longitude::text) AS "destinationLng"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    LEFT JOIN farm_inventories fi ON fi.id = dm.farm_inventory_id
    LEFT JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    LEFT JOIN orders o ON o.id = oi.order_id
    ORDER BY dm.trip_id ASC, dm.id ASC
  `) as DeliveryManifestRow[];
}

export type LogisticsTripSummaryRow = LogisticsTripRow & { manifestCount: number };

export async function listLogisticsTripsSummary(branchId: number): Promise<LogisticsTripSummaryRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      lt.id,
      lt.branch_id AS "branchId",
      b.name AS "branchName",
      lt.vehicle_plate AS "vehiclePlate",
      lt.driver_name AS "driverName",
      lt.scheduled_date::text AS "scheduledDate",
      lt.status,
      COALESCE(
        (SELECT COUNT(*)::int FROM delivery_manifests dm WHERE dm.trip_id = lt.id),
        0
      ) AS "manifestCount"
    FROM logistics_trips lt
    LEFT JOIN branches b ON b.id = lt.branch_id
    WHERE lt.branch_id = ${branchId}
    ORDER BY lt.scheduled_date DESC NULLS LAST, lt.id DESC
  `) as LogisticsTripSummaryRow[];
}

export async function listAllLogisticsTripsSummary(): Promise<LogisticsTripSummaryRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      lt.id,
      lt.branch_id AS "branchId",
      b.name AS "branchName",
      lt.vehicle_plate AS "vehiclePlate",
      lt.driver_name AS "driverName",
      lt.scheduled_date::text AS "scheduledDate",
      lt.status,
      COALESCE(
        (SELECT COUNT(*)::int FROM delivery_manifests dm WHERE dm.trip_id = lt.id),
        0
      ) AS "manifestCount"
    FROM logistics_trips lt
    LEFT JOIN branches b ON b.id = lt.branch_id
    ORDER BY lt.scheduled_date DESC NULLS LAST, lt.id DESC
  `) as LogisticsTripSummaryRow[];
}

export type LogisticsTripsListFilter = {
  sessionBranchId: number;
  isSuperAdmin: boolean;
  filterBranchId?: number;
  q?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
};

function buildLogisticsTripsSummaryWhere(f: LogisticsTripsListFilter): { whereSql: string; values: unknown[] } {
  const where: string[] = [];
  const values: unknown[] = [];

  if (!f.isSuperAdmin) {
    values.push(f.sessionBranchId);
    where.push(`lt.branch_id = $${values.length}`);
  } else if (f.filterBranchId != null && Number.isFinite(f.filterBranchId)) {
    values.push(f.filterBranchId);
    where.push(`lt.branch_id = $${values.length}`);
  }

  const q = (f.q ?? "").trim();
  if (q) {
    values.push(`%${q}%`);
    const p = values.length;
    where.push(
      `(lt.vehicle_plate ILIKE $${p} OR lt.driver_name ILIKE $${p} OR COALESCE(b.name, '') ILIKE $${p})`
    );
  }

  const st = (f.status ?? "").trim();
  if (st) {
    values.push(`%${st}%`);
    where.push(`COALESCE(lt.status, '') ILIKE $${values.length}`);
  }

  const sd = (f.startDate ?? "").trim();
  if (sd) {
    values.push(sd);
    where.push(`lt.scheduled_date >= $${values.length}::date`);
  }

  const ed = (f.endDate ?? "").trim();
  if (ed) {
    values.push(ed);
    where.push(`lt.scheduled_date <= $${values.length}::date`);
  }

  const whereSql = where.length > 0 ? where.join(" AND ") : "TRUE";
  return { whereSql, values };
}

export async function listLogisticsTripsSummaryPaged(
  f: LogisticsTripsListFilter
): Promise<LogisticsTripSummaryRow[]> {
  const sql = getDb();
  const { whereSql, values } = buildLogisticsTripsSummaryWhere(f);
  const lim = Math.min(Math.max(Number(f.limit) || 10, 1), 100);
  const off = Math.max(Number(f.offset) || 0, 0);

  const query = `
    SELECT
      lt.id,
      lt.branch_id AS "branchId",
      b.name AS "branchName",
      lt.vehicle_plate AS "vehiclePlate",
      lt.driver_name AS "driverName",
      lt.scheduled_date::text AS "scheduledDate",
      lt.status,
      COALESCE(
        (SELECT COUNT(*)::int FROM delivery_manifests dm WHERE dm.trip_id = lt.id),
        0
      ) AS "manifestCount"
    FROM logistics_trips lt
    LEFT JOIN branches b ON b.id = lt.branch_id
    WHERE ${whereSql}
    ORDER BY lt.scheduled_date DESC NULLS LAST, lt.id DESC
    LIMIT ${lim} OFFSET ${off}
  `;

  const rows = await sql.query(query, values);
  return rows as unknown as LogisticsTripSummaryRow[];
}

export async function countLogisticsTripsSummary(f: Omit<LogisticsTripsListFilter, "limit" | "offset">): Promise<number> {
  const sql = getDb();
  const { whereSql, values } = buildLogisticsTripsSummaryWhere({
    ...f,
    limit: 10,
    offset: 0,
  });
  const query = `
    SELECT COUNT(*)::int AS count
    FROM logistics_trips lt
    LEFT JOIN branches b ON b.id = lt.branch_id
    WHERE ${whereSql}
  `;
  const rows = (await sql.query(query, values)) as { count: number }[];
  return Number(rows[0]?.count ?? 0);
}

export type TripManifestsListFilter = {
  tripId: number;
  mq?: string;
  mstatus?: string;
  limit: number;
  offset: number;
};

function manifestListSelectSql(): string {
  return `
    SELECT
      dm.id,
      dm.trip_id AS "tripId",
      dm.farm_inventory_id AS "farmInventoryId",
      dm.destination_address AS "destinationAddressSnapshot",
      dm.destination_lat::text AS "destinationLatSnapshot",
      dm.destination_lng::text AS "destinationLngSnapshot",
      dm.delivery_status AS "deliveryStatus",
      fi.eartag_id AS "eartagId",
      fi.generated_id AS "generatedId",
      oi.id AS "orderItemId",
      o.id AS "orderId",
      o.invoice_number AS "invoiceNumber",
      o.customer_name AS "customerName",
      COALESCE(dm.destination_address, o.delivery_address) AS "destinationAddress",
      COALESCE(dm.destination_lat::text, o.latitude::text) AS "destinationLat",
      COALESCE(dm.destination_lng::text, o.longitude::text) AS "destinationLng"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    LEFT JOIN farm_inventories fi ON fi.id = dm.farm_inventory_id
    LEFT JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    LEFT JOIN orders o ON o.id = oi.order_id
  `;
}

export async function listDeliveryManifestsForTripIdPaged(
  f: TripManifestsListFilter
): Promise<DeliveryManifestRow[]> {
  const sql = getDb();
  const values: unknown[] = [f.tripId];
  const where: string[] = [`dm.trip_id = $1`];

  const mq = (f.mq ?? "").trim();
  if (mq) {
    values.push(`%${mq}%`);
    const p = values.length;
    where.push(
      `(COALESCE(fi.eartag_id, '') ILIKE $${p}
        OR COALESCE(fi.generated_id, '') ILIKE $${p}
        OR COALESCE(o.invoice_number, '') ILIKE $${p}
        OR COALESCE(o.customer_name, '') ILIKE $${p}
        OR COALESCE(dm.destination_address, o.delivery_address, '') ILIKE $${p})`
    );
  }

  const ms = (f.mstatus ?? "").trim();
  if (ms) {
    values.push(`%${ms}%`);
    where.push(`COALESCE(dm.delivery_status, 'PENDING') ILIKE $${values.length}`);
  }

  const lim = Math.min(Math.max(Number(f.limit) || 10, 1), 100);
  const off = Math.max(Number(f.offset) || 0, 0);

  const query = `
    ${manifestListSelectSql()}
    WHERE ${where.join(" AND ")}
    ORDER BY dm.id ASC
    LIMIT ${lim} OFFSET ${off}
  `;

  const rows = await sql.query(query, values);
  return rows as unknown as DeliveryManifestRow[];
}

export async function countDeliveryManifestsForTripId(
  tripId: number,
  mq?: string,
  mstatus?: string
): Promise<number> {
  const sql = getDb();
  const values: unknown[] = [tripId];
  const where: string[] = [`dm.trip_id = $1`];

  const q = (mq ?? "").trim();
  if (q) {
    values.push(`%${q}%`);
    const p = values.length;
    where.push(
      `(COALESCE(fi.eartag_id, '') ILIKE $${p}
        OR COALESCE(fi.generated_id, '') ILIKE $${p}
        OR COALESCE(o.invoice_number, '') ILIKE $${p}
        OR COALESCE(o.customer_name, '') ILIKE $${p}
        OR COALESCE(dm.destination_address, o.delivery_address, '') ILIKE $${p})`
    );
  }

  const ms = (mstatus ?? "").trim();
  if (ms) {
    values.push(`%${ms}%`);
    where.push(`COALESCE(dm.delivery_status, 'PENDING') ILIKE $${values.length}`);
  }

  const query = `
    SELECT COUNT(*)::int AS count
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    LEFT JOIN farm_inventories fi ON fi.id = dm.farm_inventory_id
    LEFT JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE ${where.join(" AND ")}
  `;

  const rows = (await sql.query(query, values)) as { count: number }[];
  return Number(rows[0]?.count ?? 0);
}

export async function listDeliveryManifestsForTripId(tripId: number): Promise<DeliveryManifestRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      dm.id,
      dm.trip_id AS "tripId",
      dm.farm_inventory_id AS "farmInventoryId",
      dm.destination_address AS "destinationAddressSnapshot",
      dm.destination_lat::text AS "destinationLatSnapshot",
      dm.destination_lng::text AS "destinationLngSnapshot",
      dm.delivery_status AS "deliveryStatus",
      fi.eartag_id AS "eartagId",
      fi.generated_id AS "generatedId",
      oi.id AS "orderItemId",
      o.id AS "orderId",
      o.invoice_number AS "invoiceNumber",
      o.customer_name AS "customerName",
      COALESCE(dm.destination_address, o.delivery_address) AS "destinationAddress",
      COALESCE(dm.destination_lat::text, o.latitude::text) AS "destinationLat",
      COALESCE(dm.destination_lng::text, o.longitude::text) AS "destinationLng"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    LEFT JOIN farm_inventories fi ON fi.id = dm.farm_inventory_id
    LEFT JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE dm.trip_id = ${tripId}
    ORDER BY dm.id ASC
  `) as DeliveryManifestRow[];
}

export async function getLogisticsTripById(
  tripId: number,
  sessionBranchId: number,
  isSuperAdmin: boolean
): Promise<LogisticsTripRow | null> {
  const sql = getDb();
  const tripRows = isSuperAdmin
    ? ((await sql`
        SELECT
          lt.id,
          lt.branch_id AS "branchId",
          b.name AS "branchName",
          lt.vehicle_plate AS "vehiclePlate",
          lt.driver_name AS "driverName",
          lt.scheduled_date::text AS "scheduledDate",
          lt.status
        FROM logistics_trips lt
        LEFT JOIN branches b ON b.id = lt.branch_id
        WHERE lt.id = ${tripId}
        LIMIT 1
      `) as LogisticsTripRow[])
    : ((await sql`
        SELECT
          lt.id,
          lt.branch_id AS "branchId",
          b.name AS "branchName",
          lt.vehicle_plate AS "vehiclePlate",
          lt.driver_name AS "driverName",
          lt.scheduled_date::text AS "scheduledDate",
          lt.status
        FROM logistics_trips lt
        LEFT JOIN branches b ON b.id = lt.branch_id
        WHERE lt.id = ${tripId} AND lt.branch_id = ${sessionBranchId}
        LIMIT 1
      `) as LogisticsTripRow[]);

  if (tripRows.length === 0) return null;
  return tripRows[0];
}

export async function getLogisticsTripWithManifests(
  tripId: number,
  sessionBranchId: number,
  isSuperAdmin: boolean
): Promise<TripWithManifests | null> {
  const trip = await getLogisticsTripById(tripId, sessionBranchId, isSuperAdmin);
  if (!trip) return null;
  const manifests = await listDeliveryManifestsForTripId(tripId);
  return { ...trip, manifests };
}

export async function getDeliveryManifestById(
  manifestId: number,
  sessionBranchId: number,
  isSuperAdmin: boolean
): Promise<(DeliveryManifestRow & { tripBranchId: number | null }) | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT
      dm.id,
      dm.trip_id AS "tripId",
      dm.farm_inventory_id AS "farmInventoryId",
      dm.destination_address AS "destinationAddressSnapshot",
      dm.destination_lat::text AS "destinationLatSnapshot",
      dm.destination_lng::text AS "destinationLngSnapshot",
      dm.delivery_status AS "deliveryStatus",
      fi.eartag_id AS "eartagId",
      fi.generated_id AS "generatedId",
      oi.id AS "orderItemId",
      o.id AS "orderId",
      o.invoice_number AS "invoiceNumber",
      o.customer_name AS "customerName",
      COALESCE(dm.destination_address, o.delivery_address) AS "destinationAddress",
      COALESCE(dm.destination_lat::text, o.latitude::text) AS "destinationLat",
      COALESCE(dm.destination_lng::text, o.longitude::text) AS "destinationLng",
      lt.branch_id AS "tripBranchId"
    FROM delivery_manifests dm
    INNER JOIN logistics_trips lt ON lt.id = dm.trip_id
    LEFT JOIN farm_inventories fi ON fi.id = dm.farm_inventory_id
    LEFT JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE dm.id = ${manifestId}
    LIMIT 1
  `) as (DeliveryManifestRow & { tripBranchId: number | null })[];

  if (rows.length === 0) return null;
  const row = rows[0];
  if (!isSuperAdmin && row.tripBranchId !== sessionBranchId) return null;
  return row;
}

function attachManifests(
  trips: LogisticsTripRow[],
  manifests: DeliveryManifestRow[]
): TripWithManifests[] {
  const byTrip = new Map<number, DeliveryManifestRow[]>();
  for (const m of manifests) {
    const list = byTrip.get(m.tripId) ?? [];
    list.push(m);
    byTrip.set(m.tripId, list);
  }
  return trips.map((t) => ({
    ...t,
    manifests: byTrip.get(t.id) ?? [],
  }));
}

export async function listLogisticsTripsWithManifests(branchId: number): Promise<TripWithManifests[]> {
  const trips = await listLogisticsTrips(branchId);
  const manifests = await listDeliveryManifestsForBranch(branchId);
  return attachManifests(trips, manifests);
}

export async function listAllLogisticsTripsWithManifests(): Promise<TripWithManifests[]> {
  const trips = await listAllLogisticsTrips();
  const manifests = await listAllDeliveryManifests();
  return attachManifests(trips, manifests);
}

export type EligibleFarmAnimalRow = {
  id: number;
  branchId: number | null;
  eartagId: string;
  generatedId: string | null;
  orderItemId: number | null;
  invoiceNumber: string | null;
  customerName: string | null;
};

/** Hewan teralokasi ke order yang belum punya manifest aktif (mana pun trip/cabangnya). */
export async function listFarmInventoryIdsEligibleForManifest(
  branchId: number
): Promise<EligibleFarmAnimalRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      fi.id,
      fi.branch_id AS "branchId",
      fi.eartag_id AS "eartagId",
      fi.generated_id AS "generatedId",
      oi.id AS "orderItemId",
      o.invoice_number AS "invoiceNumber",
      o.customer_name AS "customerName"
    FROM farm_inventories fi
    INNER JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE fi.branch_id = ${branchId}
      AND fi.status IN ('ALLOCATED', 'BOOKED')
      AND NOT EXISTS (
        SELECT 1
        FROM delivery_manifests dm2
        WHERE dm2.farm_inventory_id = fi.id
          AND COALESCE(dm2.delivery_status, 'PENDING') NOT IN ('DELIVERED', 'CANCELLED')
      )
    ORDER BY fi.eartag_id ASC
  `) as EligibleFarmAnimalRow[];
}

export async function listFarmInventoryIdsEligibleGlobally(): Promise<EligibleFarmAnimalRow[]> {
  const sql = getDb();
  return (await sql`
    SELECT
      fi.id,
      fi.branch_id AS "branchId",
      fi.eartag_id AS "eartagId",
      fi.generated_id AS "generatedId",
      oi.id AS "orderItemId",
      o.invoice_number AS "invoiceNumber",
      o.customer_name AS "customerName"
    FROM farm_inventories fi
    INNER JOIN order_items oi
      ON oi.id = COALESCE(
        fi.order_item_id,
        (SELECT ia.order_item_id FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id LIMIT 1)
      )
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE fi.status IN ('ALLOCATED', 'BOOKED')
      AND NOT EXISTS (
        SELECT 1
        FROM delivery_manifests dm2
        WHERE dm2.farm_inventory_id = fi.id
          AND COALESCE(dm2.delivery_status, 'PENDING') NOT IN ('DELIVERED', 'CANCELLED')
      )
    ORDER BY fi.branch_id ASC, fi.eartag_id ASC
  `) as EligibleFarmAnimalRow[];
}
