/**
 * Converts numbers into Indonesian word representation (Terbilang)
 */
export function terbilang(n: number): string {
  if (n < 0) return "minus " + terbilang(Math.abs(n));
  if (n === 0) return "nol";

  function helper(val: number): string {
    const units = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
    let res = "";

    if (val < 12) {
      res = units[val];
    } else if (val < 20) {
      res = helper(val - 10) + " belas";
    } else if (val < 100) {
      res = helper(Math.floor(val / 10)) + " puluh " + helper(val % 10);
    } else if (val < 200) {
      res = "seratus " + helper(val - 100);
    } else if (val < 1000) {
      res = helper(Math.floor(val / 100)) + " ratus " + helper(val % 100);
    } else if (val < 2000) {
      res = "seribu " + helper(val - 1000);
    } else if (val < 1000000) {
      res = helper(Math.floor(val / 1000)) + " ribu " + helper(val % 1000);
    } else if (val < 1000000000) {
      res = helper(Math.floor(val / 1000000)) + " juta " + helper(val % 1000000);
    } else if (val < 1000000000000) {
      res = helper(Math.floor(val / 1000000000)) + " milyar " + helper(val % 1000000000);
    } else {
      res = helper(Math.floor(val / 1000000000000)) + " triliun " + helper(val % 1000000000000);
    }
    return res;
  }

  return helper(n).replace(/\s+/g, " ").trim();
}

/**
 * Format currency with IDR prefix
 */
export function formatIDR(val: number | string) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);
}
