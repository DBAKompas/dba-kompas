import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  PageOrientation,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip,
  TableLayoutType,
} from "docx";

// ── Kleurpalet (hex zonder #) ──────────────────────────────────────────────
const NAVY   = "1C2D49";
const ORANGE = "E8924A";
const WHITE  = "FFFFFF";
const DARK   = "1A1A1A";
const GREY   = "6B7280";
const GREEN  = "22C55E";
const AMBER  = "F59E0B";
const RED    = "EF4444";
const CREAM  = "F8F7F4";
const LIGHT  = "F3F4F6";

// ── Helpers ─────────────────────────────────────────────────────────────────
function riskColor(label: string | null | undefined): string {
  if (label === "laag")  return GREEN;
  if (label === "hoog")  return RED;
  return AMBER;
}

function riskLabelNL(label: string | null | undefined): string {
  if (label === "laag")  return "Laag risico";
  if (label === "hoog")  return "Hoog risico";
  return "Gemiddeld risico";
}

function domainTitle(key: string, fallback: string): string {
  const map: Record<string, string> = {
    aansturing:           "Aansturing, gezag en organisatorische inbedding",
    eigen_rekening_risico:"Werken voor eigen rekening en risico",
    ondernemerschap:      "Extern ondernemerschap",
  };
  return map[key] ?? fallback;
}

// Maak een eenvoudige horizontale lijn via een bordered paragraph
function hrLine(): Paragraph {
  return new Paragraph({
    text: "",
    border: {
      bottom: {
        color: "C8CAD0",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: { before: 100, after: 100 },
  });
}

// Sectiekop (oranje, bold)
function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: ORANGE,
        size: 22,  // 11pt
        font: "Calibri",
      }),
    ],
    spacing: { before: 240, after: 60 },
  });
}

// Subtitel (donker, bold)
function subHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: DARK,
        size: 20, // 10pt
        font: "Calibri",
      }),
    ],
    spacing: { before: 140, after: 40 },
  });
}

// Gewone bodytekst
function bodyPara(text: string, opts?: { color?: string; italic?: boolean; indent?: boolean }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        color: opts?.color ?? DARK,
        size: 18, // 9pt
        font: "Calibri",
        italics: opts?.italic,
      }),
    ],
    indent: opts?.indent ? { left: convertInchesToTwip(0.2) } : undefined,
    spacing: { before: 40, after: 40 },
  });
}

// Bulleted item
function bulletPara(text: string, color?: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${text}`,
        color: color ?? DARK,
        size: 18,
        font: "Calibri",
      }),
    ],
    indent: { left: convertInchesToTwip(0.2) },
    spacing: { before: 30, after: 30 },
  });
}

// Label-waarde rij (klein, grijs label + normale waarde)
function labelValuePara(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        color: GREY,
        size: 16,
        font: "Calibri",
      }),
      new TextRun({
        text: value,
        color: DARK,
        size: 16,
        font: "Calibri",
      }),
    ],
    spacing: { before: 30, after: 30 },
  });
}

// Gekleurde badge-cel voor een tabel
function riskBadgeCell(label: string, riskLabel: string): TableCell {
  const color = riskColor(riskLabel);
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: label,
            bold: true,
            color: WHITE,
            size: 18,
            font: "Calibri",
          }),
        ],
        spacing: { before: 60, after: 60 },
      }),
    ],
    shading: { type: ShadingType.SOLID, color, fill: color },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
  });
}

// Lege spacer
function spacer(before = 80, after = 80): Paragraph {
  return new Paragraph({ text: "", spacing: { before, after } });
}

// ── JSON-parser helpers (uit page.tsx) ──────────────────────────────────────
interface CompactDraft {
  title?: string;
  assignmentDescription?: string;
  deliverables?: string[];
  executionAndSteering?: string;
  structuralNote?: string;
}

interface LongDraft extends CompactDraft {
  acceptanceCriteria?: string[];
  scopeExclusions?: string[];
}

function parseDraft<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return p && typeof p === "object" ? (p as T) : null;
  } catch { return null; }
}

// ── AssessmentForDocx ───────────────────────────────────────────────────────
export interface AssessmentForDocx {
  id: string;
  input_text: string;
  overall_risk_label?: string | null;
  overall_summary?:    string | null;
  compact_assignment_draft?: string | null;
  optimized_brief?:    string | null;
  domains?:            any[] | null;
  top_improvements?:   string[] | null;
  engagement_duration_module?: any | null;
  created_at: string | Date;
}

// ── Hoofdfunctie ─────────────────────────────────────────────────────────────
export async function generateAssessmentDocx(assessment: AssessmentForDocx): Promise<Buffer> {
  const created = new Date(assessment.created_at).toLocaleDateString("nl-NL", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const refId = assessment.id.slice(0, 8).toUpperCase();
  const rlabel = assessment.overall_risk_label ?? "midden";
  const domains = (assessment.domains as any[]) ?? [];
  const improvements = (assessment.top_improvements as string[]) ?? [];
  const compactDraft = parseDraft<CompactDraft>(assessment.compact_assignment_draft);
  const longDraft    = parseDraft<LongDraft>(assessment.optimized_brief);
  const durModule    = assessment.engagement_duration_module;

  const children: (Paragraph | Table)[] = [];

  // ── 1. TITELBALK (marineblauw achtergrond via tabel) ─────────────────────
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "DBA Kompas",
                    bold: true,
                    color: WHITE,
                    size: 32,
                    font: "Calibri",
                  }),
                ],
                spacing: { before: 120, after: 40 },
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "Risicoanalyse Wet DBA",
                    color: "A8BBCC",
                    size: 22,
                    font: "Calibri",
                  }),
                ],
                spacing: { before: 0, after: 120 },
              }),
            ],
            shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
            margins: { top: 120, bottom: 120, left: 240, right: 240 },
            width: { size: 60, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Indicatieve analyse — geen juridisch advies",
                    color: "A8BBCC",
                    size: 16,
                    font: "Calibri",
                    italics: true,
                  }),
                ],
                spacing: { before: 120, after: 60 },
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Gegenereerd: ${created}  ·  Ref: ${refId}`,
                    color: "A8BBCC",
                    size: 16,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
            shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
            margins: { top: 120, bottom: 120, left: 240, right: 240 },
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
  });
  children.push(headerTable as unknown as Paragraph);
  children.push(spacer(120, 60));

  // ── 2. OVERALL RISICO ────────────────────────────────────────────────────
  children.push(sectionHeading("Risicobeoordeling"));

  const riskTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          riskBadgeCell(riskLabelNL(rlabel), rlabel),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: assessment.overall_summary ?? "Geen samenvatting beschikbaar.",
                    color: DARK,
                    size: 18,
                    font: "Calibri",
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
            margins: { top: 80, bottom: 80, left: 160, right: 80 },
            width: { size: 75, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
  });
  children.push(riskTable as unknown as Paragraph);
  children.push(spacer(80, 40));

  // ── 3. BEOORDELING PER DOMEIN ────────────────────────────────────────────
  if (domains.length > 0) {
    children.push(hrLine());
    children.push(sectionHeading("Beoordeling per domein"));

    // Tabelkop
    const domainHeaderRow = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Domein", bold: true, size: 18, font: "Calibri", color: WHITE })], spacing: { before: 60, after: 60 } })],
          shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
          margins: { left: 120, right: 80, top: 60, bottom: 60 },
          width: { size: 40, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, size: 18, font: "Calibri", color: WHITE })], spacing: { before: 60, after: 60 } })],
          shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
          margins: { left: 80, right: 80, top: 60, bottom: 60 },
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Toelichting", bold: true, size: 18, font: "Calibri", color: WHITE })], spacing: { before: 60, after: 60 } })],
          shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
          margins: { left: 80, right: 120, top: 60, bottom: 60 },
          width: { size: 48, type: WidthType.PERCENTAGE },
        }),
      ],
    });

    const domainRows = domains.slice(0, 3).map((d: any) => {
      const score  = d.scoreLabel ?? "midden";
      const color  = riskColor(score);
      const title  = domainTitle(d.key ?? "", d.title ?? d.key ?? "Domein");
      const summary = d.summary ?? "";

      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: title, bold: true, size: 17, font: "Calibri", color: DARK })],
                spacing: { before: 60, after: 40 },
              }),
            ],
            margins: { left: 120, right: 80, top: 80, bottom: 80 },
          }),
          riskBadgeCell(score.charAt(0).toUpperCase() + score.slice(1), score),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: summary, size: 17, font: "Calibri", color: DARK })],
                spacing: { before: 60, after: 60 },
              }),
            ],
            margins: { left: 80, right: 120, top: 80, bottom: 80 },
          }),
        ],
      });
    });

    const domainTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [domainHeaderRow, ...domainRows],
    });
    children.push(domainTable as unknown as Paragraph);
    children.push(spacer(80, 40));

    // Detail per domein (indicatoren)
    for (const d of domains.slice(0, 3)) {
      const title = domainTitle(d.key ?? "", d.title ?? d.key ?? "Domein");
      children.push(subHeading(title));

      if (d.indicatorsForRisk?.length) {
        children.push(bodyPara("Risico-indicatoren:", { color: RED }));
        for (const ind of d.indicatorsForRisk) {
          children.push(bulletPara(ind, RED));
        }
      }
      if (d.indicatorsForIndependence?.length) {
        children.push(bodyPara("Onafhankelijkheidsindicatoren:", { color: GREEN }));
        for (const ind of d.indicatorsForIndependence) {
          children.push(bulletPara(ind, GREEN));
        }
      }
      if (d.suggestedImprovements?.length) {
        children.push(bodyPara("Aanbeveling:", { color: "2563EB" }));
        for (const imp of d.suggestedImprovements) {
          children.push(bulletPara(imp, "2563EB"));
        }
      }
    }
  }

  // ── 4. ACTIEPUNTEN ───────────────────────────────────────────────────────
  if (improvements.length > 0) {
    children.push(hrLine());
    children.push(sectionHeading("Actiepunten"));
    improvements.forEach((imp, i) => {
      children.push(bodyPara(`${i + 1}.  ${imp}`));
    });
  }

  // ── 5. DUUR & INTENSITEIT ────────────────────────────────────────────────
  if (durModule?.summary) {
    children.push(hrLine());
    children.push(sectionHeading("Duur en inzetintensiteit"));
    if (durModule.monthsAtClient > 0) {
      children.push(labelValuePara("Geschatte duur bij opdrachtgever", `${durModule.monthsAtClient} maanden`));
    }
    if (durModule.averageHoursPerWeekBand) {
      children.push(labelValuePara("Gemiddeld uren per week", durModule.averageHoursPerWeekBand));
    }
    children.push(bodyPara(durModule.summary, { color: GREY, italic: true }));
  }

  // ── 6. OPDRACHTFORMULERING compact ──────────────────────────────────────
  if (compactDraft) {
    children.push(hrLine());
    children.push(sectionHeading("Opdrachtformulering (compact)"));
    if (compactDraft.title) {
      children.push(subHeading(compactDraft.title));
    }
    if (compactDraft.assignmentDescription) {
      children.push(bodyPara(compactDraft.assignmentDescription));
    }
    if (compactDraft.deliverables?.length) {
      children.push(bodyPara("Opleveringen:", { color: GREY }));
      for (const d of compactDraft.deliverables) {
        children.push(bulletPara(d));
      }
    }
    if (compactDraft.executionAndSteering) {
      children.push(bodyPara("Uitvoering & aansturing:", { color: GREY }));
      children.push(bodyPara(compactDraft.executionAndSteering, { indent: true }));
    }
    if (compactDraft.structuralNote) {
      children.push(bodyPara(`Let op: ${compactDraft.structuralNote}`, { color: "B45309" }));
    }
  }

  // ── 7. OPDRACHTFORMULERING uitgebreid ───────────────────────────────────
  if (longDraft) {
    children.push(hrLine());
    children.push(sectionHeading("Opdrachtformulering (uitgebreid)"));
    if (longDraft.title) {
      children.push(subHeading(longDraft.title));
    }
    if (longDraft.assignmentDescription) {
      children.push(bodyPara(longDraft.assignmentDescription));
    }
    if (longDraft.deliverables?.length) {
      children.push(bodyPara("Opleveringen:", { color: GREY }));
      for (const d of longDraft.deliverables) {
        children.push(bulletPara(d));
      }
    }
    if (longDraft.acceptanceCriteria?.length) {
      children.push(bodyPara("Acceptatiecriteria:", { color: GREY }));
      for (const c of longDraft.acceptanceCriteria) {
        children.push(bulletPara(c, GREEN));
      }
    }
    if (longDraft.scopeExclusions?.length) {
      children.push(bodyPara("Buiten scope:", { color: GREY }));
      for (const s of longDraft.scopeExclusions) {
        children.push(bulletPara(s, GREY));
      }
    }
    if (longDraft.executionAndSteering) {
      children.push(bodyPara("Uitvoering & aansturing:", { color: GREY }));
      children.push(bodyPara(longDraft.executionAndSteering, { indent: true }));
    }
    if (longDraft.structuralNote) {
      children.push(bodyPara(`Let op: ${longDraft.structuralNote}`, { color: "B45309" }));
    }
  }

  // ── 8. DISCLAIMER ────────────────────────────────────────────────────────
  children.push(hrLine());
  children.push(spacer(40, 40));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Disclaimer: ",
          bold: true,
          size: 16,
          color: "B45309",
          font: "Calibri",
        }),
        new TextRun({
          text: "Deze analyse is een AI-gegenereerde indicatie en vervangt geen juridisch advies. De resultaten zijn indicatief. Raadpleeg altijd een juridisch professional voor definitieve beoordeling.",
          size: 16,
          color: "92400E",
          font: "Calibri",
          italics: true,
        }),
      ],
      spacing: { before: 60, after: 60 },
    })
  );

  // ── Document samenstellen ─────────────────────────────────────────────────
  const doc = new Document({
    creator: "DBA Kompas",
    title:   "DBA Risicoanalyse",
    description: "Indicatieve DBA risico-inschatting — geen juridisch advies",
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 18,
            color: DARK,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left:   convertInchesToTwip(0.85),
              right:  convertInchesToTwip(0.85),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "DBA Kompas  ·  info@dbakompas.nl  ·  www.dbakompas.nl",
                    color: GREY,
                    size: 14,
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
