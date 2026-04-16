'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Users, Mail } from 'lucide-react'

const tiles = [
  {
    href: '/admin/gebruikers',
    title: 'Gebruikers',
    description: 'Bekijk alle geregistreerde gebruikers, hun abonnement en rol.',
    icon: <Users className="size-5" />,
  },
  {
    href: '/admin/emails',
    title: 'E-mails',
    description: 'Beheer e-mailtemplates en stuur handmatige digest-mails.',
    icon: <Mail className="size-5" />,
  },
]

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && user && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, loading, isAdmin, router])

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Control Tower</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Beheer van de DBA Kompas applicatie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="border-border/50 hover:border-border transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-base">
                  <span className="text-muted-foreground">{tile.icon}</span>
                  {tile.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tile.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
