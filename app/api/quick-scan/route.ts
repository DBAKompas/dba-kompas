import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.length < 50) {
      return NextResponse.json(
        { error: "Te weinig tekst (minimaal 50 karakters)" },
        { status: 400 }
      );
    }

    // Eenvoudige keyword-based quick scan (placeholder tot OpenAI/Claude integratie)
    const riskKeywords = [
      "aansturing",
      "gezag",
      "instructie",
      "werkgever",
      "loon",
      "loondienst",
      "exclusief",
      "vast",
    ];
    const positiveKeywords = [
      "zelfstandig",
      "eigen materiaal",
      "eigen klanten",
      "meerdere opdrachtgevers",
      "resultaat",
      "eindresultaat",
    ];

    const textLower = text.toLowerCase();
    const riskCount = riskKeywords.filter((k) => textLower.includes(k)).length;
    const positiveCount = positiveKeywords.filter((k) =>
      textLower.includes(k)
    ).length;

    const score = Math.max(
      0,
      Math.min(100, 50 - riskCount * 10 + positiveCount * 8)
    );

    return NextResponse.json({
      score,
      riskLevel: score < 40 ? "hoog" : score < 70 ? "gemiddeld" : "laag",
      summary:
        score < 40
          ? "Er zijn meerdere aandachtspunten gevonden die om verdere analyse vragen."
          : score < 70
          ? "Er zijn enkele aandachtspunten. Een volledige analyse wordt aanbevolen."
          : "De opdrachtomschrijving ziet er relatief sterk uit. Volledige analyse bevestigt dit.",
    });
  } catch (error) {
    console.error("Quick scan error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij de analyse" },
      { status: 500 }
    );
  }
}
