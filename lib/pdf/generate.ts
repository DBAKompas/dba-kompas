import PDFDocument from "pdfkit";
import path from "path";

// ── Kleuren ────────────────────────────────────────────────────────────────
const NAVY   = "#1C2D49";
const ORANGE = "#E8924A";
const CREAM  = "#F2F0EB";
const WHITE  = "#FFFFFF";
const DARK   = "#1A1A1A";
const GREY   = "#6B7280";
const MID    = "#374151";

// ── Helpers ────────────────────────────────────────────────────────────────
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

/** Kap af op een zingrens; val terug op hardcap. */
function truncateSentence(text: string, maxChars: number): string {
  if (!text || text.length <= maxChars) return text ?? "";
  const sub = text.slice(0, maxChars);
  const dot = Math.max(sub.lastIndexOf(". "), sub.lastIndexOf(".\n"));
  if (dot > maxChars * 0.55) return text.slice(0, dot + 1);
  return sub.trimEnd() + "\u2026";
}

// ── JSON draft parsing ─────────────────────────────────────────────────────
interface CompactDraft {
  title?: string;
  assignmentDescription?: string;
  deliverables?: string[];
  executionAndSteering?: string;
  structuralNote?: string;
}

interface LongDraft {
  title?: string;
  assignmentDescription?: string;
  deliverables?: string[];
  acceptanceCriteria?: string[];
  scopeExclusions?: string[];
  executionAndSteering?: string;
  structuralNote?: string;
}

function parseDraft<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return p && typeof p === "object" ? (p as T) : null;
  } catch { return null; }
}

const FALLBACK_DESC = "Omschrijving kon niet automatisch worden gegenereerd.";
const NOT_YET = "Nog niet gegenereerd.\nGenereer een opdrachtomschrijving in de app en download de PDF opnieuw.";

// ── AssessmentForPDF ───────────────────────────────────────────────────────
export interface AssessmentForPDF {
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

// ── Hoofdfunctie ───────────────────────────────────────────────────────────
export function generateAssessmentPDF(assessment: AssessmentForPDF): PDFKit.PDFDocument {

  const PAGE_W  = 595.28;
  const PAGE_H  = 841.89;
  const MRG     = 36;           // pagina-marge
  const GAP     = 14;           // kolomspatie
  const FULL_W  = PAGE_W - MRG * 2;
  const COL_W   = (FULL_W - GAP) / 2;
  const LX      = MRG;          // linker kolom x
  const RX      = MRG + COL_W + GAP; // rechter kolom x

  // Fontsizes
  const FS_HEAD  = 8.5;   // sectiekoppen
  const FS_BODY  = 7;     // broodtekst
  const FS_SMALL = 6.5;   // toelichting / footer
  const FS_SCORE = 15;    // scorecijfer

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: { Title: "DBA Risicoanalyse — DBA Kompas", Author: "DBA Kompas" },
    autoFirstPage: false,
  });

  // Elke pagina: CREAM achtergrond + NAVY header-strip herhalen
  function addPage(isFirst = false) {
    doc.addPage({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    // Volledige pagina CREAM
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(CREAM);

    if (!isFirst) {
      // Subtiele header-strip op vervolgpagina's
      doc.rect(0, 0, PAGE_W, 24).fill(NAVY);
      doc.fillColor(WHITE).font("Helvetica").fontSize(6.5)
        .text("DBA Kompas  ·  Risicoanalyse (vervolg)", MRG, 8, { width: FULL_W });
    }
  }

  // ── Helper: sectielabel met precieze onderstreep ──────────────────────────
  function sectionLabel(text: string, x: number, y: number, width = COL_W): number {
    doc.font("Helvetica-Bold").fontSize(FS_HEAD).fillColor(ORANGE);
    doc.text(text, x, y, { width });
    const lw = doc.widthOfString(text, { size: FS_HEAD });
    const lineY = y + FS_HEAD + 2;
    doc.moveTo(x, lineY).lineTo(x + lw, lineY)
      .strokeColor(ORANGE).lineWidth(1.2).stroke();
    return lineY + 6;
  }

  // ── Helper: tekstregel met vaste kolombreedte ────────────────────────────
  function bodyText(text: string, x: number, y: number, opts?: {
    width?: number; bold?: boolean; color?: string; size?: number; lineGap?: number;
  }): number {
    const w     = opts?.width  ?? COL_W;
    const size  = opts?.size   ?? FS_BODY;
    const color = opts?.color  ?? MID;
    const lg    = opts?.lineGap ?? 1.5;
    doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(size).fillColor(color)
      .text(text, x, y, { width: w, lineGap: lg });
    return doc.y;
  }

  // ── Pagina 1 ─────────────────────────────────────────────────────────────
  addPage(true);

  // ── HEADER ───────────────────────────────────────────────────────────────
  const HDR_H = 64;
  doc.rect(0, 0, PAGE_W, HDR_H).fill(NAVY);

  // Logo
  const logoPath = path.join(process.cwd(), "public/logo-flat-white.png");
  try {
    doc.image(logoPath, MRG, 14, { height: 36, fit: [180, 36] });
  } catch {
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11).text("DBA Kompas", MRG, 22);
  }

  // Titel rechts
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(20)
    .text("Risicoanalyse", 0, 14, { width: PAGE_W - MRG, align: "right" });
  doc.fillColor("#A8BBCC").font("Helvetica").fontSize(7.5)
    .text("Indicatieve DBA risico-inschatting · geen juridisch advies", 0, 40, {
      width: PAGE_W - MRG, align: "right",
    });

  // ── STRIP: datum + ref ───────────────────────────────────────────────────
  const STRIP_Y = HDR_H;
  const STRIP_H = 18;
  doc.rect(0, STRIP_Y, PAGE_W, STRIP_H).fill("#E4E6EA");
  const created = new Date(assessment.createdAt).toLocaleDateString("nl-NL", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.fillColor(GREY).font("Helvetica").fontSize(6.5)
    .text(
      `Gegenereerd op: ${created}   ·   Referentie: ${assessment.id.slice(0, 8).toUpperCase()}`,
      MRG, STRIP_Y + 5, { width: FULL_W },
    );

  // ── INHOUD start ─────────────────────────────────────────────────────────
  let topY = STRIP_Y + STRIP_H + 14;

  // ── RIJ 1: Scorekaart (links) + Samenvatting (rechts) ───────────────────
  const row1StartY = topY;

  // LINKS: Scorekaart
  let lY = sectionLabel("Scorekaart", LX, row1StartY);

  const domains   = assessment.domains ?? [];
  const hasDom    = domains.length > 0;
  const rlabel    = assessment.overallRiskLabel ?? "midden";
  const percent   = hasDom ? computeCompliancePercent(domains, assessment.engagementDurationModule) : null;
  const scoreCol  = percent !== null ? (percent >= 65 ? "#22C55E" : percent >= 40 ? "#F59E0B" : "#EF4444") : GREY;

  if (percent !== null) {
    // Score inline: gekleurde pill + risicolabel
    const R = 14;
    const circleX = LX + R;
    const circleY = lY + R;
    doc.circle(circleX, circleY, R).fillAndStroke(scoreCol, scoreCol);
    // Scorecijfer in cirkel
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(FS_SCORE)
      .text(`${percent}`, LX, circleY - FS_SCORE * 0.5, {
        width: R * 2, align: "center", lineBreak: false,
      });

    // "%" + risicolabel rechts van cirkel
    const textX = LX + R * 2 + 8;
    doc.fillColor(scoreCol).font("Helvetica-Bold").fontSize(FS_SCORE)
      .text("%", textX, circleY - FS_SCORE * 0.5, { lineBreak: false });
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(8)
      .text(riskLabelNL(rlabel), textX, circleY + 2, { lineBreak: false });
    lY = circleY + R + 8;
  } else {
    lY = bodyText(riskLabelNL(rlabel), LX, lY, { bold: true, color: riskColor(rlabel), size: 9 });
    lY += 4;
  }

  // Domeinen
  if (hasDom) {
    domains.slice(0, 3).forEach((d: any) => {
      const name   = d.title ?? d.domainName ?? d.key ?? "Domein";
      const score  = d.scoreLabel ?? "midden";
      const dLabel = score === "laag" ? "Laag" : score === "hoog" ? "Hoog" : "Midden";
      const dCol   = riskColor(score);

      // Naam + score op 1 regel
      const nameW = COL_W - 36;
      doc.font("Helvetica-Bold").fontSize(FS_BODY).fillColor(DARK)
        .text(name, LX, lY, { width: nameW, lineBreak: false, lineGap: 1.5 });
      doc.font("Helvetica-Bold").fontSize(FS_BODY).fillColor(dCol)
        .text(dLabel, LX + nameW, lY, { width: 36, align: "right", lineBreak: false });
      lY = doc.y + 1;

      // Korte samenvatting domein
      if (d.summary) {
        const shortSummary = truncateSentence(d.summary, 110);
        lY = bodyText(shortSummary, LX + 2, lY, {
          size: FS_SMALL, color: GREY, lineGap: 1,
        }) + 3;
      }
    });
  }

  const leftColEnd = lY;

  // RECHTS: Samenvatting
  let rY = sectionLabel("Samenvatting beoordeling", RX, row1StartY);
  const summaryText = truncateSentence(assessment.overallSummary ?? "", 520);
  if (summaryText) {
    rY = bodyText(summaryText, RX, rY, { size: FS_BODY, lineGap: 2 }) + 2;
  } else {
    rY = bodyText("Geen samenvatting beschikbaar.", RX, rY, { color: GREY }) + 2;
  }
  const rightColEnd = rY;

  // ── DIVIDER ──────────────────────────────────────────────────────────────
  topY = Math.max(leftColEnd, rightColEnd) + 10;
  doc.moveTo(MRG, topY).lineTo(PAGE_W - MRG, topY)
    .strokeColor("#C8CAD0").lineWidth(0.4).stroke();
  topY += 10;

  // ── RIJ 2: Opdrachtomschrijvingen ─────────────────────────────────────────
  const compactRaw  = parseDraft<CompactDraft>(assessment.compactAssignmentDraft);
  const extendedRaw = parseDraft<LongDraft>(assessment.optimizedBrief);
  const compactOk   = compactRaw  && compactRaw.assignmentDescription  !== FALLBACK_DESC;
  const extendedOk  = extendedRaw && extendedRaw.assignmentDescription !== FALLBACK_DESC;

  // Render draft kolom — geeft eindY terug
  function renderDraftCol(
    draft: CompactDraft | LongDraft | null,
    ok: boolean,
    x: number,
    startY: number,
    isLong: boolean,
  ): number {
    let y = sectionLabel(
      isLong ? "Opdrachtomschrijving uitgebreid" : "Opdrachtomschrijving compact",
      x, startY,
    );

    if (!ok || !draft) {
      y = bodyText(NOT_YET, x, y, { size: FS_SMALL, color: GREY, lineGap: 2 });
      return y;
    }

    // Titel bold
    if (draft.title) {
      y = bodyText(draft.title, x, y, { bold: true, size: FS_BODY + 0.5, color: DARK, lineGap: 1.5 }) + 2;
    }

    // Omschrijving — compact: max 350 chars; uitgebreid: max 600 chars
    if (draft.assignmentDescription) {
      const maxLen = isLong ? 600 : 350;
      const desc = truncateSentence(draft.assignmentDescription, maxLen);
      y = bodyText(desc, x, y, { size: FS_BODY, lineGap: 2 }) + 3;
    }

    // Opleveringen (max 3)
    const dels = (draft as any).deliverables as string[] | undefined;
    if (dels?.length) {
      y = bodyText("Opleveringen:", x, y, { bold: true, size: FS_BODY, color: DARK, lineGap: 1.5 });
      dels.slice(0, 3).forEach(d => {
        y = bodyText(`\u2022  ${d}`, x + 4, y, { size: FS_BODY, lineGap: 1.5 }) + 1;
      });
      y += 2;
    }

    // Acceptatiecriteria (alleen uitgebreid, max 2)
    if (isLong) {
      const crit = (draft as LongDraft).acceptanceCriteria;
      if (crit?.length) {
        y = bodyText("Acceptatiecriteria:", x, y, { bold: true, size: FS_BODY, color: DARK, lineGap: 1.5 });
        crit.slice(0, 2).forEach(c => {
          y = bodyText(`\u2022  ${c}`, x + 4, y, { size: FS_BODY, lineGap: 1.5 }) + 1;
        });
        y += 2;
      }
    }

    // Uitvoering & aansturing
    if (draft.executionAndSteering) {
      const exec = truncateSentence(draft.executionAndSteering, 200);
      y = bodyText(exec, x, y, { size: FS_BODY, lineGap: 2 }) + 2;
    }

    // Structurele noot
    if ((draft as any).structuralNote) {
      y = bodyText(`Let op: ${(draft as any).structuralNote}`, x, y, {
        size: FS_SMALL, color: "#B45309", lineGap: 1.5,
      }) + 2;
    }

    return y;
  }

  // Render beide kolommen
  const draftLEnd = renderDraftCol(compactRaw, !!compactOk, LX, topY, false);
  const draftREnd = renderDraftCol(extendedRaw, !!extendedOk, RX, topY, true);

  const contentEnd = Math.max(draftLEnd, draftREnd) + 16;

  // ── FOOTER ───────────────────────────────────────────────────────────────
  // Plaats footer na content, maar minimaal 56px van de pagina-onderkant
  const footerY = Math.max(contentEnd, PAGE_H - 52);

  // Als footer buiten de pagina valt: footer bovenaan volgende pagina
  const needsNewPage = footerY + 40 > PAGE_H;
  let fY = footerY;
  if (needsNewPage) {
    addPage(false);
    fY = 36;
  }

  doc.moveTo(MRG, fY).lineTo(PAGE_W - MRG, fY)
    .strokeColor("#C8CAD0").lineWidth(0.4).stroke();
  doc.fillColor(GREY).font("Helvetica").fontSize(6.5)
    .text(
      "DBA Kompas  ·  info@dbakompas.nl  ·  www.dbakompas.nl",
      MRG, fY + 6, { width: FULL_W, align: "center" },
    );
  doc.fillColor(GREY).font("Helvetica").fontSize(6)
    .text(
      "Deze rapportage is een AI-gegenereerde indicatie en geen juridisch advies. Raadpleeg altijd een juridisch professional voor definitieve beoordeling.",
      MRG, fY + 17, { width: FULL_W, align: "center" },
    );

  return doc;
}
