'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      }
    case 'processing':
    case 'verwerken':
      return {
        label: 'Verwerken',
        className: 'bg-amber-100 text-amber-800',
        icon: Clock,
      }
    case 'failed':
    case 'mislukt':
      return {
        label: 'Mislukt',
        className: 'bg-red-100 text-red-800',
        icon: AlertCircle,
      }
    default:
      return {
        label: status || 'Onbekend',
        className: 'bg-gray-100 text-gray-800',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documenten</h1>
          <p className="text-muted-foreground">Uw geüploade documenten en analyses</p>
        </div>
        <Button asChild>
          <Link href="/analyse">
            <Upload className="size-4" />
            Nieuw document
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="mx-auto size-12 mb-3" />
            <p className="text-lg font-medium">Geen documenten</p>
            <p className="mt-1 text-sm">
              Upload uw eerste document om een DBA-analyse te starten
            </p>
            <Button className="mt-4" asChild>
              <Link href="/analyse">
                <Upload className="size-4" />
                Document uploaden
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const statusInfo = getStatusBadge(doc.status)
            const StatusIcon = statusInfo.icon
            return (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-muted-foreground" />
                      <div>
                        <CardTitle>{doc.filename}</CardTitle>
                        <CardDescription>
                          {doc.uploaded_at
                            ? new Date(doc.uploaded_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'Datum onbekend'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
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
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
