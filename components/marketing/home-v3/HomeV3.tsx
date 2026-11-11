"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LANDING } from "@/content/landing.nl";
import { FaqAccordion } from "@/components/marketing/faq/FaqAccordion";
import s from "./home-v3.module.css";

type Plan = "monthly" | "yearly" | "one_time_dba";
type Level = "laag" | "midden" | "hoog";
type Part = { t: string; m?: "r" | "g" };

type Example = {
  name: string;
  score: number;
  level: Level;
  parts: Part[];
  bars: { label: string; pct: number; level: Level }[];
  tip: string;
};

// Fictieve voorbeeldopdrachten voor de demo in de hero. Geen echte gebruikersdata.
const EXAMPLES: Example[] = [
  {
    name: "Interim projectleider",
    score: 58,
    level: "midden",
    parts: [
      { t: "Je " },
      { t: "werkt onder aansturing van de teammanager", m: "r" },
      { t: " en bent " },
      { t: "vier dagen per week op kantoor aanwezig", m: "r" },
      { t: ". Je " },
      { t: "levert een implementatieplan op tegen een vaste prijs", m: "g" },
      { t: " en " },
      { t: "mag je laten vervangen", m: "g" },
      { t: " door een gelijkwaardige professional." },
    ],
    bars: [
      { label: "Aansturing en gezag", pct: 72, level: "hoog" },
      { label: "Eigen rekening en risico", pct: 34, level: "laag" },
      { label: "Ondernemerschap", pct: 48, level: "midden" },
    ],
    tip: "Beschrijf het resultaat en aan wie je daarover rapporteert, in plaats van wie je aanstuurt.",
  },
  {
    name: "IT-consultant",
    score: 24,
    level: "laag",
    parts: [
      { t: "Je " },
      { t: "bepaalt zelf de technische aanpak en planning", m: "g" },
      { t: ", werkt " },
      { t: "met eigen apparatuur", m: "g" },
      { t: " en " },
      { t: "factureert per opgeleverde mijlpaal", m: "g" },
      { t: ". Wekelijks is er een " },
      { t: "verplicht teamoverleg", m: "r" },
      { t: " op locatie." },
    ],
    bars: [
      { label: "Aansturing en gezag", pct: 31, level: "laag" },
      { label: "Eigen rekening en risico", pct: 18, level: "laag" },
      { label: "Ondernemerschap", pct: 22, level: "laag" },
    ],
    tip: "Maak van het wekelijkse overleg een afstemming over voortgang, zonder aanwezigheidsplicht.",
  },
  {
    name: "Beleidsadviseur",
    score: 81,
    level: "hoog",
    parts: [
      { t: "Je " },
      { t: "vervangt een zieke medewerker", m: "r" },
      { t: ", " },
      { t: "werkt 36 uur per week volgens het rooster van de afdeling", m: "r" },
      { t: " en " },
      { t: "gebruikt een laptop van de opdrachtgever", m: "r" },
      { t: ". De opdracht loopt " },
      { t: "tot nader order", m: "r" },
      { t: " op uurbasis." },
    ],
    bars: [
      { label: "Aansturing en gezag", pct: 88, level: "hoog" },
      { label: "Eigen rekening en risico", pct: 79, level: "hoog" },
      { label: "Ondernemerschap", pct: 70, level: "hoog" },
    ],
    tip: "Deze opdracht lijkt op een dienstverband. Bespreek met je opdrachtgever of een afgebakend resultaat mogelijk is.",
  },
];

const LEVEL_COLOR: Record<Level, string> = {
  laag: "var(--ok)",
  midden: "var(--mid)",
  hoog: "var(--bad)",
};
const LEVEL_LABEL: Record<Level, string> = {
  laag: "laag risico",
  midden: "gemiddeld risico",
  hoog: "hoog risico",
};

function Demo() {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState(0);
  const ex = EXAMPLES[idx];

  useEffect(() => {
    let raf = 0;
    const timer = window.setTimeout(() => {
      setDone(true);
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 900);
        setShown(Math.round(ex.score * p));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, 1300);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [idx, ex.score]);

  function pick(i: number) {
    if (i === idx) return;
    setDone(false);
    setShown(0);
    setIdx(i);
  }

  return (
    <div className={s.demo}>
      <div className={s.demoTop}>Kies een voorbeeldopdracht en kijk wat er gebeurt</div>
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
                strokeDashoffset: done ? 345 - (345 * ex.score) / 100 : 345,
              }}
            />
          </svg>
          <div className={s.ringTxt}>
            <strong>{shown}%</strong>
            <small>{done ? LEVEL_LABEL[ex.level] : "bezig met toetsen"}</small>
          </div>
        </div>
        <div className={s.bars}>
          {ex.bars.map((b) => (
            <div key={b.label}>
              <div className={s.barLabel}>
                {b.label}
                <span>{b.level}</span>
              </div>
              <div className={s.track}>
                <i style={{ width: done ? `${b.pct}%` : 0, background: LEVEL_COLOR[b.level] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={s.tip}>{done ? ex.tip : ""}</div>
      <div className={s.demoFoot}>Voorbeeld met een fictieve opdracht. Een uitkomst is een indicatie, geen juridisch oordeel.</div>
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
              <p>Geen verzuimboetes, wel boetes bij opzet of grove schuld. Naheffen kan terug tot 1 januari 2025.</p>
            </div>
            <div>
              <i />
              <time>Daarna</time>
              <h3>Nieuwe regels in de maak</h3>
              <p>Er wordt gewerkt aan nieuwe wetgeving voor zelfstandigen. DBA Kompas wordt daarop onderhouden.</p>
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
            <h2>Gebouwd vanuit de praktijk van externe inhuur.</h2>
            <p>
              <b>Marvin Zoetemelk</b> bouwde DBA Kompas vanuit de praktijk van externe inhuur, waar hij dagelijks ziet hoe opdrachtgevers en
              intermediairs naar zzp-opdrachten kijken. Die kennis zit in één vaste methodiek die je zelf kunt gebruiken.
            </p>
            <Link href="/over-dba-kompas" className={s.btnD} style={{ marginTop: 22 }}>
              Lees over de maker en de methodiek
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
        <div className={s.wrap}>
          <h2 style={{ textAlign: "center", marginBottom: 40 }}>Veelgestelde vragen</h2>
          <FaqAccordion items={LANDING.faq.items} />
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
