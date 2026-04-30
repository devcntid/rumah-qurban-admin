export function normalizePhoneNumber(
  phone: string | number | null | undefined
): string | null {
  if (phone === null || phone === undefined) return null;

  const raw =
    typeof phone === "number"
      ? Number.isFinite(phone)
        ? String(Math.round(phone))
        : ""
      : String(phone).trim();
  if (!raw) return null;

  // Remove all non-digit characters
  let normalized = raw.replace(/\D/g, "");
  
  // Convert 08xxx to 628xxx
  if (normalized.startsWith("08")) {
    normalized = "62" + normalized.slice(1);
  }
  
  // Ensure starts with 62
  if (!normalized.startsWith("62")) {
    normalized = "62" + normalized;
  }
  
  // Validate length (Indonesian phone numbers)
  if (normalized.length < 10 || normalized.length > 15) {
    return null;
  }
  
  return normalized;
}
