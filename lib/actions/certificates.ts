"use server";

import { getSession } from "@/lib/auth/session";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import {
  getSlaughterCertificateData,
  updateCertificateUrl,
} from "@/lib/db/queries/slaughter-records";

export async function generateCertificateAction(
  slaughterRecordId: number
): Promise<{ success: boolean; certificateUrl?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const data = await getSlaughterCertificateData(slaughterRecordId);
    if (!data) {
      return { success: false, error: "Slaughter record not found" };
    }

    const participantName =
      data.participantNames.length > 0
        ? data.participantNames.join(" dan ")
        : data.customerName;

    const slaughterDate = new Date(data.slaughterDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const hijriYear = new Date().getFullYear() - 579;

    const photos = data.documentationPhotos.slice(0, 4);

    const html = generateCertificateHTML({
      participantName,
      slaughterDate,
      slaughterLocation: data.slaughterLocation || data.branchName,
      hijriYear,
      photos: photos.map((p) => p.url),
    });

    const certificateBlob = new Blob([html], { type: "text/html" });

    const blob = await put(
      `certificates/${slaughterRecordId}/certificate-${Date.now()}.html`,
      certificateBlob,
      { access: "public", contentType: "text/html" }
    );

    await updateCertificateUrl(slaughterRecordId, blob.url);

    revalidatePath("/orders");

    return { success: true, certificateUrl: blob.url };
  } catch (error) {
    console.error("Error generating certificate:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate certificate",
    };
  }
}

function generateCertificateHTML(data: {
  participantName: string;
  slaughterDate: string;
  slaughterLocation: string;
  hijriYear: number;
  photos: string[];
}): string {
  const photoGrid = data.photos
    .map(
      (url) => `
      <div style="width: 200px; height: 150px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Dokumentasi"/>
      </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Laporan Qurban Berbagi - ${data.participantName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .certificate {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    .header {
      background: linear-gradient(135deg, #102a43 0%, #1c3d5a 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .logo span { color: #4fd1c5; }
    .badge {
      background: #dc2626;
      color: white;
      display: inline-block;
      padding: 6px 20px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 15px 0;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      margin: 10px 0;
    }
    .title span {
      color: #4fd1c5;
      font-style: italic;
    }
    .subtitle {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      margin-top: 10px;
    }
    .recipient {
      padding: 25px;
      text-align: center;
      background: #f8fafc;
    }
    .recipient-name {
      font-size: 22px;
      font-weight: bold;
      color: #1e293b;
      border-bottom: 2px solid #102a43;
      display: inline-block;
      padding-bottom: 5px;
    }
    .info-section {
      padding: 20px 25px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
      font-size: 14px;
      color: #475569;
    }
    .info-icon {
      width: 20px;
      height: 20px;
      background: #e2e8f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .blessing {
      padding: 20px 25px;
      text-align: center;
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
      font-style: italic;
      background: linear-gradient(135deg, #fff9e6 0%, #fef3c7 100%);
    }
    .docs-section {
      padding: 25px;
    }
    .docs-title {
      text-align: center;
      background: #102a43;
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 14px;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    .photo-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
    }
    .signature-section {
      padding: 25px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .signature-name {
      font-weight: bold;
      color: #1e293b;
      margin-top: 10px;
    }
    .signature-role {
      color: #64748b;
      font-size: 12px;
    }
    .footer {
      background: #f1f5f9;
      padding: 15px;
      text-align: center;
    }
    .footer-text {
      font-size: 11px;
      color: #64748b;
    }
    .sponsors {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .sponsor {
      font-size: 10px;
      color: #94a3b8;
      background: white;
      padding: 5px 10px;
      border-radius: 4px;
    }
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">🕋 <span>rumah</span>qurban</div>
      <div class="badge">LAPORAN</div>
      <div class="title">Qurban <span>Berbagi</span></div>
      <div class="subtitle">Dipersembahkan Khusus Kepada :</div>
    </div>
    
    <div class="recipient">
      <div class="recipient-name">${escapeHtml(data.participantName)}</div>
    </div>
    
    <div class="info-section">
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-bottom: 15px;">
        Terima kasih telah memilih berqurban di Rumah Qurban
      </p>
      <div class="info-row">
        <div class="info-icon">📍</div>
        <span>${escapeHtml(data.slaughterLocation)}</span>
      </div>
      <div class="info-row">
        <div class="info-icon">📅</div>
        <span>${escapeHtml(data.slaughterDate)} - ${data.hijriYear} H</span>
      </div>
    </div>
    
    <div class="blessing">
      Semoga amal ibadah qurbannya diterima oleh Allah SWT dan senantiasa dirahmati dengan iman, ilmu, amal shaleh serta akhlak yang mulia, dan juga kebaikan di dunia dan akhirat. Aamiin.
    </div>
    
    ${
      data.photos.length > 0
        ? `
    <div class="docs-section">
      <div class="docs-title">DOKUMENTASI</div>
      <div class="photo-grid">
        ${photoGrid}
      </div>
    </div>
    `
        : ""
    }
    
    <div class="signature-section">
      <div style="font-size: 24px; color: #102a43;">✍️</div>
      <div class="signature-name">Edhu Enriadis Adilingga</div>
      <div class="signature-role">Project Leader Rumah Qurban</div>
    </div>
    
    <div class="footer">
      <div class="footer-text">Support by :</div>
      <div class="sponsors">
        <span class="sponsor">J&C Cookies</span>
        <span class="sponsor">Dakta TV</span>
        <span class="sponsor">Sharing Happiness</span>
        <span class="sponsor">INAGRI</span>
        <span class="sponsor">Rumah Wakaf</span>
        <span class="sponsor">Dakta Peduli</span>
      </div>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      if (window.location.search.includes('print=1')) {
        window.print();
      }
    };
  </script>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
