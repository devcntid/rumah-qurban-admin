import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const { orderItemId: rawId } = await params;
    const orderItemId = Number(rawId);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const species = searchParams.get("species") || "";
    const branchId = searchParams.get("branchId") || "";
    const vendorId = searchParams.get("vendorId") || "";
    const classGrade = searchParams.get("classGrade") || "";
    const hornType = searchParams.get("hornType") || "";

    const sql = getDb();

    const orderContext = (await sql`
      SELECT co.animal_variant_id, o.branch_id
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN catalog_offers co ON co.id = oi.catalog_offer_id
      WHERE oi.id = ${orderItemId}
    `) as { animal_variant_id: number | null; branch_id: number }[];

    const suggestedVariantId = orderContext[0]?.animal_variant_id ?? null;
    const suggestedBranchId = orderContext[0]?.branch_id ?? null;

    const searchPattern = `%${search}%`;

    const items = await sql`
      SELECT
        fi.id,
        fi.generated_id as "generatedId",
        fi.farm_animal_id as "farmAnimalId",
        fi.eartag_id as "eartagId",
        fi.animal_variant_id as "animalVariantId",
        fi.branch_id as "branchId",
        fi.vendor_id as "vendorId",
        fi.horn_type as "hornType",
        fi.weight_actual as "weightActual",
        fi.photo_url as "photoUrl",
        fi.status,
        av.species,
        av.class_grade as "classGrade",
        av.weight_range as "weightRange",
        v.name as "vendorName",
        b.name as "branchName",
        CASE
          WHEN fi.animal_variant_id = ${suggestedVariantId}
           AND fi.branch_id = ${suggestedBranchId}
          THEN true ELSE false
        END as "isRecommended"
      FROM farm_inventories fi
      LEFT JOIN animal_variants av ON av.id = fi.animal_variant_id
      LEFT JOIN vendors v ON v.id = fi.vendor_id
      LEFT JOIN branches b ON b.id = fi.branch_id
      WHERE fi.status = 'AVAILABLE'
        AND fi.order_item_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM inventory_allocations ia WHERE ia.farm_inventory_id = fi.id
        )
        AND (${search === ""} OR fi.eartag_id ILIKE ${searchPattern} OR fi.farm_animal_id ILIKE ${searchPattern} OR fi.generated_id ILIKE ${searchPattern})
        AND (${species === ""} OR av.species = ${species})
        AND (${branchId === ""} OR fi.branch_id = ${branchId === "" ? 0 : Number(branchId)})
        AND (${vendorId === ""} OR fi.vendor_id = ${vendorId === "" ? 0 : Number(vendorId)})
        AND (${classGrade === ""} OR av.class_grade = ${classGrade})
        AND (${hornType === ""} OR fi.horn_type = ${hornType})
      ORDER BY
        CASE
          WHEN fi.animal_variant_id = ${suggestedVariantId}
           AND fi.branch_id = ${suggestedBranchId}
          THEN 0 ELSE 1
        END,
        fi.eartag_id ASC
      LIMIT 200
    `;

    const filterOptions = await sql`
      SELECT DISTINCT
        av.species,
        av.class_grade as "classGrade"
      FROM farm_inventories fi
      LEFT JOIN animal_variants av ON av.id = fi.animal_variant_id
      WHERE fi.status = 'AVAILABLE' AND fi.order_item_id IS NULL
        AND av.species IS NOT NULL
      ORDER BY av.species, av.class_grade
    `;

    const vendorOptions = await sql`
      SELECT DISTINCT v.id, v.name
      FROM farm_inventories fi
      JOIN vendors v ON v.id = fi.vendor_id
      WHERE fi.status = 'AVAILABLE' AND fi.order_item_id IS NULL
      ORDER BY v.name
    `;

    const branchOptions = await sql`
      SELECT DISTINCT b.id, b.name
      FROM farm_inventories fi
      JOIN branches b ON b.id = fi.branch_id
      WHERE fi.status = 'AVAILABLE' AND fi.order_item_id IS NULL
      ORDER BY b.name
    `;

    return NextResponse.json({
      animals: items,
      filters: {
        species: [...new Set((filterOptions as any[]).map((r: any) => r.species).filter(Boolean))],
        classGrades: [...new Set((filterOptions as any[]).map((r: any) => r.classGrade).filter(Boolean))],
        vendors: vendorOptions,
        branches: branchOptions,
      },
      context: {
        suggestedVariantId,
        suggestedBranchId,
      },
    });
  } catch (error) {
    console.error("API Available Animals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
