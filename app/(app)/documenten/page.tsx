'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Upload,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'

interface Document {
  id: string
  filename: string
  status: string
  uploaded_at: string
  assessment_id?: string
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'voltooid':
      return {
        label: 'Voltooid',
        className: 'bg-emerald-100 text-emerald-700',
        icon: CheckCircle,
      }
    case 'processing':
    case 'verwerken':
      return {
        label: 'Verwerken',
        className: 'bg-amber-100 text-amber-700',
        icon: Clock,
      }
    case 'failed':
    case 'mislukt':
      return {
        label: 'Mislukt',
        className: 'bg-red-100 text-red-700',
        icon: AlertCircle,
      }
    default:
      return {
        label: status || 'Onbekend',
        className: 'bg-muted text-muted-foreground',
        icon: Clock,
      }
  }
}

export default function DocumentenPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => {
        setDocuments(Array.isArray(data) ? data : data.documents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documenten</h1>
          <p className="text-sm text-muted-foreground mt-1">Uw geüploade documenten en analyses</p>
        </div>
        <Button asChild>
          <Link href="/analyse">
            <Upload className="size-4" />
            Nieuw document
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <FolderOpen className="mx-auto size-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">Geen documenten</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload uw eerste document om een DBA-analyse te starten
          </p>
          <Button className="mt-6" asChild>
            <Link href="/analyse">
              <Upload className="size-4" />
              Document uploaden
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const statusInfo = getStatusBadge(doc.status)
            const StatusIcon = statusInfo.icon
            return (
              <div key={doc.id} className="rounded-xl border border-border bg-card px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Datum onbekend'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                    >
                      <StatusIcon className="size-3" />
                      {statusInfo.label}
                    </span>
                    {doc.assessment_id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/analyse/${doc.assessment_id}`}>
                          Bekijk analyse
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
