import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { getOrderWithItems } from "@/lib/db/queries/orders";
import { getBranchById } from "@/lib/db/queries/master";
import { getSession } from "@/lib/auth/session";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
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
    const orderId = parseInt(id);
    
    // Since it's an admin panel, we might need a way to verify branch access
    // For now, using the branch from session
    const data = await getOrderWithItems(orderId, session.branchId);

    if (!data) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const branch = data.order.branchId ? await getBranchById(data.order.branchId) : null;
    const logoPath = path.join(process.cwd(), "public", "logo-agro.png");

    // Render the React component to a PDF stream
    const stream = await renderToStream(
      React.createElement(InvoiceTemplate, {
        order: data.order,
        items: data.items,
        participants: data.participants,
        branch: branch,
        logoPath: logoPath,
      }) as any
    );

    // Convert stream to response
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${data.order.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new NextResponse("Internal Server Error: " + error.message, { status: 500 });
  }
}
