'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getGuide, type GuideBlock, type GuideDifficulty } from '@/lib/guides/content'

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

const CALLOUT_CONFIG = {
  tip: {
    icon: Lightbulb,
    border: 'border-blue-400 dark:border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    title: 'text-blue-800 dark:text-blue-300',
    text: 'text-blue-900 dark:text-blue-200',
    icon_class: 'text-blue-500',
    default_title: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-400 dark:border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    title: 'text-amber-800 dark:text-amber-300',
    text: 'text-amber-900 dark:text-amber-200',
    icon_class: 'text-amber-500',
    default_title: 'Let op',
  },
  example: {
    icon: BookOpen,
    border: 'border-emerald-400 dark:border-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    title: 'text-emerald-800 dark:text-emerald-300',
    text: 'text-emerald-900 dark:text-emerald-200',
    icon_class: 'text-emerald-500',
    default_title: 'Voorbeeld',
  },
  important: {
    icon: AlertCircle,
    border: 'border-red-400 dark:border-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    title: 'text-red-800 dark:text-red-300',
    text: 'text-red-900 dark:text-red-200',
    icon_class: 'text-red-500',
    default_title: 'Belangrijk',
  },
}

function RenderBlock({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-muted-foreground leading-relaxed text-[15px]">
          {block.text}
        </p>
      )

    case 'heading':
      if (block.level === 3) {
        return (
          <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">
            {block.text}
          </h3>
        )
      }
      return (
        <h2 className="text-lg font-bold mt-8 mb-3 text-foreground border-b border-border pb-1.5">
          {block.text}
        </h2>
      )

    case 'list':
      if (block.ordered) {
        return (
          <ol className="space-y-2 pl-1">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] text-muted-foreground leading-relaxed">
                <span className="shrink-0 mt-0.5 size-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        )
      }
      return (
        <ul className="space-y-2 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] text-muted-foreground leading-relaxed">
              <span className="shrink-0 mt-2 size-1.5 rounded-full bg-primary/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'callout': {
      const cfg = CALLOUT_CONFIG[block.variant]
      const Icon = cfg.icon
      const title = block.title ?? cfg.default_title
      return (
        <div className={`rounded-xl border-l-4 px-4 py-3.5 ${cfg.border} ${cfg.bg}`}>
          <div className="flex items-start gap-2.5">
            <Icon className={`size-4 shrink-0 mt-0.5 ${cfg.icon_class}`} />
            <div className="space-y-1">
              {title && (
                <p className={`text-sm font-semibold ${cfg.title}`}>{title}</p>
              )}
              <p className={`text-sm leading-relaxed whitespace-pre-line ${cfg.text}`}>
                {block.text}
              </p>
            </div>
          </div>
        </div>
      )
    }

    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-2.5 text-left font-semibold text-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 text-muted-foreground leading-relaxed align-top"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'divider':
      return <hr className="border-border my-2" />

    default:
      return null
  }
}

export default function GuideDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const guide = getGuide(slug)

  if (!guide) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/gidsen')}>
          <ArrowLeft className="size-4 mr-2" />
          Terug naar gidsen
        </Button>
        <p className="text-muted-foreground">Deze gids bestaat niet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/gidsen')}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="size-4 mr-2" />
        Terug naar gidsen
      </Button>

      <div className="mb-8 pb-6 border-b border-border">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
            {guide.category}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_CLASS[guide.difficulty]}`}
          >
            {DIFFICULTY_LABEL[guide.difficulty]}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {guide.readingTime} min leestijd
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2">{guide.title}</h1>
        <p className="text-muted-foreground text-[15px]">{guide.subtitle}</p>

        {guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {guide.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {guide.blocks.map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/gidsen')}
          className="-ml-2"
        >
          <ArrowLeft className="size-4 mr-2" />
          Alle gidsen bekijken
        </Button>
      </div>
    </div>
  )
}
