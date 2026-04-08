import PDFDocument from "pdfkit";
import path from "path";

const NAVY = "#1C2D49";
const ORANGE = "#F6A54B";
const CREAM = "#F2F0EB";
const WHITE = "#FFFFFF";
const DARK = "#1A1A1A";
const GREY = "#6B7280";

function labelToScore(label: string): number {
  return label === "laag" ? 2 : label === "midden" ? 5 : 8;
}

function computeCompliancePercent(domains: any[], durModule: any): number {
  const d1 = labelToScore(domains?.[0]?.scoreLabel ?? "midden");
  const d2 = labelToScore(domains?.[1]?.scoreLabel ?? "midden");
  const d3 = labelToScore(domains?.[2]?.scoreLabel ?? "midden");
  const dur = durModule?.durationRiskScore ?? 0;
  const weighted = d1 * 0.40 + d2 * 0.35 + d3 * 0.10 + dur * 0.15;
  return Math.max(5, Math.min(95, Math.round((1 - weighted / 10) * 100)));
}

function riskLabelNL(label: string | null | undefined): string {
  if (label === "laag") return "Laag risico";
  if (label === "hoog") return "Hoog risico";
  return "Gemiddeld risico";
}

function riskColor(label: string | null | undefined): string {
  if (label === "laag") return "#22C55E";
  if (label === "hoog") return "#EF4444";
  return "#F59E0B";
}

function truncate(s: string | null | undefined, maxChars = 900): string {
  const t = (s ?? "").trim();
  return t.length > maxChars ? t.slice(0, maxChars).trimEnd() + "\u2026" : t;
}

interface CompactDraftJson {
  title?: string;
  assignmentDescription?: string;
  deliverables?: string[];
  executionAndSteering?: string;
  structuralNote?: string;
}

interface LongDraftJson {
  title?: string;
  assignmentDescription?: string;
  deliverables?: string[];
  acceptanceCriteria?: string[];
  scopeExclusions?: string[];
  executionAndSteering?: string;
  structuralNote?: string;
}

function parseDraftJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return (parsed && typeof parsed === "object") ? parsed as T : null;
  } catch {
    return null;
  }
}

function formatCompactDraft(draft: CompactDraftJson): string {
  const parts: string[] = [];
  if (draft.title) parts.push(`\u25B6 ${draft.title}`);
  if (draft.assignmentDescription) parts.push(draft.assignmentDescription);
  if (draft.deliverables?.length) {
    parts.push("Opleveringen:");
    draft.deliverables.forEach(d => parts.push(`\u2022 ${d}`));
  }
  if (draft.executionAndSteering) parts.push(draft.executionAndSteering);
  if (draft.structuralNote) parts.push(`Let op: ${draft.structuralNote}`);
  return parts.join("\n\n");
}

function formatLongDraft(draft: LongDraftJson): string {
  const parts: string[] = [];
  if (draft.title) parts.push(`\u25B6 ${draft.title}`);
  if (draft.assignmentDescription) parts.push(draft.assignmentDescription);
  if (draft.deliverables?.length) {
    parts.push("Opleveringen:");
    draft.deliverables.forEach(d => parts.push(`\u2022 ${d}`));
  }
  if (draft.acceptanceCriteria?.length) {
    parts.push("Acceptatiecriteria:");
    draft.acceptanceCriteria.forEach(c => parts.push(`\u2022 ${c}`));
  }
  if (draft.scopeExclusions?.length) {
    parts.push("Buiten scope:");
    draft.scopeExclusions.forEach(s => parts.push(`\u2022 ${s}`));
  }
  if (draft.executionAndSteering) parts.push(draft.executionAndSteering);
  if (draft.structuralNote) parts.push(`Let op: ${draft.structuralNote}`);
  return parts.join("\n\n");
}

interface AssessmentForPDF {
  id: string;
  inputText: string;
  overallRiskLabel?: string | null;
  overallSummary?: string | null;
  compactAssignmentDraft?: string | null;
  optimizedBrief?: string | null;
  domains?: any[] | null;
  engagementDurationModule?: any | null;
  createdAt: string | Date;
}

export function generateAssessmentPDF(assessment: AssessmentForPDF): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 40, left: 0, right: 0 },
    info: { Title: "DBA Risicoanalyse \u2014 DBA Kompas", Author: "DBA Kompas" },
  });

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 40;
  const COL_GAP = 20;
  const COL_W = (PAGE_W - MARGIN * 2 - COL_GAP) / 2;

  const leftX = MARGIN;
  const rightX = MARGIN + COL_W + COL_GAP;

  // 1. HEADER
  const HEADER_H = 110;
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(NAVY);

  const logoPath = path.join(process.cwd(), "public/dba-kompas-logo.png");
  try {
    doc.image(logoPath, MARGIN, 18, { height: 60 });
  } catch {
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(14)
      .text("DBA Kompas", MARGIN, 30);
  }

  const titleX = PAGE_W - MARGIN - 350;
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(26)
    .text("DBA risicoanalyse", titleX, 22, { width: 350, align: "right" });

  doc.fillColor("#B0BFCF").font("Helvetica").fontSize(9)
    .text("Indicatieve DBA risico-inschatting (geen juridisch advies)", titleX, 58, {
      width: 350, align: "right",
    });

  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11)
    .text("DBA Kompas", MARGIN, 84, { width: 120 });

  // 2. DATE + ID strip
  const STRIP_Y = HEADER_H;
  const STRIP_H = 26;
  doc.rect(0, STRIP_Y, PAGE_W, STRIP_H).fill("#EEF0F3");

  const created = new Date(assessment.createdAt).toLocaleDateString("nl-NL", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.fillColor(GREY).font("Helvetica").fontSize(8)
    .text(`Gegenereerd op: ${created}   |   Referentie: ${assessment.id.slice(0, 8).toUpperCase()}`,
      MARGIN, STRIP_Y + 8, { width: PAGE_W - MARGIN * 2, align: "left" });

  // 3. SCORE + SUMMARY row
  let y = STRIP_Y + STRIP_H + 20;

  doc.rect(0, STRIP_Y + STRIP_H, PAGE_W, PAGE_H - STRIP_Y - STRIP_H).fill(CREAM);

  const sectionLabel = (text: string, x: number, yPos: number): number => {
    doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(10)
      .text(text, x, yPos, { width: COL_W });
    const labelW = Math.min(text.length * 6.2, COL_W);
    doc.moveTo(x, yPos + 13).lineTo(x + labelW, yPos + 13)
      .strokeColor(ORANGE).lineWidth(1.5).stroke();
    return yPos + 20;
  };

  // LEFT: Scorekaart
  const scoreStartY = y;
  let lY = sectionLabel("Scorekaart", leftX, scoreStartY);

  const domains = assessment.domains ?? [];
  const dur = assessment.engagementDurationModule;
  const hasDomains = domains.length > 0;
  const percent = hasDomains ? computeCompliancePercent(domains, dur) : null;
  const rlabel = assessment.overallRiskLabel;

  if (percent !== null) {
    const circleX = leftX + 30;
    const circleY = lY + 5;
    const R = 28;
    const scoreCol = percent >= 65 ? "#22C55E" : percent >= 40 ? "#F59E0B" : "#EF4444";
    doc.circle(circleX + R, circleY + R, R).fillAndStroke(scoreCol, scoreCol);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(18)
      .text(`${percent}`, circleX, circleY + 10, { width: R * 2, align: "center" });
    doc.fillColor(WHITE).font("Helvetica").fontSize(8)
      .text("%", circleX, circleY + 30, { width: R * 2, align: "center" });
    lY = circleY + R * 2 + 12;
  }

  const rlNL = riskLabelNL(rlabel);
  const rlCol = riskColor(rlabel);
  doc.fillColor(rlCol).font("Helvetica-Bold").fontSize(13)
    .text(rlNL, leftX, lY, { width: COL_W });
  lY = doc.y + 6;

  if (hasDomains) {
    domains.slice(0, 3).forEach((d: any) => {
      const dLabel = d.scoreLabel === "laag" ? "Laag" : d.scoreLabel === "hoog" ? "Hoog" : "Midden";
      const dCol = riskColor(d.scoreLabel);
      doc.fillColor(GREY).font("Helvetica").fontSize(8)
        .text(d.domainName ?? "Domein", leftX, lY, { continued: true, width: COL_W - 40 });
      doc.fillColor(dCol).font("Helvetica-Bold").fontSize(8)
        .text(` ${dLabel}`, { width: 40, align: "right" });
      lY = doc.y + 2;
    });
  }

  const leftColEndY = lY + 10;

  // RIGHT: Samenvatting
  let rY = sectionLabel("Samenvatting beoordeling", rightX, scoreStartY);

  const summary = truncate(assessment.overallSummary, 600);
  if (summary) {
    doc.fillColor(DARK).font("Helvetica").fontSize(9)
      .text(summary, rightX, rY, { width: COL_W, lineGap: 3 });
    rY = doc.y + 8;
  } else {
    doc.fillColor(GREY).font("Helvetica").fontSize(9)
      .text("Geen samenvatting beschikbaar.", rightX, rY, { width: COL_W });
    rY = doc.y + 8;
  }

  const rightColEndY = rY;

  // 4. DIVIDER
  y = Math.max(leftColEndY, rightColEndY) + 16;
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
    .strokeColor("#D1D5DB").lineWidth(0.5).stroke();
  y += 18;

  // 5. BRIEF row
  const briefStartY = y;
  let bL = sectionLabel("Opdrachtomschrijving compact", leftX, briefStartY);
  let bR = sectionLabel("Opdrachtomschrijving uitgebreid", rightX, briefStartY);

  const bTopY = Math.max(bL, bR);

  const compactParsed = parseDraftJson<CompactDraftJson>(assessment.compactAssignmentDraft);
  const extendedParsed = parseDraftJson<LongDraftJson>(assessment.optimizedBrief);
  const compact = compactParsed ? truncate(formatCompactDraft(compactParsed), 1200) : null;
  const extended = extendedParsed ? truncate(formatLongDraft(extendedParsed), 1200) : null;

  if (compact) {
    doc.fillColor(DARK).font("Helvetica").fontSize(8.5)
      .text(compact, leftX, bTopY, { width: COL_W, lineGap: 2.5 });
  } else {
    doc.fillColor(GREY).font("Helvetica").fontSize(8.5)
      .text("Geen compacte opdrachtomschrijving beschikbaar.", leftX, bTopY, { width: COL_W });
  }
  const briefLeftEnd = doc.y;

  if (extended) {
    doc.fillColor(DARK).font("Helvetica").fontSize(8.5)
      .text(extended, rightX, bTopY, { width: COL_W, lineGap: 2.5 });
  } else {
    doc.fillColor(GREY).font("Helvetica").fontSize(8.5)
      .text("Geen uitgebreide opdrachtomschrijving beschikbaar.", rightX, bTopY, { width: COL_W });
  }
  const briefRightEnd = doc.y;

  y = Math.max(briefLeftEnd, briefRightEnd) + 24;

  // 6. FOOTER
  const FOOTER_Y = Math.max(y, PAGE_H - 72);

  doc.moveTo(MARGIN, FOOTER_Y).lineTo(PAGE_W - MARGIN, FOOTER_Y)
    .strokeColor("#D1D5DB").lineWidth(0.5).stroke();

  doc.fillColor(GREY).font("Helvetica").fontSize(7.5)
    .text(
      "DBA Kompas  \u00b7  info@dbakompas.nl  \u00b7  www.dbakompas.nl",
      MARGIN, FOOTER_Y + 8, { width: PAGE_W - MARGIN * 2, align: "center" },
    );

  doc.fillColor(GREY).font("Helvetica").fontSize(7)
    .text(
      "Deze rapportage is een AI-gegenereerde indicatie en geen juridisch advies. Raadpleeg altijd een professional voor definitieve beoordeling.",
      MARGIN, FOOTER_Y + 22, { width: PAGE_W - MARGIN * 2, align: "center" },
    );

  return doc;
}
