import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/api/_utils/session";
import { generateCertificateAction } from "@/lib/actions/certificates";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slaughterRecordId } = body;

    if (!slaughterRecordId || !Number.isFinite(slaughterRecordId)) {
      return NextResponse.json(
        { error: "slaughterRecordId is required" },
        { status: 400 }
      );
    }

    const result = await generateCertificateAction(slaughterRecordId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      certificateUrl: result.certificateUrl,
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    const message = error instanceof Error ? error.message : "Failed to generate certificate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
