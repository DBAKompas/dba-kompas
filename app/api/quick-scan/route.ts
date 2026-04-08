import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "default_key",
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.length < 50) {
      return NextResponse.json(
        { error: "Te weinig tekst (minimaal 50 karakters)" },
        { status: 400 }
      );
    }

    const truncated = text.slice(0, 1500);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "Je bent een DBA-risico beoordelaar. Geef een snelle indicatieve score op basis van de opdrachtomschrijving. Geef ALLEEN JSON terug, niets anders.",
      messages: [
        {
          role: "user",
          content: `Beoordeel deze opdrachtomschrijving op DBA-risico:

<tekst>
${truncated}
</tekst>

Geef ALLEEN deze JSON terug:
{
  "score": <getal 0-100, hoog = weinig risico>,
  "riskLevel": "laag" | "gemiddeld" | "hoog",
  "summary": "<1 zin max 120 tekens>"
}`,
        },
      ],
    });

    const raw =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    // Strip code fences indien aanwezig
    const clean = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Extraheer JSON object
    const match = clean.match(/\{[\s\S]*\}/);
    const jsonStr = match ? match[0] : clean;

    let result: { score?: number; riskLevel?: string; summary?: string } = {};
    try {
      result = JSON.parse(jsonStr);
    } catch {
      // Fallback bij parse fout
      result = { score: 50, riskLevel: "gemiddeld", summary: "Analyse niet beschikbaar." };
    }

    const score = typeof result.score === "number"
      ? Math.max(0, Math.min(100, result.score))
      : 50;

    const riskLevel =
      result.riskLevel === "laag" || result.riskLevel === "hoog"
        ? result.riskLevel
        : "gemiddeld";

    const summary =
      typeof result.summary === "string" && result.summary.length > 0
        ? result.summary
        : riskLevel === "hoog"
        ? "Er zijn meerdere aandachtspunten die om verdere analyse vragen."
        : riskLevel === "laag"
        ? "De opdrachtomschrijving ziet er relatief sterk uit."
        : "Er zijn enkele aandachtspunten. Een volledige analyse wordt aanbevolen.";

    return NextResponse.json({ score, riskLevel, summary });
  } catch (error) {
    console.error("Quick scan error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij de analyse" },
      { status: 500 }
    );
  }
}
