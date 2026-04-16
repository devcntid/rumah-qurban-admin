import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { getSlaughterCertificateData } from "@/lib/db/queries/slaughter-records";
import { getSession } from "@/lib/auth/session";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import React from "react";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const slaughterRecordId = parseInt(id);

    if (!Number.isFinite(slaughterRecordId) || slaughterRecordId <= 0) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const data = await getSlaughterCertificateData(slaughterRecordId);
    if (!data) {
      return new NextResponse("Slaughter record not found", { status: 404 });
    }

    const mainName =
      data.participantNames.length > 0
        ? data.participantNames.join(" dan ")
        : data.customerName;

    const slaughterDate = new Date(data.slaughterDate).toLocaleDateString(
      "id-ID",
      { day: "numeric", month: "long", year: "numeric" }
    );

    const hijriYear = new Date().getFullYear() - 579;
    const photos = data.documentationPhotos.slice(0, 4).map((p) => p.url);
    const logoPath = path.join(process.cwd(), "public", "logo-agro.png");

    const stream = await renderToStream(
      React.createElement(CertificateTemplate, {
        mainName,
        customerName: data.customerName,
        participantNames: data.participantNames,
        slaughterDate,
        slaughterLocation: data.slaughterLocation || data.branchName,
        hijriYear,
        photos,
        logoPath,
      }) as any
    );

    const safeName = mainName.replace(/[^a-zA-Z0-9\s-]/g, "").trim();

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Sertifikat Qurban - ${safeName}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Certificate PDF generation error:", error);
    return new NextResponse("Internal Server Error: " + error.message, {
      status: 500,
    });
  }
}
