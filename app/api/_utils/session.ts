import { cookies } from "next/headers";
import { decodeSession, sessionCookieName } from "@/lib/auth/session";

export async function requireSession() {
  const store = await cookies();
  const raw = store.get(sessionCookieName)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

