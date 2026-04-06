'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react'

export default function AnalysePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setMode('file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      setFile(dropped)
      setMode('file')
    }
  }

  const handleSubmit = () => {
    setShowDisclaimer(true)
  }

  const confirmSubmit = async () => {
    setShowDisclaimer(false)
    setLoading(true)
    setError(null)

    try {
      let response: Response

      if (mode === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch('/api/dba/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      const data = await response.json()
      router.push(`/analyse/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  const canSubmit = mode === 'text' ? text.trim().length > 0 : file !== null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">DBA Analyse</h1>
        <p className="text-muted-foreground">
          Upload een document of plak tekst om te analyseren op DBA-compliance
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'text' ? 'default' : 'outline'}
          onClick={() => setMode('text')}
        >
          <FileText className="size-4" />
          Tekst plakken
        </Button>
        <Button
          variant={mode === 'file' ? 'default' : 'outline'}
          onClick={() => setMode('file')}
        >
          <Upload className="size-4" />
          Bestand uploaden
        </Button>
      </div>

      {/* Text input */}
      {mode === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle>Tekst invoeren</CardTitle>
            <CardDescription>
              Plak de tekst van uw overeenkomst hieronder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="min-h-[250px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Plak hier de tekst van uw overeenkomst..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{charCount} tekens</span>
              <span>{wordCount} woorden</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File upload */}
      {mode === 'file' && (
        <Card>
          <CardHeader>
            <CardTitle>Bestand uploaden</CardTitle>
            <CardDescription>
              Upload een PDF of DOCX bestand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="size-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="size-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sleep een bestand hierheen of klik om te uploaden
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF of DOCX (max. 10MB)
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full"
        size="lg"
        disabled={!canSubmit || loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Analyse wordt uitgevoerd...
          </>
        ) : (
          'Analyse starten'
        )}
      </Button>

      {/* Disclaimer modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deze analyse is een hulpmiddel en vervangt geen juridisch advies.
                De resultaten zijn indicatief en gebaseerd op de aangeleverde tekst.
                Raadpleeg altijd een juridisch specialist voor definitieve beoordeling.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDisclaimer(false)}>
                  Annuleren
                </Button>
                <Button onClick={confirmSubmit}>
                  Begrepen, doorgaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
