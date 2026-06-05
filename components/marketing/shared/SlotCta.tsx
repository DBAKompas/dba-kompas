import Link from "next/link";
import { SplitWords } from "@/components/marketing/SplitWords";
import { SlotAnimations } from "@/components/marketing/SlotAnimations";

export function SlotCta({ href = "/?action=zelfscan" }: { href?: string }) {
  return (
    <section className="relative px-4 sm:px-6 py-14 md:py-32 max-w-7xl mx-auto w-full overflow-hidden">
      <SlotAnimations />
      <div
        data-slot-bg
        className="relative rounded-3xl bg-primary text-primary-foreground p-12 md:p-20 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-60 pointer-events-none" data-slot-mesh>
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>

        <svg
          viewBox="0 0 200 200"
          className="absolute top-1/2 right-[-50px] -translate-y-1/2 w-[400px] h-[400px] md:w-[500px] md:h-[500px] opacity-[0.07] text-accent pointer-events-none hidden md:block"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="100" y1="5" x2="100" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="100" y1="180" x2="100" y2="195" stroke="currentColor" strokeWidth="1" />
          <line x1="5" y1="100" x2="20" y2="100" stroke="currentColor" strokeWidth="1" />
          <line x1="180" y1="100" x2="195" y2="100" stroke="currentColor" strokeWidth="1" />
          <g data-slot-needle>
            <polygon points="100,25 108,100 100,108 92,100" fill="currentColor" />
            <polygon points="100,175 108,100 100,92 92,100" fill="currentColor" opacity="0.5" />
            <circle cx="100" cy="100" r="5" fill="currentColor" />
          </g>
        </svg>

        <div data-slot-decor-1 className="absolute top-12 right-12 w-3 h-3 rounded-full bg-accent pointer-events-none hidden md:block" />
        <div data-slot-decor-2 className="absolute bottom-16 left-16 w-4 h-4 rounded-full bg-accent/60 pointer-events-none hidden md:block" />
        <div data-slot-decor-3 className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-primary-foreground/40 pointer-events-none hidden md:block" />
        <div data-slot-decor-4 className="absolute bottom-1/3 right-1/3 w-2.5 h-2.5 rounded-full bg-accent/50 hidden md:block pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <p className="text-[13px] uppercase tracking-[0.08em] font-semibold text-accent mb-5">STARTEN</p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
            <SplitWords text="Toets je opdracht voor je het gesprek aangaat" dataAttr="data-slot-word" />
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-primary-foreground/80 mb-8 max-w-xl">
            <SplitWords
              text="Plak je opdracht en zie binnen een minuut waar de aandachtspunten zitten, met een herschreven opdrachtbrief als werkdocument."
              dataAttr="data-slot-word-body"
            />
          </p>

          <div className="inline-block" data-slot-cta-wrap>
            <Link
              href={href}
              data-slot-cta
              className="group relative inline-flex items-center gap-2 bg-accent text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-shadow duration-300 hover:shadow-2xl hover:shadow-accent/40"
            >
              <span>Start je gratis zelfscan</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 10 L17 10 M11 4 L17 10 L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
