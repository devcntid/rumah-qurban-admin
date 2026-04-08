import { cookies } from "next/headers";

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

const COOKIE_NAME = "rq_admin_session";

export function decodeSession(raw: string): AdminSession | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<AdminSession>;
    if (
      !parsed ||
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.branchId !== "number"
    ) {
      return null;
    }
    return parsed as AdminSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export function encodeSession(session: AdminSession) {
  const json = JSON.stringify(session);
  return Buffer.from(json, "utf8").toString("base64url");
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export const sessionCookieName = COOKIE_NAME;

