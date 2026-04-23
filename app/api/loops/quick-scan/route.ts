import { NextResponse } from "next/server";
import { updateLoopsContact, sendLoopsEvent } from "@/lib/loops";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_CONTACTS_URL = "https://app.loops.so/api/v1/contacts/update";

interface QuickScanPayload {
  eventName: string;
  firstName: string;
  email: string;
  score: number;
  riskLevel: "low" | "medium" | "high";
  answers: Record<string, string>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuickScanPayload;

    const { firstName, email, score, riskLevel, answers } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }
    if (!firstName || typeof firstName !== "string") {
      return NextResponse.json({ error: "Voornaam ontbreekt" }, { status: 400 });
    }

    const riskNL = riskLevel === "low" ? "laag" : riskLevel === "high" ? "hoog" : "gemiddeld";

    // Sla op in Supabase voor funnel-analytics (fire-and-forget, geen harde fout bij mislukken)
    supabaseAdmin
      .from("quick_scan_leads")
      .insert({
        email,
        first_name: firstName,
        risk_level: riskNL,
        score,
      })
      .then(({ error }) => {
        if (error) console.warn("[QUICK SCAN] Supabase insert mislukt:", error.message);
      });

    // Contact aanmaken of updaten in Loops (met firstName als standaardveld)
    if (LOOPS_API_KEY) {
      await fetch(LOOPS_CONTACTS_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOOPS_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          firstName,
          quick_scan_completed: true,
          quick_scan_risk_level: riskNL,
          quick_scan_score: score,
        }),
      });
    } else {
      console.warn("[LOOPS] quick-scan contact update skipped - LOOPS_API_KEY niet geconfigureerd");
    }

    // Event versturen met alle antwoorden als properties
    await sendLoopsEvent("quick_scan_completed", {
      email,
      properties: {
        firstName,
        score,
        risk_level: riskNL,
        ...answers,
      },
      dedupKey: `quick_scan_${email}_${Date.now()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LOOPS] quick-scan error:", error);
    return NextResponse.json({ error: "Er is een fout opgetreden" }, { status: 500 });
  }
}
