import { getDb } from "@/lib/db/client";

export type BaseLog = {
  id: number;
  type: "PAYMENT" | "NOTIF" | "ZAINS";
  logType: string;
  referenceId: string | null;
  payload: any;
  response: any;
  createdAt: Date;
  status?: string;
};

export async function listGlobalLogs(limit = 50) {
  const sql = getDb();
  
  // Combine logs from different tables for a unified view
  const rows = await sql`
    (
      SELECT 
        id, 
        'PAYMENT' as type, 
        log_type as "logType", 
        reference_id as "referenceId", 
        payload, 
        response, 
        created_at as "createdAt",
        NULL as status
      FROM payment_logs
    )
    UNION ALL
    (
      SELECT 
        id, 
        'NOTIF' as type, 
        'WHATSAPP' as "logType", 
        target_number as "referenceId", 
        payload, 
        provider_response as response, 
        created_at as "createdAt",
        status
      FROM notif_logs
    )
    UNION ALL
    (
      SELECT 
        id, 
        'ZAINS' as type, 
        endpoint as "logType", 
        method as "referenceId", 
        payload, 
        response, 
        created_at as "createdAt",
        status_code::text as status
      FROM zains_logs
    )
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;

  return rows as unknown as BaseLog[];
}
