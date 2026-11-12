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

function Demo() {
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
    <div className={s.demo}>
      <div className={s.demoTop}>Een greep uit een analyse. Kies een voorbeeld.</div>
      <div className={s.tabs}>
        {EXAMPLES.map((e, i) => (
          <button key={e.name} type="button" className={i === idx ? s.tabOn : s.tab} onClick={() => pick(i)} aria-pressed={i === idx}>
            {e.name}
          </button>
        ))}
      </div>
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
          <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
            <circle className={s.ringBg} cx="66" cy="66" r="55" />
            <circle
              className={s.ringFg}
              cx="66"
              cy="66"
              r="55"
              style={{
                stroke: LEVEL_COLOR[ex.level],
                strokeDashoffset: done ? 345 - (345 * LEVEL_RING[ex.level]) / 100 : 345,
              }}
            />
          </svg>
          <div className={s.ringTxt}>
            <strong className={s.ringWord}>{done ? LEVEL_WORD[ex.level] : "…"}</strong>
            <small>{done ? "risico" : "bezig met toetsen"}</small>
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
          <p className={s.barNote}>100 wijst sterk op zelfstandigheid</p>
        </div>
      </div>
      {done && (
        <div key={`ins-${idx}`} className={s.insights}>
          <div className={s.ins}>
            <b>Wat het zwaarst weegt</b>
            <p>{ex.zwaarst}</p>
          </div>
          <div className={s.ins}>
            <b>Vraag voor je opdrachtgever</b>
            <p>{ex.vraag}</p>
          </div>
          <div className={s.ins}>
            <b>Bron</b>
            <p>
              <a href={`https://uitspraken.rechtspraak.nl/details?id=${encodeURIComponent(ex.bron.ecli)}`} target="_blank" rel="noopener noreferrer">
                {ex.bron.titel}
              </a>
              . {ex.bron.relevantie}
            </p>
          </div>
        </div>
      )}
      {done && (
        <div className={s.more2}>
          <b>Dit is een fragment.</b> De volledige analyse geeft per onderdeel de zinnen die tellen, wat de tekst niet zegt, drie
          verbeteringen, de weging, drie gespreksvragen, alle bronnen met de actuele stand van handhaving en wetgeving, en een
          herschreven opdrachtomschrijving wanneer je daarom vraagt.
        </div>
      )}
      <div className={s.demoFoot}>
        Uitkomst van DBA Kompas op een fictieve opdracht, hier ingekort weergegeven. Een indicatie, geen juridisch oordeel.
      </div>
    </div>
  );
}

/** Laadt de achtergrondvideo alleen op brede schermen en zonder 'minder beweging'. */
function HeroVideo() {
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
  return <video ref={ref} className={s.bgv} muted loop playsInline preload="none" poster="/home/gesprek-poster.jpg" aria-hidden="true" />;
}

export function HomeV3({ onZelfscan, onCheck }: { onZelfscan: () => void; onCheck: (plan: Plan) => void }) {
  return (
    <div className={s.root}>
      {/* HERO */}
      <section id="hero" className={s.hero}>
        <HeroVideo />
        <div className={`${s.wrap} ${s.heroGrid}`}>
          <div>
            <h1>Weet waar je opdracht vragen oproept, voordat je opdrachtgever het vraagt.</h1>
            <p className={s.sub}>
              Plak je opdrachtomschrijving. Binnen een minuut zie je per onderdeel waar het schuurt met de Wet DBA, wat juist voor je
              zelfstandigheid pleit en hoe je de tekst sterker maakt.
            </p>
            <div className={s.cta}>
              <button type="button" className={s.btnP} onClick={onZelfscan}>
                Start je gratis zelfscan
              </button>
              <button type="button" className={s.btnG} onClick={() => onCheck("one_time_dba")}>
                Toets je opdracht voor €9,95
              </button>
            </div>
            <p className={s.quiet}>De zelfscan is gratis: vijf vragen, geen account. Een volledige check kost eenmalig €9,95.</p>
          </div>
          <Demo />
        </div>
      </section>

      {/* ANTWOORD */}
      <section id="antwoord" className={s.ans}>
        <div className={`${s.wrap} ${s.splitTop}`}>
          <div>
            <h2>Wat is DBA Kompas?</h2>
            <p className={s.lead}>{LANDING.answerBlock}</p>
            <p className={s.basis}>
              De toets volgt de gezichtspunten uit het Deliveroo-arrest van de Hoge Raad en het beoordelingskader van de Belastingdienst.{" "}
              <Link href="/over-dba-kompas" className="underline underline-offset-4">
                Lees over de methodiek
              </Link>
            </p>
          </div>
          <ol className={s.how}>
            <li>
              <b>Plak of upload je opdracht.</b> De tekst zoals je die van je opdrachtgever of intermediair kreeg, als PDF, Word of platte
              tekst.
            </li>
            <li>
              <b>Lees waar het schuurt.</b> Per onderdeel zie je welke zinnen vragen oproepen en welke juist voor je pleiten.
            </li>
            <li>
              <b>Ga voorbereid het gesprek in.</b> Met actiepunten en een herschreven opdrachtbrief die je kunt voorleggen.
            </li>
          </ol>
        </div>
      </section>

      {/* WAT KRIJG JE */}
      <section id="functies" className={s.sec}>
        <div className={`${s.wrap} ${s.split}`}>
          <figure className={s.tall}>
            <Image src="/home/werken.jpg" alt="Zzp'er werkt aan een opdrachtomschrijving op een laptop" fill sizes="(max-width: 920px) 100vw, 480px" />
          </figure>
          <div>
            <h2>Wat krijg je na een check?</h2>
            <p className={s.lead}>
              Geen los cijfer, maar een werkdocument. Zinnen die vragen oproepen worden herschreven naar resultaat, eigen werkwijze en eigen
              risico. Jij bepaalt wat klopt met hoe je in de praktijk werkt.
            </p>
            <div className={s.diff}>
              <div className={s.old}>
                <small>Staat er nu</small>
                <s>Werkt onder aansturing van de teammanager</s> en is <s>vier dagen per week op kantoor aanwezig</s>.
              </div>
              <div className={s.new}>
                <small>Voorstel</small>
                Levert de afgesproken resultaten op en rapporteert daarover aan de opdrachtgever. Bepaalt zelf waar en wanneer het werk
                plaatsvindt.
              </div>
            </div>
            <ul className={s.plain}>
              <li>
                <b>Een indicatie per onderdeel.</b> Gezag, eigen rekening en risico, en ondernemerschap. Bij elk onderdeel staan de zinnen
                waar het om draait.
              </li>
              <li>
                <b>Ook wat vóór je pleit.</b> Je ziet niet alleen de risico&apos;s, maar ook de signalen van zelfstandigheid die je kunt
                benadrukken.
              </li>
              <li>
                <b>Actiepunten voor het gesprek.</b> Wat je met je opdrachtgever of intermediair kunt bespreken of laten vastleggen.
              </li>
              <li>
                <b>Heranalyse met vergelijking.</b> Pas je opdracht aan en zie naast elkaar wat er veranderd is.
              </li>
              <li>
                <b>Download als PDF en Word.</b> Deel de analyse of werk verder in je eigen document.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* VOOR WIE */}
      <section id="voor-wie" className={`${s.sec} ${s.tint}`}>
        <div className={s.wrap}>
          <h2 className={s.narrow}>Voor wie is DBA Kompas bedoeld?</h2>
          <p className={s.lead}>
            Voor zzp&apos;ers in kenniswerk die zelf willen weten hoe hun opdracht ervoor staat, of ze nu direct voor een opdrachtgever
            werken of via een intermediair.
          </p>
          <div className={s.tiles}>
            <Link href="/voor/publieke-sector" className={s.tile}>
              <Image src="/home/publiek.jpg" alt="Zzp'er met laptop en telefoon aan een tafel bij het raam" fill sizes="(max-width: 920px) 100vw, 560px" />
              <div className={s.tileTxt}>
                <h3>Publieke sector</h3>
                <p>
                  Interim-opdrachten bij ministeries, gemeenten en uitvoeringsorganisaties. Vaak langlopend en via een intermediair, waardoor
                  inbedding en aansturing extra aandacht vragen.
                </p>
                <span className={s.more}>Bekijk de aandachtspunten</span>
              </div>
            </Link>
            <Link href="/voor/private-sector" className={s.tile}>
              <Image src="/home/privaat.jpg" alt="Twee mensen werken samen aan laptops, van bovenaf gezien" fill sizes="(max-width: 920px) 100vw, 560px" />
              <div className={s.tileTxt}>
                <h3>Private sector</h3>
                <p>
                  IT, advies, projectmanagement, design en marketing. Vaak op projectbasis, waar een helder resultaat en je eigen werkwijze
                  het verschil maken.
                </p>
                <span className={s.more}>Bekijk de aandachtspunten</span>
              </div>
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

      {/* CHATGPT */}
      <section id="chatgpt" className={`${s.sec} ${s.tint}`}>
        <div className={s.wrap}>
          <h2 className={s.narrow}>Kan ChatGPT dit niet ook?</h2>
          <p className={s.lead}>
            Je kunt een eind komen, als je weet welke vragen je moet stellen. DBA Kompas neemt je dat werk uit handen en doet elke keer
            dezelfde toets.
          </p>
          <div className={s.vsg}>
            <div className={s.vsA}>
              <h3>Een algemene chatbot</h3>
              <ul>
                <li>De uitkomst hangt af van hoe je de vraag stelt</li>
                <li>Gaat snel mee in het antwoord dat je hoopt te horen</li>
                <li>Je moet zelf vragen naar het juiste kader en recente uitspraken</li>
                <li>Het antwoord staat ergens in een chatgeschiedenis</li>
              </ul>
            </div>
            <div className={s.vsB}>
              <h3>DBA Kompas</h3>
              <ul>
                <li>Eén vaste methodiek, dus opdrachten zijn onderling vergelijkbaar</li>
                <li>Benoemt ook wat niet klopt en wijst op tegenstrijdigheden in je tekst</li>
                <li>Getoetst aan het Deliveroo-kader en de Wet DBA, zonder dat je erom vraagt</li>
                <li>Analyse en herschreven opdracht als PDF en Word in je account</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MAKER */}
      <section id="methodiek" className={`${s.sec} ${s.maker}`}>
        <div className={`${s.wrap} ${s.splitRev}`}>
          <div>
            <blockquote className={s.quote}>
              “Ik zag dagelijks opdrachten stranden op formuleringen die makkelijk beter hadden gekund. Daar is DBA Kompas voor gebouwd.”
            </blockquote>
            <p>
              <b>Marvin Zoetemelk</b> bouwde DBA Kompas vanuit de praktijk van externe inhuur, waar hij dagelijks ziet hoe opdrachtgevers en
              intermediairs naar zzp-opdrachten kijken. Die kennis zit in één vaste methodiek die je zelf kunt gebruiken.
            </p>
            <Link href="/over-dba-kompas" className={s.btnD} style={{ marginTop: 22 }}>
              Lees over de methodiek
            </Link>
          </div>
          <figure className={s.portrait}>
            <Image src="/team/marvin-zoetemelk.jpg" alt="Marvin Zoetemelk, maker van DBA Kompas" fill sizes="(max-width: 920px) 100vw, 420px" />
          </figure>
        </div>
      </section>

      {/* PRIJZEN */}
      <section id="prijzen" className={`${s.sec} ${s.tint}`}>
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
      <section className={s.final}>
        <Image src="/home/slot.jpg" alt="" fill sizes="100vw" />
        <div className={s.finalIn}>
          <h2>Toets je opdracht vandaag, niet pas als iemand ernaar vraagt.</h2>
          <p>Begin gratis met de zelfscan. Het kost je een minuut en je hebt geen account nodig.</p>
          <button type="button" className={s.btnP} onClick={onZelfscan}>
            Start je gratis zelfscan
          </button>
        </div>
      </section>
    </div>
  );
}
