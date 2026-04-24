import { NextResponse } from "next/server";

/** Neon / Postgres sering menyertakan `code` (mis. 23503 = FK). */
function pgCode(err: unknown): string {
  if (typeof err !== "object" || err === null || !("code" in err)) return "";
  return String((err as { code: unknown }).code);
}

export function toPublicErrorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server";
  const code = pgCode(err);
  const status =
    code === "23503" || code === "23505"
      ? 409
      : code === "22P02" || code === "23514"
        ? 400
        : 500;
  return NextResponse.json({ error: message }, { status });
}
