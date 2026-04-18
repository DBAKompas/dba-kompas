'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  X,
  HelpCircle,
  CheckCircle,
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
  const [insufficientInput, setInsufficientInput] = useState<{
    summary: string
    missing: string[]
    next_needed: string[]
  } | null>(null)

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
    setInsufficientInput(null)

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
          body: JSON.stringify({ inputText: text }),
        })
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Er is een fout opgetreden')
      }

      const data = await response.json()

      if (data.status === 'insufficient_input' || data.status === 'needs_more_input') {
        setInsufficientInput({
          summary: data.summary || 'Meer informatie nodig om de analyse uit te voeren.',
          missing: Array.isArray(data.missing) ? data.missing : [],
          next_needed: Array.isArray(data.next_needed) ? data.next_needed : [],
        })
        setLoading(false)
        return
      }

      router.push(`/analyse/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden')
      setLoading(false)
    }
  }

  const canSubmit = mode === 'text' ? text.trim().length > 0 : file !== null

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DBA Analyse</h1>
        <p className="text-sm text-muted-foreground mt-1">
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
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Tekst invoeren</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Plak de tekst van uw overeenkomst hieronder
            </p>
          </div>
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
        </div>
      )}

      {/* File upload */}
      {mode === 'file' && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Bestand uploaden</h2>
            <p className="text-sm text-muted-foreground mt-1">Upload een PDF of DOCX bestand</p>
          </div>
          <div
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
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
                <p className="text-xs text-muted-foreground">PDF of DOCX (max. 10MB)</p>
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
        </div>
      )}

      {/* Onvoldoende invoer feedback */}
      {insufficientInput && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="size-5 text-amber-600" />
            <h2 className="text-base font-semibold text-amber-800">Meer informatie nodig</h2>
          </div>
          <p className="text-sm text-amber-700 mb-4">{insufficientInput.summary}</p>
          {insufficientInput.next_needed.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-amber-800 mb-2">Beantwoord deze vragen in uw tekst:</p>
              <ul className="space-y-2">
                {insufficientInput.next_needed.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <CheckCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insufficientInput.missing.length > 0 && (
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Ontbrekende onderwerpen:</p>
              <ul className="space-y-1">
                {insufficientInput.missing.map((m, i) => (
                  <li key={i} className="text-sm text-amber-700">• {m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
          <div className="mx-4 max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Disclaimer</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
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
          </div>
        </div>
      )}
    </div>
  )
}
