import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import * as XLSX from "xlsx";

dotenv.config({ path: ".env.local" });

type Row = {
  cabang?: string;
  produk?: string;
  "url gambar"?: string;
  "jenis hewan"?: string;
  "kelas hewan"?: string;
  Type?: string;
  "nama hewan"?: string;
  harga?: string | number;
  berat?: string;
  "proyeksi berat akhir"?: string | number;
  "id hewan"?: string | number;
  lokasi?: string;
  vendor?: string;
};

function asText(v: unknown) {
  if (v == null) return "";
  return String(v).trim();
}

function parsePrice(v: unknown) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = asText(v);
  if (!s) return null;
  const cleaned = s
    .replace(/rp/gi, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function productCodeFromLabel(produk: string): string {
  const p = produk.toLowerCase();
  if (p.includes("kaleng")) return "QK";
  if (p.includes("berbagi")) return "QB";
  return "QA";
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const xlsxPath =
    process.env.CATALOG_XLSX_PATH ||
    "/Users/muhammadirvan/Downloads/Qurban (2).xlsx";

  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`File not found: ${xlsxPath}`);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in workbook");
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });

  const sql = neon(url);

  await sql`BEGIN`;
  try {
    for (const r of raw) {
      const branchName = asText(r.cabang);
      if (branchName) {
        await sql`
          INSERT INTO branches (name)
          VALUES (${branchName})
          ON CONFLICT (name) DO NOTHING
        `;
      }
      const vendorName = asText(r.vendor);
      if (vendorName) {
        await sql`
          INSERT INTO vendors (name)
          VALUES (${vendorName})
          ON CONFLICT (name) DO NOTHING
        `;
      }
    }

    const branches = (await sql`
      SELECT id, name FROM branches
    `) as unknown as { id: number; name: string }[];
    const vendors = (await sql`
      SELECT id, name FROM vendors
    `) as unknown as { id: number; name: string }[];
    const branchByName = new Map(branches.map((b) => [b.name.toLowerCase(), b.id] as const));
    const vendorByName = new Map(vendors.map((v) => [v.name.toLowerCase(), v.id] as const));

    let inserted = 0;
    for (const r of raw) {
      const branchName = asText(r.cabang);
      const produkLabel = asText(r.produk);
      if (!produkLabel) continue;

      const code = productCodeFromLabel(produkLabel);
      const [prod] = await sql`
        SELECT id FROM products WHERE code = ${code} LIMIT 1
      `;
      if (!prod) continue;
      const productId = (prod as { id: number }).id;

      const branchId = branchName ? branchByName.get(branchName.toLowerCase()) ?? null : null;
      const vendorName = asText(r.vendor);
      const vendorId = vendorName
        ? vendorByName.get(vendorName.toLowerCase()) ?? null
        : null;

      const species = asText(r["jenis hewan"]) || "Lainnya";
      const classGrade = asText(r["kelas hewan"]) || null;
      const weightRange = asText(r.berat) || null;
      const subType = asText(r.Type) || null;
      const displayName = asText(r["nama hewan"]) || produkLabel;
      const skuCode = asText(r["id hewan"]) || null;
      const projectedWeight =
        typeof r["proyeksi berat akhir"] === "number"
          ? String(r["proyeksi berat akhir"])
          : asText(r["proyeksi berat akhir"]) || null;
      const imageUrl = asText(r["url gambar"]) || null;
      const price = parsePrice(r.harga);
      if (price == null) continue;

      const [existingVar] = await sql`
        SELECT id FROM animal_variants
        WHERE species = ${species}
          AND COALESCE(class_grade, '') = COALESCE(${classGrade ?? ""}, '')
          AND COALESCE(weight_range, '') = COALESCE(${weightRange ?? ""}, '')
        LIMIT 1
      `;
      let animalVariantId: number;
      if (existingVar) {
        animalVariantId = (existingVar as { id: number }).id;
      } else {
        const [ins] = await sql`
          INSERT INTO animal_variants (species, class_grade, weight_range)
          VALUES (${species}, ${classGrade}, ${weightRange})
          RETURNING id
        `;
        animalVariantId = (ins as { id: number }).id;
      }

      await sql`
        INSERT INTO catalog_offers (
          product_id, animal_variant_id, branch_id, vendor_id,
          display_name, sub_type, sku_code, projected_weight, price, image_url, is_active
        ) VALUES (
          ${productId}, ${animalVariantId}, ${branchId}, ${vendorId},
          ${displayName}, ${subType}, ${skuCode}, ${projectedWeight}, ${price}, ${imageUrl}, TRUE
        )
        ON CONFLICT (product_id, animal_variant_id, branch_id, sub_type) DO UPDATE SET
          vendor_id = EXCLUDED.vendor_id,
          display_name = EXCLUDED.display_name,
          sku_code = EXCLUDED.sku_code,
          projected_weight = EXCLUDED.projected_weight,
          price = EXCLUDED.price,
          image_url = EXCLUDED.image_url,
          is_active = EXCLUDED.is_active
      `;
      inserted += 1;
    }

    await sql`COMMIT`;
    // eslint-disable-next-line no-console
    console.log(
      `Catalog import complete: ${inserted} row(s) from ${path.basename(xlsxPath)} (sheet: ${sheetName}).`
    );
  } catch (e) {
    await sql`ROLLBACK`;
    throw e;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
