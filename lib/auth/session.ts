import { getServerSession as getNextAuthSession } from "next-auth";
import { authOptions } from "@/lib/auth/next-auth";

export type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN_CABANG"
  | "FARM_TEAM"
  | "LOGISTICS_TEAM"
  | "SALES_VIEWER";

export type AdminSession = {
  name: string;
  role: AdminRole;
  branchId: number;
};

const ROLE_MAP: Record<string, AdminRole> = {
  SUPERADMIN: "SUPER_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN_BRANCH: "ADMIN_CABANG",
  ADMIN_CABANG: "ADMIN_CABANG",
  FARM_TEAM: "FARM_TEAM",
  LOGISTICS_TEAM: "LOGISTICS_TEAM",
  SALES_VIEWER: "SALES_VIEWER",
};

function normalizeRole(raw: string): AdminRole {
  return ROLE_MAP[raw] ?? (raw as AdminRole);
}

export async function getSession(): Promise<AdminSession | null> {
  const session = await getNextAuthSession(authOptions);
  
  if (!session || !session.user) {
    return null;
  }

  return {
    name: session.user.name,
    role: normalizeRole(session.user.role as string),
    branchId: session.user.branchId ?? 1,
  };
}

export async function requireAuth(): Promise<AdminSession> {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return session;
}
