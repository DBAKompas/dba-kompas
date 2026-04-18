import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { GUIDES, CATEGORIES, type GuideDifficulty } from '@/lib/guides/content'

const DIFFICULTY_LABEL: Record<GuideDifficulty, string> = {
  basis: 'Basis',
  gevorderd: 'Gevorderd',
  expert: 'Expert',
}

const DIFFICULTY_CLASS: Record<GuideDifficulty, string> = {
  basis: 'bg-emerald-100 text-emerald-700',
  gevorderd: 'bg-amber-100 text-amber-700',
  expert: 'bg-red-100 text-red-700',
}

export default function GidsenPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gidsen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kennisbronnen over de Wet DBA, fiscale verplichtingen en ondernemerschap.
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const guides = GUIDES.filter((g) => g.category === category)
        return (
          <section key={category}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground shrink-0">
                {guides.length}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/gidsen/${guide.slug}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${DIFFICULTY_CLASS[guide.difficulty]}`}
                    >
                      {DIFFICULTY_LABEL[guide.difficulty]}
                    </span>
                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {guide.title}
                    </span>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
