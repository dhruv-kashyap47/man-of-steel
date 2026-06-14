import PDFDocument from "pdfkit";
import type { Report, Asset, Plant } from "@/types/database";

interface PDFReportData {
  report: Report;
  plant?: Plant;
  asset?: Asset;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ACCENT_COLOR = "#0891b2";
const ACCENT_LIGHT = "#e0f2fe";
const DARK_TEXT = "#0f172a";
const BODY_TEXT = "#334155";
const MUTED_TEXT = "#64748b";
const HEADER_BG = "#0f172a";

function drawHeaderBar(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, PAGE_WIDTH, 6).fill(ACCENT_COLOR);
}

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number, reportId: string) {
  const y = doc.page.height - 35;
  doc.rect(0, y - 10, PAGE_WIDTH, 45).fill("#f8fafc");
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();

  doc.fontSize(7).fillColor(MUTED_TEXT)
    .text("MAN OF STEEL ▸ Industrial Maintenance Intelligence Platform", MARGIN, y + 4, { align: "left", width: CONTENT_WIDTH * 0.6 })
    .text(`Page ${pageNum} of ${totalPages} ▸ ID: ${reportId.slice(0, 8)}`, MARGIN, y + 4, { align: "right", width: CONTENT_WIDTH });
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, icon?: string) {
  if (doc.y > 700) doc.addPage();
  doc.moveDown(0.8);
  doc.rect(MARGIN, doc.y - 2, 3, 16).fill(ACCENT_COLOR);
  doc.fontSize(12).fillColor(DARK_TEXT).font("Helvetica-Bold")
    .text(title, MARGIN + 12, doc.y - 2);
  doc.moveDown(0.6);
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor("#f1f5f9").lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

function drawBodyText(doc: PDFKit.PDFDocument, text: string, opts?: { indent?: number; bold?: boolean }) {
  doc.fontSize(9).fillColor(BODY_TEXT).font(opts?.bold ? "Helvetica-Bold" : "Helvetica")
    .text(text, MARGIN + (opts?.indent ?? 0), doc.y, { align: "justify", lineGap: 5, width: CONTENT_WIDTH - (opts?.indent ?? 0) });
  doc.moveDown(0.3);
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], startY: number, colWidths: number[], opts?: { headerColor?: string }): number {
  const rowHeight = 22;
  const headerH = 28;
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const x0 = MARGIN + (CONTENT_WIDTH - totalW) / 2;

  // Header
  const headerColor = opts?.headerColor ?? ACCENT_COLOR;
  doc.roundedRect(x0 - 4, startY, totalW + 8, headerH, 4).fill(headerColor);
  let cx = x0;
  headers.forEach((h, i) => {
    doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold")
      .text(h, cx + 6, startY + 8, { width: colWidths[i] - 4, align: "left" });
    cx += colWidths[i];
  });

  // Data rows
  let cy = startY + headerH + 2;
  rows.forEach((row, ri) => {
    if (cy + rowHeight > doc.page.height - 70) {
      doc.addPage();
      cy = MARGIN + 20;
    }
    if (ri % 2 === 1) {
      doc.rect(x0 - 4, cy, totalW + 8, rowHeight).fill("#f8fafc");
    }
    cx = x0;
    row.forEach((cell, ci) => {
      doc.fillColor(BODY_TEXT).fontSize(8).font("Helvetica")
        .text(cell, cx + 6, cy + 6, { width: colWidths[ci] - 4, align: "left" });
      cx += colWidths[ci];
    });
    cy += rowHeight;
    if (ri < rows.length - 1) {
      doc.moveTo(x0 - 4, cy).lineTo(x0 + totalW + 4, cy).strokeColor("#f1f5f9").lineWidth(0.3).stroke();
    }
  });

  const endY = cy + 8;
  doc.roundedRect(x0 - 4, startY, totalW + 8, endY - startY, 4).strokeColor("#e2e8f0").lineWidth(0.5).stroke();

  return endY;
}

export async function generateReportPDF(data: PDFReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { report, plant, asset } = data;
    const content = report.content as Record<string, unknown>;
    const pageCountRef: { current: number } = { current: 0 };

    // ═══════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════

    // Full background
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill("#f8fafc");
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT * 0.45).fill(HEADER_BG);

    // Accent stripe
    doc.rect(0, PAGE_HEIGHT * 0.45, PAGE_WIDTH, 4).fill(ACCENT_COLOR);

    // Top decorative line
    doc.rect(MARGIN, 60, CONTENT_WIDTH, 0.5).fillColor("#1e293b").fill();

    // Brand
    doc.fontSize(32).fillColor("#ffffff").font("Helvetica-Bold")
      .text("MAN OF STEEL", MARGIN, 80, { align: "center", width: CONTENT_WIDTH });
    doc.fontSize(11).fillColor("#94a3b8").font("Helvetica")
      .text("Industrial Maintenance Intelligence Platform", MARGIN, 118, { align: "center", width: CONTENT_WIDTH });

    // Bottom accent bar
    doc.rect(0, PAGE_HEIGHT * 0.45 + 4, PAGE_WIDTH, 1).fill(ACCENT_COLOR);

    // Report type badge
    const badgeColors: Record<string, string> = {
      incident: "#dc2626",
      maintenance: "#0891b2",
      executive_summary: "#7c3aed",
      priority: "#d97706",
      feedback_learning: "#059669",
      intelligence: "#0284c7",
    };
    const badgeColor = badgeColors[report.report_type] ?? ACCENT_COLOR;
    doc.roundedRect(PAGE_WIDTH / 2 - 80, 170, 160, 28, 14).fill(badgeColor);
    doc.fontSize(10).fillColor("#ffffff").font("Helvetica-Bold")
      .text(report.report_type.replace(/_/g, " ").toUpperCase(), PAGE_WIDTH / 2 - 70, 177, { align: "center", width: 140 });

    // Title
    doc.fontSize(20).fillColor(DARK_TEXT).font("Helvetica-Bold")
      .text(report.title, MARGIN, 230, { align: "center", width: CONTENT_WIDTH });

    // Info box
    const infoY = 290;
    doc.roundedRect(MARGIN + 30, infoY, CONTENT_WIDTH - 60, 90, 6).fill("#ffffff").strokeColor("#e2e8f0").lineWidth(0.5).stroke();

    const infoLines = [
      `Plant: ${plant?.name ?? "Tata Steel Integrated Plant"}`,
      `Location: ${plant?.location ?? "Jamshedpur, Jharkhand"}${asset ? `  |  Asset: ${asset.name}` : ""}`,
      `Generated: ${new Date(report.created_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      `Report ID: ${report.id.slice(0, 8).toUpperCase()}  |  Generated By: ${report.generated_by}`,
    ];

    doc.fontSize(9).fillColor(BODY_TEXT).font("Helvetica");
    infoLines.forEach((line, i) => {
      doc.text(line, MARGIN + 48, infoY + 14 + i * 19);
    });

    // Decorative bottom
    doc.rect(MARGIN, PAGE_HEIGHT - 80, CONTENT_WIDTH, 0.5).fillColor("#e2e8f0").fill();
    doc.fontSize(7).fillColor(MUTED_TEXT).font("Helvetica")
      .text("CONFIDENTIAL ▸ This report contains proprietary information", MARGIN, PAGE_HEIGHT - 72, { align: "center", width: CONTENT_WIDTH });

    doc.addPage();

    // ═══════════════════════════════════════════
    // MAIN CONTENT
    // ═══════════════════════════════════════════

    drawHeaderBar(doc);

    // Title block
    doc.fontSize(16).fillColor(DARK_TEXT).font("Helvetica-Bold").text(report.title, MARGIN, 28);
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor(MUTED_TEXT).font("Helvetica")
      .text(`Generated: ${new Date(report.created_at).toLocaleString()}  |  Type: ${report.report_type.replace(/_/g, " ").toUpperCase()}  |  By: ${report.generated_by}`, MARGIN, doc.y);
    if (plant) doc.text(`Plant: ${plant.name}  |  ${plant.location}`);
    if (asset) doc.text(`Asset: ${asset.name} (${asset.serial_number})`);
    doc.moveDown(0.8);

    // Divider
    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    // Executive Summary with accent box
    if (content.executiveSummary) {
      const summaryY = doc.y;
      doc.roundedRect(MARGIN, summaryY, CONTENT_WIDTH, 50, 4).fill(ACCENT_LIGHT);
      doc.rect(MARGIN, summaryY, 4, 50).fill(ACCENT_COLOR);
      doc.fontSize(10).fillColor(DARK_TEXT).font("Helvetica-Bold").text("Executive Summary", MARGIN + 14, summaryY + 6);
      doc.fontSize(9).fillColor(BODY_TEXT).font("Helvetica")
        .text(String(content.executiveSummary), MARGIN + 14, summaryY + 22, { align: "justify", width: CONTENT_WIDTH - 28, lineGap: 3 });
      doc.y = summaryY + 60;
      doc.moveDown(0.5);
    }

    // Sections
    const sections = (content.sections as Array<{ title: string; body: string }>) ?? [];
    sections.forEach((section) => {
      drawSectionTitle(doc, section.title);
      drawBodyText(doc, section.body);
    });

    // Metrics table
    if (content.metrics) {
      drawSectionTitle(doc, "Key Metrics");

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
        rows.push([
          left[0]?.toString() ?? "",
          String(left[1] ?? ""),
          right[0]?.toString() ?? "",
          String(right[1] ?? ""),
        ]);
      }

      doc.y = drawTable(doc, ["Metric", "Value", "Metric", "Value"], rows, doc.y + 4, [120, 105, 120, 105], { headerColor: ACCENT_COLOR }) + 8;
    }

    // Recommendations
    if (content.recommendations) {
      drawSectionTitle(doc, "Recommendations & Actions");
      const recs = content.recommendations as string[];
      recs.forEach((rec, i) => {
        if (doc.y > 720) doc.addPage();
        const isUrgent = rec.startsWith("IMMEDIATE") || rec.startsWith("URGENT") || rec.startsWith("PRIORITY");
        const prefix = isUrgent ? "" : `${i + 1}. `;

        // Priority badges for urgent items
        if (isUrgent) {
          const badgeColors: Record<string, string[]> = {
            IMMEDIATE: ["#dc2626", "#fef2f2"],
            URGENT: ["#dc2626", "#fef2f2"],
            PRIORITY: ["#d97706", "#fffbeb"],
          };
          const key = Object.keys(badgeColors).find((k) => rec.startsWith(k)) ?? "PRIORITY";
          const [bg, textBg] = badgeColors[key];
          const badgeY = doc.y;

          doc.roundedRect(MARGIN + 6, badgeY, 60, 14, 7).fill(bg);
          doc.fontSize(7).fillColor("#ffffff").font("Helvetica-Bold").text(key, MARGIN + 10, badgeY + 3, { width: 52, align: "center" });
          doc.fontSize(9).fillColor(BODY_TEXT).font("Helvetica").text(rec.slice(key.length + 1), MARGIN + 72, badgeY, { lineGap: 3, width: CONTENT_WIDTH - 80 });
          doc.y = badgeY + 18;
        } else {
          doc.roundedRect(MARGIN + 6, doc.y - 1, 14, 14, 7).fill("#f8fafc").strokeColor("#e2e8f0").lineWidth(0.5).stroke();
          doc.fillColor(ACCENT_COLOR).fontSize(8).font("Helvetica-Bold").text(`${i + 1}`, MARGIN + 10, doc.y + 1, { width: 14, align: "center" });
          doc.fillColor(BODY_TEXT).fontSize(9).font("Helvetica").text(rec, MARGIN + 26, doc.y - 1, { lineGap: 3, width: CONTENT_WIDTH - 34 });
          doc.moveDown(0.6);
        }
      });
    }

    // ═══════════════════════════════════════════
    // FOOTER + PAGE NUMBERS
    // ═══════════════════════════════════════════

    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      // Pages after cover get header bar and footer
      if (i > 0) {
        drawHeaderBar(doc);
        drawFooter(doc, i, totalPages - 1, report.id);
      }
    }

    doc.end();
  });
}