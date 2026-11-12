"use client";

import { useRef } from "react";
import Image from "next/image";
import s from "@/components/marketing/home-v3/home-v3.module.css";
import o from "./over-v3.module.css";
import { useScrollEffects } from "@/components/marketing/home-v3/HomeV3";
import { useMarketingModals } from "@/lib/store/marketingModals";

const ONDERDELEN = [
  {
    nrs: [1, 2, 3, 4],
    title: "Aansturing en gezag",
    short: "Wie bepaalt hoe en wanneer je werkt.",
    items: ["Aard en duur van het werk", "Werkwijze en werktijden", "Inbedding in de organisatie", "Persoonlijk uitvoeren"],
  },
  {
    nrs: [5, 6, 7, 8],
    title: "Eigen rekening en risico",
    short: "Wie draagt het risico en de kosten.",
    items: ["Hoe het contract tot stand kwam", "Hoe de beloning wordt bepaald", "Hoogte van de beloning", "Commercieel risico"],
  },
  {
    nrs: [9],
    title: "Ondernemerschap",
    short: "Of je je als ondernemer gedraagt.",
    items: ["Meerdere opdrachtgevers, acquisitie, reputatie"],
  },
];

const WEL = [
  "Een indicatie op basis van je eigen opdrachttekst",
  "Gebaseerd op de Wet DBA en uitspraken van de Hoge Raad",
  "Elke opdracht langs dezelfde vaste methode",
  "Gemaakt voor zzp-kenniswerkers, publiek en privaat",
];

const NIET = [
  "Geen juridisch advies",
  "Geen bindend oordeel",
  "Geen garantie richting Belastingdienst of opdrachtgever",
  "Geen vervanging van een jurist bij een geschil",
];

const BRONNEN = [
  { naam: "Hoge Raad", body: "Arresten over de arbeidsrelatie, zoals Deliveroo en Uber." },
  { naam: "Rechtspraak", body: "Nieuwe uitspraken van rechtbanken en hoven." },
  { naam: "Belastingdienst", body: "Handhaving en toelichtingen." },
  { naam: "Rijksoverheid en Tweede Kamer", body: "Wetsvoorstellen en beleid rond zzp." },
];

export function OverV3() {
  const root = useRef<HTMLDivElement>(null);
  useScrollEffects(root);
  const { openZelfscan } = useMarketingModals();

  return (
    <div className={s.root} ref={root}>
      {/* HERO */}
      <section className={o.hero}>
        <div className={s.wrap}>
          <h1>
            Eén vaste methodiek, <em>gebouwd vanuit de praktijk</em>
          </h1>
          <p>DBA Kompas laat zzp-kenniswerkers vooraf zien waar hun opdracht vragen oproept rond de Wet DBA.</p>
        </div>
      </section>

      {/* MAKER */}
      <section className={s.band}>
        <div className={`${s.wrap} ${s.makerGrid}`}>
          <div className={s.art} data-reveal>
            <div className={s.shapeMaker}>
              <Image src="/team/marvin-zoetemelk.jpg" alt="Marvin Zoetemelk, maker van DBA Kompas" fill sizes="(max-width: 920px) 80vw, 380px" />
            </div>
            <span className={`${s.deco} ${s.decoStar}`} data-speed="0.3" aria-hidden="true" />
          </div>
          <div data-reveal>
            <p className={s.label}>De maker</p>
            <p className={s.statement}>
              Marvin Zoetemelk beoordeelt al zes jaar opdrachten voor externe inhuur, onder meer voor{" "}
              <mark className={s.chipO}>gemeenten, GGD, COA en provincies</mark>.
            </p>
            <p className={s.answer}>
              Hij zag dat zzp&apos;ers een vaste, herhaalbare manier missen om hun opdracht te toetsen, zonder meteen een jurist in te schakelen.
              Daaruit groeide DBA Kompas.
            </p>
            <a href="mailto:info@dbakompas.nl" className={o.mail}>
              info@dbakompas.nl
            </a>
          </div>
        </div>
      </section>

      {/* METHODIEK */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>De methodiek</p>
            <p className={s.statement} data-reveal>
              De <mark className={s.chipO}>negen gezichtspunten</mark> uit het Deliveroo-arrest van de Hoge Raad, samengebracht in drie onderdelen.
            </p>
          </div>
          <div className={o.map}>
            {ONDERDELEN.map((g) => (
              <div key={g.title} className={o.grp} data-reveal>
                <div className={o.dots} aria-label={`Gezichtspunt ${g.nrs.join(", ")}`}>
                  {g.nrs.map((n) => (
                    <i key={n}>{n}</i>
                  ))}
                </div>
                <h3>{g.title}</h3>
                <p>{g.short}</p>
                <ul>
                  {g.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className={o.note} data-reveal>
            De punten worden in samenhang gewogen. Geen enkel punt is op zichzelf beslissend, en er is geen rangorde.
          </p>
        </div>
      </section>

      {/* WEL EN NIET */}
      <section className={s.band}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>Heldere grenzen</p>
            <p className={s.statement} data-reveal>
              Een hulpmiddel om je opdracht beter in te richten. <mark className={s.chipB}>Geen vervanging</mark> van een jurist.
            </p>
          </div>
          <div className={o.vs}>
            <div data-reveal>
              <h3>Wat het wel is</h3>
              <ul>
                {WEL.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div data-reveal>
              <h3>Wat het niet is</h3>
              <ul>
                {NIET.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BRONNEN */}
      <section className={s.sec}>
        <div className={s.wrap}>
          <div className={s.two}>
            <p className={s.label}>Bronnen</p>
            <p className={s.statement} data-reveal>
              Elke dag bijgewerkt. Verandert het kader, dan <mark className={s.chipG}>beweegt de analyse mee</mark>.
            </p>
          </div>
          <div className={o.src}>
            {BRONNEN.map((b) => (
              <div key={b.naam} data-reveal>
                <strong>{b.naam}</strong>
                <span>{b.body}</span>
              </div>
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
          <button type="button" className={s.btnP} onClick={openZelfscan}>
            Start je gratis zelfscan
          </button>
        </div>
      </section>
    </div>
  );
}
