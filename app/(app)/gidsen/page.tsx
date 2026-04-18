import Link from 'next/link'
import { BookOpen, Clock, ChevronRight } from 'lucide-react'
import { GUIDES, CATEGORIES, type GuideDifficulty } from '@/lib/guides/content'

const DIFFICULTY_LABEL: Record<GuideDifficulty, string> = {
  basis: 'Basis',
  gevorderd: 'Gevorderd',
  expert: 'Expert',
}

const DIFFICULTY_CLASS: Record<GuideDifficulty, string> = {
  basis:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  gevorderd:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function GidsenPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gidsen</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Verdiep je kennis over de Wet DBA, fiscale verplichtingen en
          ondernemerschap — geschreven voor zzp&apos;ers die het écht willen
          begrijpen.
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const guides = GUIDES.filter((g) => g.category === category)
        return (
          <section key={category}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-semibold">{category}</h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground shrink-0">
                {guides.length} {guides.length === 1 ? 'gids' : 'gidsen'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/gidsen/${guide.slug}`}
                  className="group block h-full"
                >
                  <div className="rounded-xl border border-border bg-card px-5 pt-5 pb-4 h-full transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 shrink-0">
                        <BookOpen className="size-4 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${DIFFICULTY_CLASS[guide.difficulty]}`}
                          >
                            {DIFFICULTY_LABEL[guide.difficulty]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="size-3" />
                            {guide.readingTime} min leestijd
                          </span>
                        </div>

                        <h3 className="font-semibold text-sm leading-snug mb-0.5 group-hover:text-primary transition-colors">
                          {guide.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                          {guide.subtitle}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {guide.description}
                        </p>

                        <span className="inline-flex items-center gap-1 text-xs text-primary mt-3 font-medium">
                          Lees gids{' '}
                          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
