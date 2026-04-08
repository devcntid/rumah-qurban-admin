export function asString(
  v: string | string[] | undefined,
  maxLen = 200
): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return undefined;
  return s.slice(0, maxLen);
}

export function asNumber(v: string | string[] | undefined) {
  if (typeof v !== "string") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function asDate(v: string | string[] | undefined) {
  const s = asString(v, 32);
  if (!s) return undefined;
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return s;
}

