"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LANDING } from "@/content/landing.nl";
import { trackFaqOpened } from "@/lib/dba-analytics";
import s from "./home-v3.module.css";

type Plan = "monthly" | "yearly" | "one_time_dba";

type Level = "laag" | "midden" | "hoog";
type Part = { t: string; m?: "r" | "g" };

type Example = {
  name: string;
  level: Level;
  parts: Part[];
  /** Score per onderdeel: 0 tot 100, waarbij 100 sterk op zelfstandigheid wijst. */
  bars: { label: string; score: number; level: Level }[];
  zwaarst: string;
  vraag: string;
  bron: { titel: string; ecli: string; relevantie: string };
};

// Voorbeelden voor de demo in de hero. De opdrachten zijn fictief. De uitkomsten
// (indicatie, scores, weging, vraag en bron) zijn letterlijk overgenomen uit de
// analyse die DBA Kompas op deze opdrachten gaf (proefdraai 11 november 2026).
// De opdrachttekst is hier ingekort; de gemarkeerde zinsneden staan in de volledige tekst.
const EXAMPLES: Example[] = [
  {
    name: "Interim projectleider",
    level: "hoog",
    parts: [
      { t: "Inzet: 36 uur per week, een jaar. De projectleider " },
      { t: "maakt deel uit van het team Dienstverlening en rapporteert wekelijks aan de teammanager", m: "r" },
      { t: ", stuurt vier medewerkers van de gemeente aan en werkt " },
      { t: "minimaal drie dagen per week op het gemeentehuis", m: "r" },
      { t: ". Tarief: € 105 per uur, op basis van " },
      { t: "door de opdrachtgever goedgekeurde urenstaten", m: "r" },
      { t: ". De opdrachtnemer mag zich laten vervangen " },
      { t: "na schriftelijke toestemming van de opdrachtgever", m: "r" },
      { t: " en is " },
      { t: "verzekerd voor beroepsaansprakelijkheid", m: "g" },
      { t: "." },
    ],
    bars: [
      { label: "Aansturing en gezag", score: 15, level: "hoog" },
      { label: "Eigen rekening en risico", score: 30, level: "hoog" },
      { label: "Ondernemerschap", score: 50, level: "midden" },
    ],
    zwaarst:
      "Je maakt deel uit van het team en rapporteert aan de teammanager, je stuurt medewerkers van de gemeente aan, en je werkt 36 uur per week voor minstens een jaar. Over je ondernemerschap zegt de tekst niets.",
    vraag: "Is de gemeente bereid tot betaling per mijlpaal en een vrije vervangingsmogelijkheid?",
    bron: {
      titel: "Hoge Raad, 21 februari 2025 (Uber)",
      ecli: "ECLI:NL:HR:2025:319",
      relevantie:
        "Er is geen rangorde tussen de gezichtspunten, en je ondernemerschap buiten deze opdracht weegt volwaardig mee. Daarom is het belangrijk dat je dat aantoont.",
    },
  },
  {
    name: "IT-project, vaste prijs",
    level: "laag",
    parts: [
      { t: "Opdrachtnemer levert uiterlijk 1 maart 2027 een werkende API-koppeling op. " },
      { t: "Vaste prijs: € 18.500 exclusief btw", m: "g" },
      { t: ", te factureren na acceptatie van de mijlpalen. Opdrachtnemer " },
      { t: "bepaalt zelf de technische aanpak, planning en werkplek", m: "g" },
      { t: " en " },
      { t: "mag het werk geheel of gedeeltelijk laten uitvoeren door een derde", m: "g" },
      { t: ". " },
      { t: "Herstel van gebreken binnen 30 dagen na oplevering is voor rekening van opdrachtnemer", m: "g" },
      { t: "." },
    ],
    bars: [
      { label: "Aansturing en gezag", score: 85, level: "laag" },
      { label: "Eigen rekening en risico", score: 85, level: "laag" },
      { label: "Ondernemerschap", score: 70, level: "laag" },
    ],
    zwaarst:
      "Het zwaarst wegen de vaste prijs per mijlpaal met herstel op eigen kosten, de vrije vervanging door een derde en de eigen regie over aanpak, planning en middelen.",
    vraag: "Wie beoordeelt de acceptatie van elke mijlpaal, en op basis van welke criteria?",
    bron: {
      titel: "Hoge Raad, 24 maart 2023 (Deliveroo)",
      ecli: "ECLI:NL:HR:2023:443",
      relevantie:
        "Dit is het toetsingskader voor de holistische weging. Hier wijzen vooral beloning, commercieel risico en vrije werkwijze op zelfstandigheid.",
    },
  },
  {
    name: "Contract met bijlage",
    level: "hoog",
    parts: [
      { t: "Partijen beogen uitdrukkelijk geen arbeidsovereenkomst aan te gaan. Opdrachtnemer is geheel vrij in de wijze waarop hij de opdracht uitvoert en is niet gebonden aan aanwijzingen van opdrachtgever. Bijlage werkafspraken: opdrachtnemer is van " },
      { t: "maandag tot en met donderdag van 8.30 tot 17.00 uur aanwezig op locatie", m: "r" },
      { t: " en " },
      { t: "volgt de instructies van de afdelingsmanager op", m: "r" },
      { t: ". Looptijd: " },
      { t: "onbepaalde tijd", m: "r" },
      { t: ". Opdrachtnemer " },
      { t: "heeft geen andere opdrachtgevers", m: "r" },
      { t: "." },
    ],
    bars: [
      { label: "Aansturing en gezag", score: 15, level: "hoog" },
      { label: "Eigen rekening en risico", score: 25, level: "hoog" },
      { label: "Ondernemerschap", score: 15, level: "hoog" },
    ],
    zwaarst:
      "De hoofdtekst zegt dat je vrij bent en niet gebonden aan aanwijzingen. De bijlage zegt het omgekeerde: je “volgt de instructies van de afdelingsmanager op”. Die tegenspraak weegt in je nadeel.",
    vraag: "Welk concreet resultaat moet ik opleveren en wanneer eindigt de opdracht?",
    bron: {
      titel: "Hoge Raad, 6 november 2020 (X/Gemeente Amsterdam)",
      ecli: "ECLI:NL:HR:2020:1746",
      relevantie:
        "De zin “Partijen beogen uitdrukkelijk geen arbeidsovereenkomst” telt niet mee bij de kwalificatie. Het gaat om de rechten, plichten en uitvoering.",
    },
  },
];

const LEVEL_COLOR: Record<Level, string> = {
  laag: "var(--ok)",
  midden: "var(--mid)",
  hoog: "var(--bad)",
};
const LEVEL_WORD: Record<Level, string> = { laag: "Laag", midden: "Gemiddeld", hoog: "Hoog" };
// Vulling van de ring: dezelfde waarden die de app bij de indicatie toont.
const LEVEL_RING: Record<Level, number> = { laag: 88, midden: 55, hoog: 25 };


// ── Scroll-effecten ──────────────────────────────────────────────────────────

/** Laat elementen met data-reveal rustig binnenkomen en verschuift data-speed-lagen bij het scrollen. */
function useScrollEffects(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (calm) {
      reveals.forEach((n) => n.classList.add(s.in));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.in);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    reveals.forEach((n) => io.observe(n));

    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-speed]"));
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      layers.forEach((layer) => {
        const rect = layer.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) / vh;
        layer.style.transform = `translate3d(0, ${(offset * Number(layer.dataset.speed) * 100).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [root]);
}

/** Het woord in de kop waar de video doorheen speelt. Op smalle schermen een verloop in plaats van video. */
function VideoWord({ children }: { children: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const wide = window.matchMedia("(min-width: 921px)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wide || calm) return;
    v.src = "/home/gesprek.mp4";
    v.play().catch(() => {});
  }, []);
  return (
    <span className={s.vword}>
      <video ref={ref} muted loop playsInline preload="none" aria-hidden="true" />
      <span className={s.vtext}>{children}</span>
    </span>
  );
}

// ── Analyse in actie ─────────────────────────────────────────────────────────

function Showcase() {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const ex = EXAMPLES[idx];

  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), 1300);
    return () => window.clearTimeout(timer);
  }, [idx]);

  function pick(i: number) {
    if (i === idx) return;
    setDone(false);
    setIdx(i);
  }

  return (
    <div className={s.show}>
      <div className={s.showTabs} role="tablist">
        {EXAMPLES.map((e, i) => (
          <button key={e.name} type="button" role="tab" aria-selected={i === idx} className={i === idx ? s.showTabOn : s.showTab} onClick={() => pick(i)}>
            <span className={s.spark} style={{ background: LEVEL_COLOR[e.level] }} />
            <span>
              <b>{e.name}</b>
              <small>{LEVEL_WORD[e.level]} risico</small>
            </span>
          </button>
        ))}
      </div>

      <div className={s.showBody}>
        <div className={s.mock}>
          <div key={idx} className={`${s.doc} ${done ? s.done : s.run}`}>
            <div className={s.scan} />
            {ex.parts.map((p, i) =>
              p.m ? (
                <span key={i} className={p.m === "r" ? s.markR : s.markG}>
                  {p.t}
                </span>
              ) : (
                <span key={i}>{p.t}</span>
              ),
            )}
          </div>
          <div className={s.res}>
            <div className={s.ring}>
              <svg width="112" height="112" viewBox="0 0 132 132" aria-hidden="true">
                <circle className={s.ringBg} cx="66" cy="66" r="55" />
                <circle
                  className={s.ringFg}
                  cx="66"
                  cy="66"
                  r="55"
                  style={{ stroke: LEVEL_COLOR[ex.level], strokeDashoffset: done ? 345 - (345 * LEVEL_RING[ex.level]) / 100 : 345 }}
                />
              </svg>
              <div className={s.ringTxt}>
                <strong>{done ? LEVEL_WORD[ex.level] : "…"}</strong>
                <small>{done ? "risico" : "bezig"}</small>
              </div>
            </div>
            <div className={s.bars}>
              {ex.bars.map((b) => (
                <div key={b.label}>
                  <div className={s.barLabel}>
                    {b.label}
                    <span>{done ? `${b.score} van 100` : ""}</span>
                  </div>
                  <div className={s.track}>
                    <i style={{ width: done ? `${b.score}%` : 0, background: LEVEL_COLOR[b.level] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div key={`t${idx}`} className={`${s.showTxt} ${done ? s.showTxtIn : ""}`}>
          <h3>
            {ex.name}: {LEVEL_WORD[ex.level].toLowerCase()} risico
          </h3>
          <div>
            <b>Wat het zwaarst weegt</b>
            <p>{ex.zwaarst}</p>
          </div>
          <div>
            <b>Vraag voor het gesprek</b>
            <p>{ex.vraag}</p>
          </div>
          <div>
            <b>Bron</b>
            <p>
              <a href={`https://uitspraken.rechtspraak.nl/details?id=${encodeURIComponent(ex.bron.ecli)}`} target="_blank" rel="noopener noreferrer">
                {ex.bron.titel}
              </a>
              . {ex.bron.relevantie}
            </p>
          </div>
          <small className={s.showNote}>
            Een fragment uit een analyse van een fictieve opdracht. De volledige analyse gaat veel verder. Indicatie, geen juridisch oordeel.
          </small>
        </div>
      </div>
    </div>
  );
}

// ── Pagina ───────────────────────────────────────────────────────────────────

export function HomeV3({ onZelfscan, onCheck }: { onZelfscan: () => void; onCheck: (plan: Plan) => void }) {
  const root = useRef<HTMLDivElement>(null);
  useScrollEffects(root);

  return (
    <div className={s.root} ref={root}>
      {/* HERO */}
      <section id="hero" className={s.hero}>
        <div className={s.wrap}>
          <h1>
            <span>Wij helpen</span>
            <span>zzp&apos;ers</span>
            <span>
              <VideoWord>sterker</VideoWord> het gesprek in
            </span>
          </h1>
          <div className={s.heroRow}>
            <p className={s.sub}>
              Zie in ongeveer een minuut waar je opdracht vragen oproept rond de Wet DBA, en wat je met je opdrachtgever kunt bespreken.
            </p>
            <div className={s.cta}>
              <button type="button" className={s.btnP} onClick={onZelfscan}>
                Start je gratis zelfscan
              </button>
              <button type="button" className={s.btnD} onClick={() => onCheck("one_time_dba")}>
                Toets je opdracht voor €9,95
              </button>
            </div>
          </div>
        </div>
        <a href="#antwoord" className={s.down} aria-label="Naar beneden">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
      </section>

      {/* MISSIE */}
      <section id="antwoord" className={s.band}>
        <div className={`${s.wrap} ${s.two}`}>
          <p className={s.label}>Waar we voor staan</p>
          <div data-reveal>
            <p className={s.statement}>
              Wij helpen zzp&apos;ers hun opdracht op orde te hebben <mark className={s.chipO}>voordat iemand ernaar vraagt</mark>. Zodat je met
              vertrouwen het gesprek voert met je opdrachtgever of intermediair, en weet waar je staat.
            </p>
            <h2 className={s.small}>Wat is DBA Kompas?</h2>
            <p className={s.answer}>{LANDING.answerBlock}</p>
          </div>
        </div>
      </section>

      {/* WAT JIJ ERUIT HAALT */}
      <section id="functies" className={s.sec}>
        <div className={s.wrap}>
          <div className={s.wins}>
            <div className={s.win} data-reveal>
              <div className={s.art}>
                <div className={s.shapeA}>
                  <Image src="/home/werken.jpg" alt="Zzp'er werkt aan een opdracht op een laptop" fill sizes="(max-width: 920px) 80vw, 300px" />
                </div>
                <span className={`${s.deco} ${s.decoStar}`} data-speed="-0.25" aria-hidden="true" />
              </div>
              <span className={s.num}>01</span>
              <h3>Je weet waar je staat</h3>
              <p>Een indicatie per onderdeel, met de zinnen uit jouw opdracht waar het om draait. Je ziet wat vragen oproept en wat juist voor je pleit.</p>
            </div>
            <div className={s.win} data-reveal style={{ transitionDelay: "0.12s" }}>
              <div className={s.art}>
                <div className={s.shapeB}>
                  <Image src="/home/privaat.jpg" alt="Twee mensen bespreken een opdracht achter hun laptops" fill sizes="(max-width: 920px) 80vw, 300px" />
                </div>
                <span className={`${s.deco} ${s.decoPlus}`} data-speed="0.3" aria-hidden="true">
                  ?
                </span>
              </div>
              <span className={s.num}>02</span>
              <h3>Je weet wat je moet zeggen</h3>
              <p>De weging in gewone taal, drie vragen voor het gesprek en de bronnen erbij: recente rechtspraak en de stand van handhaving en wetgeving.</p>
            </div>
            <div className={s.win} data-reveal style={{ transitionDelay: "0.24s" }}>
              <div className={s.art}>
                <div className={s.shapeC}>
                  <Image src="/home/publiek.jpg" alt="Zzp'er met laptop en telefoon aan een tafel bij het raam" fill sizes="(max-width: 920px) 80vw, 300px" />
                </div>
                <span className={`${s.deco} ${s.decoDoc}`} data-speed="-0.35" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <span className={s.num}>03</span>
              <h3>Je hebt iets om voor te leggen</h3>
              <p>Concrete verbeteringen en, als je dat wilt, een herschreven opdrachtomschrijving. Als PDF en Word, klaar om te delen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYSE IN ACTIE */}
      <section className={s.band}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>Een analyse in het echt</p>
            <p className={s.statement} data-reveal>
              Geen los cijfer, maar een oordeel dat je kunt volgen: <mark className={s.chipR}>wat vragen oproept</mark>,{" "}
              <mark className={s.chipG}>wat voor je pleit</mark> en wat je ermee doet.
            </p>
          </div>
          <div data-reveal>
            <Showcase />
          </div>
        </div>
      </section>

      {/* DE TRAP */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>Hoe het werkt</p>
            <p className={s.statement} data-reveal>
              De route <mark className={s.chipB}>Toets</mark> <mark className={s.chipG}>Verbeter</mark> <mark className={s.chipO}>Bespreek</mark> brengt je
              stap voor stap naar een opdracht die klopt met hoe je werkt.
            </p>
          </div>
          <div className={s.stairs}>
            <div className={s.stair} data-reveal>
              <span className={`${s.badge2} ${s.chipB}`}>01</span>
              <h3>Toets</h3>
              <b>Zie waar het schuurt</b>
              <ul>
                <li>Plak je opdracht of upload PDF of Word</li>
                <li>Indicatie per onderdeel</li>
                <li>De zinnen waar het om draait</li>
                <li>Wat de tekst niet zegt</li>
              </ul>
            </div>
            <div className={s.stair} data-reveal style={{ transitionDelay: "0.12s" }}>
              <span className={`${s.badge2} ${s.chipG}`}>02</span>
              <h3>Verbeter</h3>
              <b>Maak je opdracht sterker</b>
              <ul>
                <li>Drie verbeteringen, belangrijkste eerst</li>
                <li>Tekst of afspraak: je ziet wat nodig is</li>
                <li>Opnieuw toetsen en vergelijken</li>
              </ul>
            </div>
            <div className={s.stair} data-reveal style={{ transitionDelay: "0.24s" }}>
              <span className={`${s.badge2} ${s.chipO}`}>03</span>
              <h3>Bespreek</h3>
              <b>Ga voorbereid het gesprek in</b>
              <ul>
                <li>Drie vragen voor je opdrachtgever</li>
                <li>Bronnen en de actuele stand</li>
                <li>Opdrachtomschrijving op afroep</li>
                <li>Download als PDF en Word</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* VOOR WIE */}
      <section id="voor-wie" className={s.band}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>Voor wie</p>
            <p className={s.statement} data-reveal>
              Voor zzp&apos;ers in kenniswerk die zelf willen weten hoe hun opdracht ervoor staat, direct bij een opdrachtgever of via een
              intermediair.
            </p>
          </div>
          <div className={s.segs}>
            <Link href="/voor/publieke-sector" className={s.seg} data-reveal>
              <h3>Publieke sector</h3>
              <p>Interim-opdrachten bij ministeries, gemeenten en uitvoeringsorganisaties. Vaak langlopend en via een intermediair, waardoor inbedding en aansturing extra aandacht vragen.</p>
              <span className={s.more}>Bekijk de aandachtspunten</span>
            </Link>
            <Link href="/voor/private-sector" className={s.seg} data-reveal style={{ transitionDelay: "0.12s" }}>
              <h3>Private sector</h3>
              <p>IT, advies, projectmanagement, design en marketing. Vaak op projectbasis, waar een helder resultaat en je eigen werkwijze het verschil maken.</p>
              <span className={s.more}>Bekijk de aandachtspunten</span>
            </Link>
          </div>
          <p className={s.notfor}>
            Zoek je een bindend oordeel over je arbeidsrelatie? Dat geeft DBA Kompas niet. Daarvoor ga je naar een jurist of fiscalist. De
            analyse helpt je wel om dat gesprek beter voorbereid te voeren.
          </p>
        </div>
      </section>

      {/* WAAROM NU */}
      <section id="waarom" className={s.why}>
        <div className={s.wrap}>
          <h2 className={s.narrow}>Waarom zou je je opdracht nu toetsen?</h2>
          <p className={s.lead}>
            Omdat de Belastingdienst weer handhaaft en opdrachtgevers daardoor voorzichtiger zijn geworden. Dat merk je als zzp&apos;er
            direct: een intermediair vraagt extra stukken, een opdrachtgever wil de opdracht herzien of een verlenging blijft uit. Een
            naheffing bij je opdrachtgever kan bovendien aanleiding zijn om ook jouw aangiften opnieuw te bekijken.
          </p>
          <div className={s.tl}>
            <div>
              <i />
              <time>1 januari 2025</time>
              <h3>Handhaving hervat</h3>
              <p>De Belastingdienst handhaaft weer op schijnzelfstandigheid.</p>
            </div>
            <div>
              <i />
              <time>2025</time>
              <h3>Zachte landing</h3>
              <p>Bij een vermoeden volgt in beginsel eerst een bedrijfsbezoek.</p>
            </div>
            <div className={s.now}>
              <i />
              <time>2026, nu</time>
              <h3>Vergrijpboetes mogelijk</h3>
              <p>Geen verzuimboetes, wel vergrijpboetes. Naheffen kan in beginsel terug tot 1 januari 2025.</p>
            </div>
            <div>
              <i />
              <time>Daarna</time>
              <h3>Nieuwe regels in de maak</h3>
              <p>De Zelfstandigenwet was in oktober 2026 in consultatie, met januari 2028 als beoogde invoering. DBA Kompas wordt daarop onderhouden.</p>
            </div>
          </div>
          <Link href="/kennisbank/handhaving-2026" className={s.whyLink}>
            Lees hoe de Belastingdienst nu handhaaft
          </Link>
        </div>
      </section>


      {/* WAAR JE OP BOUWT */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>Waar je op bouwt</p>
            <p className={s.statement} data-reveal>
              Elke opdracht wordt getoetst op de <mark className={s.chipO}>negen gezichtspunten</mark> van de Hoge Raad, met rechtspraak en
              handhaving die elke dag wordt bijgewerkt.
            </p>
          </div>
          <div className={s.factGrid}>
            <div data-reveal><strong>9</strong><span>gezichtspunten waarop elke opdracht wordt getoetst</span></div>
            <div data-reveal><strong>3</strong><span>onderdelen met elk een eigen score en toelichting</span></div>
            <div data-reveal><strong>Elke dag</strong><span>een bijgewerkt overzicht van rechtspraak, handhaving en wetgeving</span></div>
            <div data-reveal><strong>± 1 min</strong><span>van opdracht naar volledige uitkomst, terwijl je al meeleest</span></div>
          </div>
        </div>
      </section>

      {/* MAKER */}
      <section id="methodiek" className={s.band}>
        <div className={`${s.wrap} ${s.makerGrid}`}>
          <div className={s.art} data-reveal>
            <div className={s.shapeMaker}>
              <Image src="/team/marvin-zoetemelk.jpg" alt="Marvin Zoetemelk, maker van DBA Kompas" fill sizes="(max-width: 920px) 80vw, 380px" />
            </div>
            <span className={`${s.deco} ${s.decoStar}`} data-speed="0.3" aria-hidden="true" />
          </div>
          <div data-reveal>
            <p className={s.label}>De maker</p>
            <blockquote className={s.statement}>
              “Ik zag dagelijks opdrachten stranden op formuleringen die makkelijk beter hadden gekund. Daar is DBA Kompas voor gebouwd.”
            </blockquote>
            <p className={s.answer}>
              <b>Marvin Zoetemelk</b> bouwde DBA Kompas vanuit de praktijk van externe inhuur, waar hij dagelijks ziet hoe opdrachtgevers en
              intermediairs naar zzp-opdrachten kijken. Die kennis zit in één vaste methodiek die je zelf kunt gebruiken.
            </p>
            <Link href="/over-dba-kompas" className={s.btnD} style={{ marginTop: 22 }}>
              Lees over de methodiek
            </Link>
          </div>
        </div>
      </section>

      {/* KENNISBANK */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>Uit de kennisbank</p>
            <p className={s.statement} data-reveal>
              Wat er verandert voor zzp&apos;ers, kort uitgelegd.
            </p>
          </div>
          <div className={s.news}>
            <Link href="/kennisbank/handhaving-2026" className={s.newsItem} data-reveal>
              <span>Bijgewerkt november 2026</span>
              <h3>Hoe handhaaft de Belastingdienst nu?</h3>
              <p>Vergrijpboetes zijn mogelijk, verzuimboetes nog niet. Wat dat betekent voor jou en je opdrachtgever.</p>
            </Link>
            <Link href="/kennisbank/zelfstandigenwet" className={s.newsItem} data-reveal style={{ transitionDelay: "0.12s" }}>
              <span>Bijgewerkt november 2026</span>
              <h3>De nieuwe wetgeving rond zelfstandigen</h3>
              <p>De Zelfstandigenwet was in consultatie, met januari 2028 als beoogde invoering. Wat er nu geldt.</p>
            </Link>
            <Link href="/kennisbank/deliveroo-criteria" className={s.newsItem} data-reveal style={{ transitionDelay: "0.24s" }}>
              <span>Achtergrond</span>
              <h3>De gezichtspunten uit het Deliveroo-arrest</h3>
              <p>Het kader waarmee rechters en de Belastingdienst naar je opdracht kijken, uitgelegd.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* PRIJZEN */}
      <section id="prijzen" className={s.sec}>
        <div className={s.wrap}>
          <h2 className={s.narrow}>Wat kost DBA Kompas?</h2>
          <p className={s.lead}>
            Eén check kost €9,95. Ter vergelijking: voor een beoordeling door een adviseur betaal je al snel €150 tot €300. Toets je vaker,
            dan is een abonnement voordeliger.
          </p>
          <div className={s.pg}>
            <div className={s.pc}>
              <h3>Eenmalige check</h3>
              <p className={s.pcSub}>Voor één opdracht die nu speelt.</p>
              <div className={s.amt}>
                €9,95 <small>eenmalig</small>
              </div>
              <div className={s.save} />
              <ul>
                <li>1 opdracht volledig getoetst</li>
                <li>Heranalyse binnen dezelfde check</li>
                <li>Herschreven opdrachtbrief</li>
                <li>Download als PDF en Word</li>
              </ul>
              <button type="button" className={s.btnD} onClick={() => onCheck("one_time_dba")}>
                Kies eenmalige check
              </button>
            </div>
            <div className={s.pcHot}>
              <span className={s.badge}>Voordeligst per maand</span>
              <h3>Jaarlijks</h3>
              <p className={s.pcSub}>Voor wie structureel als zelfstandige werkt.</p>
              <div className={s.amt}>
                €200 <small>per jaar</small>
              </div>
              <div className={s.save}>Bespaar €40 ten opzichte van maandelijks</div>
              <ul>
                <li>Tot 25 checks per maand</li>
                <li>Eerdere analyses terugzien en vergelijken</li>
                <li>Dagelijks nieuws over zzp-wetgeving</li>
                <li>Melding als er iets verandert</li>
              </ul>
              <button type="button" className={s.btnP} onClick={() => onCheck("yearly")}>
                Kies jaarlijks
              </button>
            </div>
            <div className={s.pc}>
              <h3>Maandelijks</h3>
              <p className={s.pcSub}>Voor wie regelmatig nieuwe opdrachten heeft.</p>
              <div className={s.amt}>
                €20 <small>per maand</small>
              </div>
              <div className={s.save} />
              <ul>
                <li>Tot 20 checks per maand</li>
                <li>Eerdere analyses terugzien en vergelijken</li>
                <li>Dagelijks nieuws over zzp-wetgeving</li>
                <li>Maandelijks opzegbaar</li>
              </ul>
              <button type="button" className={s.btnD} onClick={() => onCheck("monthly")}>
                Kies maandelijks
              </button>
            </div>
          </div>
          <p className={s.fine}>
            Prijzen excl. btw. Je betaalt veilig via Stripe en hoeft vooraf geen wachtwoord aan te maken. Nog niet zeker? Begin met de gratis
            zelfscan.
          </p>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className={s.sec}>
        <div className={`${s.wrap} ${s.splitTop}`}>
          <h2>Veelgestelde vragen</h2>
          <div className={s.faq}>
            {LANDING.faq.items.map((item, i) => (
              <details
                key={item.question}
                open={i === 0}
                onToggle={(e) => {
                  if ((e.currentTarget as HTMLDetailsElement).open) trackFaqOpened(item.question, "landing");
                }}
              >
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>


      {/* SLOT */}
      <section className={s.finalWrap}>
        <div className={s.final} data-reveal>
          <h2>
            Toets je opdracht vandaag,
            <br />
            niet pas als iemand ernaar vraagt.
          </h2>
          <p>Begin gratis met de zelfscan. Vijf vragen, geen account.</p>
          <button type="button" className={s.btnP} onClick={onZelfscan}>
            Start je gratis zelfscan
          </button>
        </div>
      </section>
    </div>
  );
}
