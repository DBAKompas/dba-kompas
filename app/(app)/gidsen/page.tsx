'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Guide {
  slug: string
  title: string
  description: string
  category: string
}

const GUIDES: Guide[] = [
  {
    slug: 'wat-is-wet-dba',
    title: 'Wat is de Wet DBA?',
    description:
      'Een complete uitleg over de Wet Deregulering Beoordeling Arbeidsrelaties en wat het betekent voor zzp\'ers en opdrachtgevers.',
    category: 'Basiskennis',
  },
  {
    slug: 'gezagsverhouding',
    title: 'Gezagsverhouding herkennen',
    description:
      'Hoe herken je kenmerken van een gezagsverhouding in je opdrachtrelatie? Leer de signalen en risico\'s.',
    category: 'Risicofactoren',
  },
  {
    slug: 'zelfstandigheid-aantonen',
    title: 'Zelfstandigheid aantonen',
    description:
      'Praktische tips om je zelfstandigheid als zzp\'er te onderbouwen en risico\'s te minimaliseren.',
    category: 'Praktisch',
  },
  {
    slug: 'opdrachtomschrijving-verbeteren',
    title: 'Opdrachtomschrijving verbeteren',
    description:
      'Hoe schrijf je een opdrachtomschrijving die voldoet aan de criteria van de Wet DBA?',
    category: 'Praktisch',
  },
  {
    slug: 'handhaving-belastingdienst',
    title: 'Handhaving door de Belastingdienst',
    description:
      'Wat kun je verwachten bij handhaving en hoe bereid je je voor?',
    category: 'Juridisch',
  },
]

export default function GidsenPage() {
  const categories = [...new Set(GUIDES.map((g) => g.category))]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Gidsen</h1>
        <p className="text-muted-foreground mt-1">
          Verdiep je in de Wet DBA met onze praktische gidsen en uitleg.
        </p>
      </div>

      {categories.map((category) => (
        <section key={category}>
          <h2 className="text-lg font-semibold mb-3">{category}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {GUIDES.filter((g) => g.category === category).map((guide) => (
              <Link key={guide.slug} href={`/gidsen/${guide.slug}`}>
                <Card className="h-full hover:border-primary/40 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <BookOpen className="size-5 text-primary mt-0.5 shrink-0" />
                      <CardTitle className="text-base">{guide.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {guide.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                      Lees meer <ArrowRight className="size-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
