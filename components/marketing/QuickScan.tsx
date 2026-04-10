'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePostHog } from "posthog-js/react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type AnswerScore = 0 | 1 | 2;
type RiskLevel = "low" | "medium" | "high";

/** A single answer option within a question. */
interface Answer {
  label: string;
  score: AnswerScore;
}

/** A scan question with its weight for scoring. */
interface Question {
  id: number;
  text: string;
  /**
   * Multiplier applied to the selected answer score.
   *   1   = normal  (Q3–Q5, max contribution per question: 2)
   *   1.5 = elevated (Q1–Q2, max contribution per question: 3)
   *
   * Total max score: 1.5×2 + 1.5×2 + 1×2 + 1×2 + 1×2 = 12
   * Risk thresholds: 0–3 low | 4–7 medium | 8–12 high
   */
  weight: 1 | 1.5;
  answers: [Answer, Answer, Answer];
}

/** Copy and styling for each risk level's result screen. */
interface RiskResult {
  badge: string;
  badgeStyle: string;
  title: string;
  body: string;
  cta: string;
}

/** Payload emitted on form submission — ready for Loops / analytics / API. */
interface QuickScanPayload {
  eventName: "quick_scan_completed";
  firstName: string;
  email: string;
  score: number;
  riskLevel: RiskLevel;
  answers: Record<`question${1 | 2 | 3 | 4 | 5}`, string>;
}

interface FormErrors {
  firstName?: string;
  email?: string;
}

/**
 * Internal phase state machine:
 *   questions → result → form → success
 */
type Phase = "questions" | "result" | "form" | "success";

// ─────────────────────────────────────────────
// Question data
// ─────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    weight: 1.5,
    text: "Wie bepaalt hoe jij je werk uitvoert in deze opdracht?",
    answers: [
      { label: "Ik bepaal zelf hoe ik het werk uitvoer en organiseer", score: 0 },
      { label: "Ik stem regelmatig af met de opdrachtgever", score: 1 },
      { label: "De opdrachtgever geeft mij duidelijke instructies over hoe ik moet werken", score: 2 },
    ],
  },
  {
    id: 2,
    weight: 1.5,
    text: "Waar word jij in deze opdracht vooral op afgerekend?",
    answers: [
      { label: "Het eindresultaat dat ik oplever", score: 0 },
      { label: "Zowel resultaat als inzet", score: 1 },
      { label: "De uren/dagen die ik werk", score: 2 },
    ],
  },
  {
    id: 3,
    weight: 1,
    text: "In hoeverre kun jij zelf bepalen hoe, wanneer en waar je werkt?",
    answers: [
      { label: "Ik bepaal dit volledig zelf", score: 0 },
      { label: "Gedeeltelijk, maar met afstemming", score: 1 },
      { label: "Dit ligt grotendeels vast vanuit de opdrachtgever", score: 2 },
    ],
  },
  {
    id: 4,
    weight: 1,
    text: "Hoe ziet jouw situatie als zelfstandige eruit naast deze opdracht?",
    answers: [
      { label: "Ik werk (of zoek actief werk) bij meerdere opdrachtgevers", score: 0 },
      { label: "Deze opdracht is mijn belangrijkste, maar niet de enige", score: 1 },
      { label: "Ik werk feitelijk alleen voor deze opdrachtgever", score: 2 },
    ],
  },
  {
    id: 5,
    weight: 1,
    text: "Wat gebeurt er als jij het werk niet zelf kunt uitvoeren?",
    answers: [
      { label: "Ik kan iemand anders inschakelen om het werk over te nemen", score: 0 },
      { label: "Alleen in overleg met de opdrachtgever", score: 1 },
      { label: "Ik moet het werk zelf uitvoeren", score: 2 },
    ],
  },
];

// ─────────────────────────────────────────────
// Result copy & styles
// ─────────────────────────────────────────────

const RISK_RESULTS: Record<RiskLevel, RiskResult> = {
  low: {
    badge: "Laag risico",
    badgeStyle: "bg-green-50 border-green-200 text-green-700",
    title: "Je opdracht lijkt op belangrijke punten zelfstandig ingericht",
    body: "Toch zitten risico's vaak in details en formulering.",
    cta: "Ontvang je volledige analyse",
  },
  medium: {
    badge: "Gemiddeld risico",
    badgeStyle: "bg-amber-50 border-amber-200 text-amber-700",
    title: "Je opdracht bevat elementen die in de praktijk tot vragen kunnen leiden",
    body: "Afhankelijk van hoe de opdracht is uitgewerkt, kunnen bepaalde onderdelen extra aandacht vragen.",
    cta: "Ontvang concrete verbeterpunten",
  },
  high: {
    badge: "Hoog risico",
    badgeStyle: "bg-red-50 border-red-200 text-red-700",
    title: "Je opdracht lijkt op meerdere punten afhankelijk ingericht",
    body: "Dit kan vragen oproepen bij de beoordeling van je arbeidsrelatie.",
    cta: "Bekijk waar het risico zit",
  },
};

// ─────────────────────────────────────────────
// Scoring helpers
// ─────────────────────────────────────────────

/** Returns the weighted total score across all answered questions. */
function calcTotalScore(questions: Question[], scores: (AnswerScore | null)[]): number {
  return questions.reduce<number>((total, question, i) => {
    const score = scores[i];
    return score === null ? total : total + score * question.weight;
  }, 0);
}

/** Maps a total score to a risk level. */
function getRiskLevel(score: number): RiskLevel {
  if (score <= 3) return "low";
  if (score <= 7) return "medium";
  return "high";
}

/** Returns the selected answer label for a given question index. */
function getAnswerLabel(questions: Question[], scores: (AnswerScore | null)[], questionIndex: number): string {
  const score = scores[questionIndex];
  if (score === null) return "";
  return questions[questionIndex].answers[score]?.label ?? "";
}

/** Builds the submission payload ready for Loops / analytics / backend. */
function buildPayload(
  firstName: string,
  email: string,
  questions: Question[],
  scores: (AnswerScore | null)[],
): QuickScanPayload {
  const score = calcTotalScore(questions, scores);
  return {
    eventName: "quick_scan_completed",
    firstName,
    email,
    score,
    riskLevel: getRiskLevel(score),
    answers: {
      question1: getAnswerLabel(questions, scores, 0),
      question2: getAnswerLabel(questions, scores, 1),
      question3: getAnswerLabel(questions, scores, 2),
      question4: getAnswerLabel(questions, scores, 3),
      question5: getAnswerLabel(questions, scores, 4),
    },
  };
}

/** Returns field-level validation errors, or an empty object if valid. */
function validateContactForm(firstName: string, email: string): FormErrors {
  const errors: FormErrors = {};
  if (!firstName.trim()) errors.firstName = "Vul je voornaam in";
  if (!email.trim()) errors.email = "Vul je e-mailadres in";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Voer een geldig e-mailadres in";
  return errors;
}

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0, transition: { duration: 0.2 } }),
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function QuickScan() {
  const router = useRouter();
  const posthog = usePostHog();
  const [phase, setPhase] = useState<Phase>("questions");
  const [stepIndex, setStepIndex] = useState(0);
  const [scores, setScores] = useState<(AnswerScore | null)[]>(Array(QUESTIONS.length).fill(null));
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [scanStarted, setScanStarted] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[stepIndex];
  const totalSteps = QUESTIONS.length;
  const progress = ((stepIndex + (selectedAnswerIndex !== null ? 1 : 0)) / totalSteps) * 100;

  const totalScore = calcTotalScore(QUESTIONS, scores);
  const riskLevel = getRiskLevel(totalScore);
  const riskResult = RISK_RESULTS[riskLevel];

  // ── Handlers ──

  function handleSelectAnswer(answerIndex: number) {
    setSelectedAnswerIndex(answerIndex);
    // PostHog: eerste antwoord = scan gestart
    if (!scanStarted) {
      setScanStarted(true);
      posthog?.capture('quick_scan_started', { input_method: 'questions' });
    }
  }

  function handleNext() {
    if (selectedAnswerIndex === null) return;

    const updatedScores = [...scores] as (AnswerScore | null)[];
    updatedScores[stepIndex] = currentQuestion.answers[selectedAnswerIndex].score;
    setScores(updatedScores);

    if (stepIndex < totalSteps - 1) {
      const nextStep = stepIndex + 1;
      const previousScoreForNextStep = updatedScores[nextStep];
      const restoredAnswerIndex = previousScoreForNextStep !== null
        ? QUESTIONS[nextStep].answers.findIndex((a) => a.score === previousScoreForNextStep)
        : null;

      setSlideDirection(1);
      setStepIndex(nextStep);
      setSelectedAnswerIndex(restoredAnswerIndex);
    } else {
      setPhase("result");
      // PostHog: resultaat bekeken
      const finalScore = calcTotalScore(QUESTIONS, updatedScores);
      posthog?.capture('quick_scan_result_viewed', {
        risk_level: getRiskLevel(finalScore),
        score: finalScore,
      });
    }
  }

  function handleBack() {
    if (stepIndex === 0) return;
    const prevStep = stepIndex - 1;
    const prevScore = scores[prevStep];
    const restoredAnswerIndex = prevScore !== null
      ? QUESTIONS[prevStep].answers.findIndex((a) => a.score === prevScore)
      : null;

    setSlideDirection(-1);
    setStepIndex(prevStep);
    setSelectedAnswerIndex(restoredAnswerIndex);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateContactForm(firstName, email);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = buildPayload(firstName.trim(), email.trim(), QUESTIONS, scores);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/loops/quick-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("request_failed");
      // PostHog: quick scan volledig voltooid (naam + email ingevuld, naar Loops gestuurd)
      posthog?.capture('quick_scan_completed', {
        risk_level: payload.riskLevel,
        score: payload.score,
      });
      setPhase("success");
    } catch {
      setSubmitError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFieldError(field: keyof FormErrors) {
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // ── Render: success screen ──

  if (phase === "success") {
    return (
      <div className="w-full max-w-xl mx-auto" data-testid="quickscan-success">
        <motion.div {...fadeUp} className="bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="w-3.5 h-3.5" />
              Opgeslagen
            </span>
          </div>

          <div className="px-6 py-5">
            <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">
              Je quick scan is opgeslagen
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              We gebruiken je uitkomst om je gerichter te helpen met de volgende stap.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold"
                onClick={() => {
                  posthog?.capture('quick_scan_signup_clicked', { source: 'success_screen' });
                  router.push("/auth/signup");
                }}
                data-testid="button-go-full-analysis"
              >
                Ga verder met de volledige analyse
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 text-base"
                onClick={() => router.push("/#pricing")}
                data-testid="button-nurture-only"
              >
                Bekijk wat DBA Kompas biedt
              </Button>
            </div>

            <p className="text-xs text-muted-foreground/70 italic border-l-2 border-border pl-3 mt-5">
              De volledige analyse geeft je meer context, concrete verbeterpunten en een sterkere opdrachtomschrijving.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Render: result screen (+ email form) ──

  if (phase === "result" || phase === "form") {
    return (
      <div className="w-full max-w-xl mx-auto" data-testid="quickscan-result">
        <motion.div {...fadeUp} className="bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${riskResult.badgeStyle}`}>
              {riskResult.badge}
            </span>
          </div>

          <div className="px-6 py-5">
            <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">
              {riskResult.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {riskResult.body}
            </p>
            <p className="text-xs text-muted-foreground/70 italic border-l-2 border-border pl-3">
              Veel zzp'ers met een vergelijkbare uitkomst scherpen hun opdrachtomschrijving aan voordat ze het gesprek ingaan.
            </p>
          </div>

          <div className="px-6 pb-6">
            {phase === "result" && (
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={() => {
                  setPhase("form");
                  posthog?.capture('quick_scan_cta_clicked', {
                    risk_level: riskLevel,
                    cta_label: riskResult.cta,
                  });
                }}
                data-testid="quickscan-cta-button"
              >
                {riskResult.cta}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            <AnimatePresence>
              {phase === "form" && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-4 overflow-hidden"
                  data-testid="quickscan-email-form"
                  noValidate
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1" htmlFor="qs-firstname">
                      Voornaam
                    </label>
                    <input
                      id="qs-firstname"
                      type="text"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
                      placeholder="Jouw voornaam"
                      className="w-full h-11 px-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                      data-testid="input-firstname"
                    />
                    {formErrors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1" htmlFor="qs-email">
                      E-mailadres
                    </label>
                    <input
                      id="qs-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                      placeholder="naam@bedrijf.nl"
                      className="w-full h-11 px-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                      data-testid="input-email"
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-base font-semibold"
                    data-testid="button-submit-form"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Bezig met verzenden…
                      </>
                    ) : (
                      <>
                        Verstuur en bekijk vervolgstap
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>

                  {submitError && (
                    <p className="text-xs text-red-500 text-center" data-testid="submit-error">
                      {submitError}
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Render: question stepper ──

  return (
    <div className="w-full max-w-xl mx-auto" data-testid="quickscan-container">
      <div className="bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden">

        {/* Progress header */}
        <div className="px-6 pt-5 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Vraag {stepIndex + 1} van {totalSteps}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}% voltooid</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              data-testid="quickscan-progress-bar"
            />
          </div>
        </div>

        {/* Question text */}
        <div className="px-6 pt-5 pb-2 min-h-[72px]">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.h3
              key={stepIndex}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-base font-bold text-foreground leading-snug"
              data-testid="quickscan-question"
            >
              {currentQuestion.text}
            </motion.h3>
          </AnimatePresence>
        </div>

        {/* Answer options */}
        <div className="px-6 pb-5 space-y-2.5">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={stepIndex}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-2.5"
            >
              {currentQuestion.answers.map((answer, i) => {
                const isSelected = selectedAnswerIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(i)}
                    data-testid={`quickscan-answer-${i}`}
                    className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 text-sm font-medium leading-snug focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group
                      ${isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/30 text-foreground"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200
                        ${isSelected ? "border-primary bg-primary" : "border-border/60 group-hover:border-primary/50"}`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white block" />}
                      </span>
                      <span>{answer.label}</span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t border-border/30 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="gap-1.5 text-muted-foreground"
            data-testid="quickscan-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Vorige
          </Button>

          <Button
            onClick={handleNext}
            disabled={selectedAnswerIndex === null}
            className="gap-1.5 px-6"
            data-testid="quickscan-next"
          >
            {stepIndex === totalSteps - 1 ? "Bekijk uitslag" : "Volgende"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
