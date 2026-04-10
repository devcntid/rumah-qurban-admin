export function generateAlphanumericId(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking chars like 0/O, 1/I
  let res = "";
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}
