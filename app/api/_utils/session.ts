import { getSession } from "@/lib/auth/session";

export async function requireSession() {
  return getSession();
}

