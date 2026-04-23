'use client'
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle, AlertTriangle, Copy, ArrowLeft, ArrowRight,
  Shield, Zap, FileText, X, ChevronDown, ChevronUp, Lock,
} from "lucide-react";
import BrandLogo from "@/components/marketing/BrandLogo";

const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL as string | undefined)?.replace(/\/+$/, "") ||
  "https://app.dbakompas.nl";

const NAVY = "#1C2D49";
const ORANGE = "#F6A54B";

/* ─────────────────────────────────────────────
   SCREEN DURATIONS  (ms, null = no auto-advance)
───────────────────────────────────────────────── */
const SCREEN_DURATIONS: (number | null)[] = [5000, 12000, 7500, 16000, null];
const TOTAL_SCREENS = 5;

/* ─────────────────────────────────────────────
   SHARED DATA
───────────────────────────────────────────────── */
const SAMPLE_TEXT =
  "Als senior IT-architect ga ik voor TechCorp BV een cloudmigratiestrategie ontwikkelen. Ik werk zelfstandig aan het eindresultaat: een goedgekeurd migratierapport en een werkend proof-of-concept. Ik draag zelf het risico voor de kwaliteit van mijn werk en bepaal zelf mijn werktijden en aanpak. Ik factureer per opgeleverd resultaat, inclusief mijn eigen gereedschappen en materialen. De opdracht duurt maximaal 6 maanden.";

const SIGNALS = [
  { trigger: "resultaat", label: "Resultaat" },
  { trigger: "zelfstandig", label: "Vrijheid" },
  { trigger: "risico", label: "Eigen risico" },
  { trigger: "gereedschappen", label: "Eigen middelen" },
  { trigger: "maanden", label: "Tijdelijk" },
];

const BRIEF_COMPACT = `[SCOPE EN RESULTAAT]
De ZZP-architect levert een volledig goedgekeurde cloudmigratiestrategie op, inclusief een werkend PoC-omgeving. De oplevering is een eindresultaat, niet uren of inspanning.

[ZELFSTANDIGE UITVOERING]
De architect bepaalt zelfstandig de technische aanpak, planning en werktijden. Er is geen sprake van gezagsverhouding.

[DUUR EN AFRONDING]
De opdracht beslaat maximaal 6 kalendermaanden. Verlenging vereist een nieuwe overeenkomst.`;

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────── */
function AnimatedCounter({ target, active }: { target: number; active: boolean }) {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  useEffect(() => {
    if (!active) { setCount(0); return; }
    if (prefersReducedMotion) { setCount(target); return; }
    const dur = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, prefersReducedMotion]);
  return <>{count.toLocaleString("nl-NL")}</>;
}

/* ─────────────────────────────────────────────
   SVG GAUGE
───────────────────────────────────────────────── */
function ScoreGauge({ pct, color, size = 108 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.37;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E5E7EB" strokeWidth={size * 0.074} />
      <motion.circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={size * 0.074} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   SCROLL FADE - toont een verloopindicator als er meer inhoud onder is
───────────────────────────────────────────────── */
function ScrollFade({
  children,
  className,
  style,
  fadeColor = "#F9F8F5",
  wrapperClassName = "",
  innerProps = {},
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fadeColor?: string;
  wrapperClassName?: string;
  innerProps?: React.HTMLAttributes<HTMLDivElement>;
  testId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight + 2;
    const notBottom = el.scrollTop < el.scrollHeight - el.clientHeight - 4;
    setHint(scrollable && notBottom);
  }, []);

  useEffect(() => {
    // Kleine vertraging zodat de layout gesetteld is voordat we meten
    const id = setTimeout(check, 50);
    const el = ref.current;
    if (!el) return () => clearTimeout(id);
    const ro = new ResizeObserver(check);
    const mo = new MutationObserver(check);
    ro.observe(el);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => { clearTimeout(id); ro.disconnect(); mo.disconnect(); };
  }, [check, children]);

  return (
    <div className={`relative ${wrapperClassName}`} data-testid={testId ? `${testId}-wrapper` : undefined}>
      <div
        ref={ref}
        onScroll={check}
        className={className}
        style={style}
        {...innerProps}
        data-testid={testId ? `${testId}-scroll` : undefined}
      >
        {children}
      </div>
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 inset-x-0 pointer-events-none flex items-end justify-center pb-1"
            style={{
              height: 44,
              background: `linear-gradient(to bottom, transparent, ${fadeColor})`,
            }}
            data-testid={testId ? `${testId}-hint` : undefined}
          >
            <ChevronDown
              className="w-4 h-4 animate-bounce"
              style={{ color: NAVY, opacity: 0.45 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP DOTS
───────────────────────────────────────────────── */
function StepDots({ current, total, onDotClick }: { current: number; total: number; onDotClick: (i: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          aria-label={`Ga naar scherm ${i + 1}`}
          onClick={() => onDotClick(i)}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            background: i === current ? ORANGE : "rgba(255,255,255,0.3)",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1 - HERO INTRO
───────────────────────────────────────────────── */
function HeroScreen({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), prefersReduced ? 200 : 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active, prefersReduced]);

  const pills = ["✓ Aansturing & Gezag", "✓ Eigen Rekening & Risico", "✓ Ondernemerschap"];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 py-10 text-center" style={{ background: NAVY }}>

      {/* Logo - altijd in DOM, voorkomt layout-verschuiving */}
      <motion.div
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -16 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5"
      >
        <BrandLogo variant="flatWhiteV3" className="h-12 w-auto mx-auto mb-3" />
        <div className="text-white/60 text-sm">Compliance hulpmiddel voor ZZP'ers</div>
      </motion.div>

      {/* Counter - altijd in DOM, tabular-nums voorkomt breedte-schokken */}
      <motion.div
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-white mb-1 tabular-nums"
        data-testid="demo-counter"
      >
        <AnimatedCounter target={1247} active={phase >= 1} />
        <span>+ analyses gedaan</span>
      </motion.div>

      {/* Tagline - altijd in DOM */}
      <motion.p
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-white/80 text-base mb-6 mt-2 max-w-xs"
      >
        AI-analyse van jouw DBA-opdracht in 60 seconden
      </motion.p>

      {/* Pills - altijd in DOM, stagger via animate */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {pills.map((pill, i) => (
          <motion.span
            key={pill}
            animate={{
              opacity: phase >= 2 ? 1 : 0,
              y: phase >= 2 ? 0 : 8,
            }}
            transition={{ delay: phase >= 2 ? 0.15 + 0.1 * i : 0, duration: 0.35 }}
            className="text-sm font-medium rounded-full px-3 py-1"
            style={{ background: ORANGE, color: NAVY }}
          >
            {pill}
          </motion.span>
        ))}
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2 - INPUT & ANALYSE STARTEN
───────────────────────────────────────────────── */
function InputScreen({ active, onReady }: { active: boolean; onReady?: () => void }) {
  const [typed, setTyped] = useState("");
  const [showButton, setShowButton] = useState(false);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!active) { setTyped(""); setShowButton(false); return; }
    if (prefersReduced) { setTyped(SAMPLE_TEXT); setShowButton(true); return; }
    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < SAMPLE_TEXT.length) {
        setTyped(SAMPLE_TEXT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timerRef.current);
        setTimeout(() => setShowButton(true), 400);
      }
    }, 28);
    return () => clearInterval(timerRef.current);
  }, [active, prefersReduced]);

  useEffect(() => {
    if (showButton) {
      const t = setTimeout(() => onReadyRef.current?.(), 2000);
      return () => clearTimeout(t);
    }
  }, [showButton]);

  const words = typed.trim() ? typed.trim().split(/\s+/).length : 0;
  const wordPct = Math.min((words / 80) * 100, 100);
  const wordsDone = words >= 80;
  const detected = SIGNALS.filter(s => typed.toLowerCase().includes(s.trigger));
  const signalPct = (detected.length / SIGNALS.length) * 100;
  const allDone = wordsDone && detected.length === SIGNALS.length;

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4 px-1" style={{ background: "#F9F8F5" }}>
      <div className="flex items-center gap-2 pt-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ORANGE, color: NAVY }}>STAP 1</span>
        <span className="text-sm font-semibold" style={{ color: NAVY }}>Opdracht invoeren</span>
      </div>

      <ScrollFade
        className="w-full rounded-xl border-2 p-3 text-sm leading-relaxed font-mono bg-white h-[130px] overflow-y-auto text-left"
        style={{ borderColor: typed ? NAVY : "#D1D5DB", color: "#374151", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        fadeColor="white"
        testId="input-text"
        innerProps={{ "aria-label": "Opdrachtomschrijving invoer" }}
      >
        {typed || <span className="text-gray-400">Begin je opdrachtomschrijving hier te typen…</span>}
        {active && !prefersReduced && typed.length < SAMPLE_TEXT.length && (
          <span className="animate-pulse" style={{ color: ORANGE }}>|</span>
        )}
      </ScrollFade>

      {typed.length > 20 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Woordtelling */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: NAVY }}>
              <span className="font-medium">Woordtelling</span>
              <span className={wordsDone ? "font-bold" : ""} style={{ color: wordsDone ? "#22C55E" : "#6B7280" }}>
                {words} / 80 woorden{wordsDone && " ✓"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: wordsDone ? "#22C55E" : ORANGE }}
                animate={{ width: `${wordPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Kernpunten */}
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: NAVY }}>
              <span className="font-medium">Kernpunten herkend</span>
              <span className={detected.length === 5 ? "font-bold" : ""} style={{ color: detected.length === 5 ? "#22C55E" : "#6B7280" }}>
                {detected.length} / 5{detected.length === 5 && " ✓"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: detected.length === 5 ? "#22C55E" : ORANGE }}
                animate={{ width: `${signalPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SIGNALS.map(s => {
                const found = detected.some(d => d.trigger === s.trigger);
                return (
                  <span
                    key={s.trigger}
                    className="text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all"
                    style={{
                      background: found ? "#DCFCE7" : "#F3F4F6",
                      color: found ? "#16A34A" : "#9CA3AF",
                      borderColor: found ? "#86EFAC" : "#E5E7EB",
                    }}
                  >
                    {found ? "✓ " : ""}{s.label}
                  </span>
                );
              })}
            </div>
          </div>

          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{ background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC" }}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              Voldoende informatie voor een nauwkeurige analyse
            </motion.div>
          )}
        </motion.div>
      )}

      {showButton && (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: ORANGE, color: NAVY }}
          aria-label="Analyse starten"
        >
          Analyse starten <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3 - AI VERWERKING
───────────────────────────────────────────────── */
const STAGES = [
  { label: "Tekst wordt verwerkt", dur: 1200 },
  { label: "DBA-wet wordt geraadpleegd", dur: 1800 },
  { label: "Opdrachtomschrijving wordt gegenereerd", dur: 2000 },
];

function ProcessingScreen({ active }: { active: boolean }) {
  const [stageIdx, setStageIdx] = useState(-1);
  const [stagePct, setStagePct] = useState(0);
  const prefersReduced = useReducedMotion();
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!active) { setStageIdx(-1); setStagePct(0); return; }
    if (prefersReduced) {
      setStageIdx(2); setStagePct(100); return;
    }

    let cancelled = false;
    async function run() {
      for (let s = 0; s < STAGES.length; s++) {
        if (cancelled) return;
        setStageIdx(s);
        setStagePct(0);
        const dur = STAGES[s].dur;
        const start = performance.now();
        await new Promise<void>(res => {
          const tick = (now: number) => {
            const t = Math.min((now - start) / dur, 1);
            setStagePct(Math.round(t * 100));
            if (t < 1 && !cancelled) rafRef.current = requestAnimationFrame(tick);
            else res();
          };
          rafRef.current = requestAnimationFrame(tick);
        });
        await new Promise(r => setTimeout(r, 200));
      }
    }
    const t = setTimeout(run, 300);
    return () => { cancelled = true; clearTimeout(t); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, prefersReduced]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 py-10" style={{ background: NAVY }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-6"
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
          <circle cx="28" cy="28" r="26" stroke={ORANGE} strokeWidth="3" strokeDasharray="6 4" />
          <path d="M28 8 L31 22 L28 20 L25 22 Z" fill={ORANGE} />
          <circle cx="28" cy="28" r="4" fill={ORANGE} />
        </svg>
      </motion.div>

      <h2 className="text-white text-2xl font-bold mb-8">Analyseren...</h2>

      <div className="w-full max-w-sm space-y-5">
        {STAGES.map((stage, i) => {
          const done = stageIdx > i;
          const current = stageIdx === i;
          const pct = current ? stagePct : done ? 100 : 0;
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {done ? (
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  ) : current ? (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="w-4 h-4 rounded-full border-2 border-orange-400 shrink-0"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />
                  )}
                  <span className="text-sm" style={{ color: done ? "#4ADE80" : current ? "white" : "rgba(255,255,255,0.4)" }}>
                    {stage.label}
                  </span>
                </div>
                <span className="text-xs" style={{ color: done ? "#4ADE80" : current ? ORANGE : "rgba(255,255,255,0.3)" }}>
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: done ? "#4ADE80" : ORANGE }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="mt-10 text-xs text-white/50 text-center max-w-xs"
      >
        Onze AI analyseert meer dan 40 jurisprudentiepunten...
      </motion.p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 4 - RESULTATEN
───────────────────────────────────────────────── */
const DOMAINS = [
  {
    title: "Aansturing & Gezag",
    pct: 45,
    color: "#F59E0B",
    badge: "Matig risico",
    issues: [
      "Opdrachtgever heeft wekelijks overleg met directe sturing",
      "Werktijden zijn deels voorgeschreven door klant",
    ],
    positives: ["ZZP'er bepaalt eigen aanpak en methodiek"],
    tip: "Voeg toe: 'Opdrachtnemer bepaalt zelfstandig de werkmethode en planning.'",
  },
  {
    title: "Eigen Rekening & Risico",
    pct: 82,
    color: "#22C55E",
    badge: "Laag risico",
    issues: [],
    positives: [
      "Eigen gereedschappen en materialen",
      "Facturatie op basis van resultaat",
      "Risico kwaliteit bij ZZP'er",
    ],
    tip: null,
  },
  {
    title: "Ondernemerschap",
    pct: 58,
    color: "#F59E0B",
    badge: "Bewustwording",
    issues: [
      "Geen vermelding meerdere opdrachtgevers",
      "Onduidelijke definitie eigen werkplek",
    ],
    positives: [],
    tip: "Vermeld: 'Opdrachtnemer werkt tevens voor andere opdrachtgevers.'",
  },
];

const IMPROVEMENTS = [
  { prio: "HOOG", color: "#EF4444", dot: "🔴", text: "Verwijder verwijzingen naar vaste werktijden en vervang door 'resultaatgericht'" },
  { prio: "MIDDEN", color: "#F59E0B", dot: "🟡", text: "Voeg expliciete vermelding toe van eigen gereedschappen en werkplek" },
  { prio: "LAAG", color: "#22C55E", dot: "🟢", text: "Benoem de mogelijkheid tot substitutie (vervanging door andere ZZP'er)" },
];

function DomainCard({ domain, autoExpand }: { domain: typeof DOMAINS[0]; autoExpand?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!autoExpand) return;
    const t1 = setTimeout(() => setOpen(true), 3000);
    const t2 = setTimeout(() => setOpen(false), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [autoExpand]);

  return (
    <div
      className="rounded-xl border bg-white overflow-hidden cursor-pointer"
      style={{ borderColor: "#E5E7EB" }}
      onClick={() => setOpen(o => !o)}
      aria-expanded={open}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative shrink-0" style={{ width: 48, height: 48 }}>
          <ScoreGauge pct={domain.pct} color={domain.color} size={48} />
          <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 2 }}>
            <span className="text-[9px] font-bold" style={{ color: domain.color }}>{domain.pct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-bold truncate" style={{ color: NAVY }}>{domain.title}</p>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${domain.color}20`, color: domain.color }}
          >
            {domain.badge}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 text-left border-t" style={{ borderColor: "#F3F4F6" }}>
              {domain.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]" style={{ color: "#6B7280" }}>
                  <span className="text-red-500 mt-0.5 shrink-0">✕</span>{issue}
                </div>
              ))}
              {domain.positives.map((pos, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]" style={{ color: "#16A34A" }}>
                  <span className="shrink-0 mt-0.5">✓</span>{pos}
                </div>
              ))}
              {domain.tip && (
                <div className="rounded-lg p-2 text-[10px] mt-1" style={{ background: `${ORANGE}18`, color: NAVY }}>
                  <span className="font-semibold">Tip: </span>{domain.tip}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultsScreen({ active }: { active: boolean }) {
  const [tab, setTab] = useState<"Compact" | "Uitgebreid" | "Bouwstenen">("Compact");
  const [toasted, setToasted] = useState(false);

  function handleCopy() {
    setToasted(true);
    setTimeout(() => setToasted(false), 2000);
  }

  return (
    <ScrollFade
      className="overflow-y-auto h-full space-y-4 pr-1 text-left"
      style={{ background: "#F9F8F5" }}
      wrapperClassName="h-full"
      testId="results"
    >
      {/* Totaaloordeel */}
      <div className="bg-white rounded-xl border p-4 flex items-start gap-4" style={{ borderColor: "#E5E7EB" }}>
        <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
          <ScoreGauge pct={73} color="#F59E0B" size={100} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color: NAVY }}>73%</span>
            <span className="text-[9px]" style={{ color: "#9CA3AF" }}>conform</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: "#9CA3AF" }}>
            TOTAALOORDEEL · AI indicatie · geen juridisch advies
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-2"
            style={{ background: "#FEF3C7", color: "#D97706" }}>
            <AlertTriangle className="w-3 h-3" /> TWIJFEL - Aandacht nodig
          </span>
          <p className="text-[11px] leading-relaxed" style={{ color: "#4B5563" }}>
            De opdracht bevat kenmerken van zelfstandige uitvoering, maar de beperkte vrijheid in aansturing en de lange duur vragen om aandacht. Optimalisatie kan het risico verlagen.
          </p>
        </div>
      </div>

      {/* 3 Domeinen */}
      <p className="text-xs font-bold" style={{ color: NAVY }}>Drie domeinen</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DOMAINS.map((d, i) => (
          <DomainCard key={d.title} domain={d} autoExpand={active && i === 0} />
        ))}
      </div>

      {/* Geoptimaliseerde opdrachtomschrijving */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center gap-1 p-3 border-b" style={{ borderColor: "#F3F4F6" }}>
          {(["Compact", "Uitgebreid", "Bouwstenen"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-[11px] font-semibold px-3 py-1 rounded-lg transition-colors"
              style={tab === t
                ? { background: NAVY, color: "white" }
                : { color: "#6B7280" }
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-3">
          {tab === "Compact" && (
            <pre className="text-[10px] leading-relaxed whitespace-pre-wrap" style={{ color: "#374151", fontFamily: "inherit" }}>
              {BRIEF_COMPACT}
            </pre>
          )}
          {tab === "Uitgebreid" && (
            <p className="text-[10px] leading-relaxed" style={{ color: "#374151" }}>
              Uitgebreide versie bevat aanvullende clausules en verdere toelichting per onderdeel. Beschikbaar na analyse.
            </p>
          )}
          {tab === "Bouwstenen" && (
            <p className="text-[10px] leading-relaxed" style={{ color: "#374151" }}>
              Modulaire bouwstenen voor eigen opmaak van de opdrachtomschrijving. Kies per onderdeel de meest passende formulering.
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "#F3F4F6", color: NAVY }}
              aria-label="Kopiëren"
            >
              <Copy className="w-3 h-3" />
              {toasted ? "Gekopieerd!" : "Kopiëren"}
            </button>
            <button
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg"
              style={{ background: "#F3F4F6", color: NAVY }}
              aria-label="Downloaden als PDF"
            >
              <FileText className="w-3 h-3" /> Downloaden (.pdf)
            </button>
          </div>
        </div>
      </div>

      {/* Verbeterpunten */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E5E7EB" }}>
        <p className="text-xs font-bold mb-3" style={{ color: NAVY }}>Prioriteit verbeterpunten</p>
        <div className="space-y-2.5">
          {IMPROVEMENTS.map((imp, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{imp.dot}</span>
              <div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded mr-1.5"
                  style={{ background: `${imp.color}20`, color: imp.color }}
                >
                  {imp.prio}
                </span>
                <span className="text-[11px]" style={{ color: "#374151" }}>{imp.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollFade>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 5 - CTA
───────────────────────────────────────────────── */
function CtaScreen({ active, onSubscribe }: { active: boolean; onSubscribe?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 py-10 text-center"
      style={{ background: NAVY }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={active ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ background: "#DCFCE7", border: "2px solid #86EFAC" }}
      >
        <CheckCircle className="w-8 h-8 text-green-500" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-white font-bold text-2xl mb-3 max-w-xs"
      >
        Klaar om jouw opdracht te analyseren?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="text-white/70 text-sm mb-6 max-w-xs"
      >
        Meer dan 1.200 ZZP'ers gebruiken DBA Kompas al.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="flex items-center justify-center gap-6 mb-8"
      >
        {[
          { icon: Lock, label: "Veilig" },
          { icon: Zap, label: "60 sec" },
          { icon: FileText, label: "Volledig rapport" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon className="w-4 h-4 text-white" />
            <span className="text-white/70 text-[11px]">{label}</span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="w-full max-w-xs space-y-3"
      >
        <motion.button
          onClick={onSubscribe ?? (() => { window.location.href = APP_URL; })}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold cursor-pointer"
          style={{ background: ORANGE, color: NAVY }}
          aria-label="Analyseer jouw opdracht nu"
          data-testid="demo-cta-link"
        >
          Analyseer jouw opdracht nu <ArrowRight className="w-4 h-4" />
        </motion.button>

        <button
          onClick={() => { window.location.href = `${APP_URL}#one-time`; }}
          className="block w-full text-center text-white/60 text-xs hover:text-white transition-colors cursor-pointer"
          aria-label="Eenmalige check"
        >
          Eenmalige check voor €9,95 - geen abonnement
        </button>

      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WRAPPER / ORCHESTRATOR
───────────────────────────────────────────────── */
const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -32, transition: { duration: 0.35, ease: [0.42, 0, 0.58, 1] } }),
};

export default function AppDemoShowcase({ onSubscribe }: { onSubscribe?: () => void }) {
  const [screen, setScreen] = useState(0);
  const [dir, setDir] = useState(1);
  const [started, setStarted] = useState(false);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Start de demo pas als de wrapper zichtbaar wordt in het scherm
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_SCREENS - 1, next));
    setDir(clamped > screen ? 1 : -1);
    setScreen(clamped);
  }, [screen]);

  const advance = useCallback(() => goTo(screen + 1), [goTo, screen]);

  // Auto-advance - alleen nadat de demo in beeld is gekomen
  useEffect(() => {
    if (!started) return;
    clearTimeout(timerRef.current);
    const dur = SCREEN_DURATIONS[screen];
    if (dur == null || prefersReduced) return;
    timerRef.current = setTimeout(advance, dur);
    return () => clearTimeout(timerRef.current);
  }, [screen, advance, prefersReduced, started]);

  const isDark = screen === 0 || screen === 2 || screen === 4;

  return (
    <div ref={wrapperRef} className="demo-glow-wrapper relative">
      <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden demo-browser">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: isDark ? "#0F1C2E" : "#F3F4F6", borderColor: isDark ? "#1E3A5F" : "#E5E7EB" }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="rounded-md px-3 py-1 text-xs flex items-center gap-2 max-w-[240px] mx-auto"
              style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB", color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280" }}>
              <Shield className="w-3 h-3 text-green-400" />
              app.dbakompas.nl
            </div>
          </div>
          {/* Dot nav + restart */}
          <div className="flex items-center gap-2">
            <StepDots current={screen} total={TOTAL_SCREENS} onDotClick={(i) => { setDir(i > screen ? 1 : -1); setScreen(i); }} />
            <button
              onClick={() => { setDir(-1); setScreen(0); setStarted(true); }}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
              aria-label="Opnieuw starten"
              data-testid="demo-restart"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Screen area - fixed height, content scrolls inside */}
        <div className="relative overflow-hidden" style={{ height: 480 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={screen}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 p-4 md:p-5 flex flex-col"
            >
              {screen === 0 && <HeroScreen active={started} />}
              {screen === 1 && <InputScreen active={started} onReady={() => { if (SCREEN_DURATIONS[1] != null) advance(); }} />}
              {screen === 2 && <ProcessingScreen active={started} />}
              {screen === 3 && <ResultsScreen active={started} />}
              {screen === 4 && <CtaScreen active={started} onSubscribe={onSubscribe} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{ background: isDark ? "#0F1C2E" : "#F9FAFB", borderColor: isDark ? "#1E3A5F" : "#E5E7EB" }}
        >
          <button
            onClick={() => goTo(screen - 1)}
            disabled={screen === 0}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-30"
            style={{ color: isDark ? "rgba(255,255,255,0.7)" : NAVY, background: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB" }}
            aria-label="Vorige scherm"
            data-testid="demo-prev"
          >
            <ArrowLeft className="w-3 h-3" /> Vorige
          </button>
          <span className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF" }}>
            {screen + 1} / {TOTAL_SCREENS}
          </span>
          <button
            onClick={() => goTo(screen + 1)}
            disabled={screen === TOTAL_SCREENS - 1}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-30"
            style={{ color: isDark ? "rgba(255,255,255,0.7)" : NAVY, background: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB" }}
            aria-label="Volgende scherm"
            data-testid="demo-next"
          >
            Volgende <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
