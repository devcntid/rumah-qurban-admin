export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");
  
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
