import PDFDocument from "pdfkit";
import type { Report, Asset, Plant } from "@/types/database";

interface PDFReportData {
  report: Report;
  plant?: Plant;
  asset?: Asset;
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], startX: number, startY: number, colWidths: number[]) {
  const rowHeight = 18;
  const headerBg = "#1e4d7b";
  const altRowBg = "#f1f5f9";

  // Header row
  doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(headerBg);
  let x = startX;
  headers.forEach((h, i) => {
    doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(h, x + 4, startY + 5, { width: colWidths[i], align: "left" });
    x += colWidths[i];
  });

  // Data rows
  rows.forEach((row, ri) => {
    const y = startY + rowHeight + ri * rowHeight;
    if (ri % 2 === 1) {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(altRowBg);
    }
    x = startX;
    row.forEach((cell, ci) => {
      doc.fillColor("#334155").fontSize(8).font("Helvetica").text(cell, x + 4, y + 5, { width: colWidths[ci], align: "left" });
      x += colWidths[ci];
    });
  });

  return startY + rowHeight + rows.length * rowHeight + 10;
}

export async function generateReportPDF(data: PDFReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { report, plant, asset } = data;
    const content = report.content as Record<string, unknown>;

    // Header with accent bar
    doc
      .rect(0, 0, doc.page.width, 8)
      .fill("#06b6d4");
    doc
      .fontSize(22)
      .fillColor("#1e4d7b")
      .text("MAN OF STEEL", { align: "center" });
    doc
      .fontSize(9)
      .fillColor("#64748b")
      .text("Integrated Plant Monitoring & Predictive Intelligence", { align: "center" });
    doc.moveDown(0.3);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor("#06b6d4")
      .lineWidth(1.5)
      .stroke();
    doc.moveDown(0.8);

    // Title block
    doc.fontSize(14).fillColor("#0f172a").text(report.title, { align: "left" });
    doc.moveDown(0.2);
    doc
      .fontSize(8)
      .fillColor("#64748b")
      .text(`Generated: ${new Date(report.created_at).toLocaleString()}  |  Type: ${report.report_type.replace("_", " ").toUpperCase()}  |  By: ${report.generated_by}`);
    if (plant) doc.text(`Plant: ${plant.name} — ${plant.location}`);
    if (asset) doc.text(`Asset: ${asset.name} (${asset.serial_number})`);
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").stroke();
    doc.moveDown(0.8);

    // Executive Summary with box
    if (content.executiveSummary) {
      const summaryY = doc.y;
      doc.roundedRect(50, summaryY, 495, 55, 4).strokeColor("#06b6d4").lineWidth(0.5).stroke();
      doc.rect(50, summaryY, 4, 55).fill("#06b6d4");
      doc.fillColor("#1e4d7b").fontSize(10).font("Helvetica-Bold").text("Executive Summary", 62, summaryY + 6);
      doc.fillColor("#334155").fontSize(9).font("Helvetica").text(String(content.executiveSummary), 62, summaryY + 22, { align: "justify", width: 475, lineGap: 3 });
      doc.y = summaryY + 65;
      doc.moveDown(0.5);
    }

    // Sections
    const sections = (content.sections as Array<{ title: string; body: string }>) ?? [];
    sections.forEach((section) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(11).fillColor("#1e4d7b").font("Helvetica-Bold").text(section.title);
      doc.moveDown(0.2);
      doc.fontSize(9).fillColor("#334155").font("Helvetica").text(section.body, { align: "justify", lineGap: 4 });
      doc.moveDown(0.6);
    });

    // Metrics table
    if (content.metrics) {
      if (doc.y > 680) doc.addPage();
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#1e4d7b").font("Helvetica-Bold").text("Key Metrics");
      doc.moveDown(0.3);

      const metrics = content.metrics as Record<string, string | number>;
      const entries = Object.entries(metrics);
      const mid = Math.ceil(entries.length / 2);
      const leftCol = entries.slice(0, mid);
      const rightCol = entries.slice(mid);

      const rows: string[][] = [];
      const maxLen = Math.max(leftCol.length, rightCol.length);
      for (let i = 0; i < maxLen; i++) {
        const left = leftCol[i] ?? ["", ""];
        const right = rightCol[i] ?? ["", ""];
        rows.push([left[0], String(left[1]), right[0], String(right[1])]);
      }

      doc.y = drawTable(
        doc,
        ["Metric", "Value", "Metric", "Value"],
        rows,
        50, doc.y,
        [120, 105, 120, 105]
      );
    }

    // Recommendations
    if (content.recommendations) {
      if (doc.y > 700) doc.addPage();
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#1e4d7b").font("Helvetica-Bold").text("Recommendations");
      doc.moveDown(0.3);
      const recs = content.recommendations as string[];
      recs.forEach((rec, i) => {
        const prefix = rec.startsWith("IMMEDIATE") || rec.startsWith("PRIORITY") || rec.startsWith("REVIEW") ? "" : `${i + 1}. `;
        doc.fontSize(9).fillColor("#334155").font("Helvetica").text(`${prefix}${rec}`, { indent: 10, lineGap: 3 });
        doc.moveDown(0.2);
      });
    }

    // Footer
    const footerY = doc.page.height - 40;
    doc
      .fontSize(7)
      .fillColor("#94a3b8")
      .text(
        "MAN OF STEEL — Industrial Maintenance Intelligence Platform | Confidential",
        50,
        footerY,
        { align: "center", width: 495 }
      );
    doc
      .fontSize(6)
      .fillColor("#cbd5e1")
      .text(
        `Report ID: ${report.id} | Page 1 of 1`,
        50,
        footerY - 12,
        { align: "center", width: 495 }
      );

    doc.end();
  });
}
