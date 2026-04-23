'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthContext'
import {
  CheckCircle2, XCircle, Circle, ClipboardCopy, ChevronDown, ChevronRight,
  Loader2, AlertTriangle, Send, ArrowLeft, Bug, KeyRound, CreditCard,
  FileSearch, Newspaper, BookOpen, Bell, Shield, Share2, Receipt, Server,
  CheckCheck, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TEST_CATEGORIES,
  generateIssuePrompt,
  getTotalCounts,
  type TestCase,
  type TestCategory,
} from '@/lib/testing/test-cases'

// ── Types ──────────────────────────────────────────────────────────────────

type TestStatus = 'pending' | 'passed' | 'failed'

interface TestResult {
  test_id: string
  status: TestStatus
  notes?: string
  updated_at: string
}

interface TestIssue {
  id: string
  test_id: string
  description: string
  prompt: string
  status: 'open' | 'resolved'
  created_at: string
}

// ── Icon map ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  KeyRound:   <KeyRound className="size-4" />,
  CreditCard: <CreditCard className="size-4" />,
  FileSearch: <FileSearch className="size-4" />,
  Newspaper:  <Newspaper className="size-4" />,
  BookOpen:   <BookOpen className="size-4" />,
  Bell:       <Bell className="size-4" />,
  Shield:     <Shield className="size-4" />,
  Share2:     <Share2 className="size-4" />,
  Receipt:    <Receipt className="size-4" />,
  Server:     <Server className="size-4" />,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function statusColor(status: TestStatus) {
  if (status === 'passed') return 'text-green-500'
  if (status === 'failed') return 'text-red-500'
  return 'text-muted-foreground'
}

function StatusIcon({ status, size = 'size-5' }: { status: TestStatus; size?: string }) {
  if (status === 'passed') return <CheckCircle2 className={`${size} text-green-500`} />
  if (status === 'failed') return <XCircle className={`${size} text-red-500`} />
  return <Circle className={`${size} text-muted-foreground/40`} />
}

function ProgressBar({ value, total, color = 'bg-green-500' }: { value: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Hoofdpagina ────────────────────────────────────────────────────────────

export default function AdminTestsPage() {
  const { user, roleLoading: authLoading, isAdmin } = useAuth()
  const router = useRouter()

  const [results, setResults]       = useState<Record<string, TestResult>>({})
  const [issues, setIssues]         = useState<TestIssue[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [savingId, setSavingId]     = useState<string | null>(null)
  const [expanded, setExpanded]     = useState<Record<string, boolean>>({})
  const [issueText, setIssueText]   = useState<Record<string, string>>({})
  const [copiedId, setCopiedId]     = useState<string | null>(null)
  const [submittingIssue, setSubmittingIssue] = useState<string | null>(null)
  const [activeTab, setActiveTab]   = useState<'tests' | 'issues'>('tests')

  // ── Auth guard ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace('/dashboard')
    }
  }, [authLoading, user, isAdmin, router])

  // ── Data laden ───────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [resResults, resIssues] = await Promise.all([
        fetch('/api/admin/test-results'),
        fetch('/api/admin/test-issues'),
      ])
      const [dataResults, dataIssues]: [TestResult[], TestIssue[]] = await Promise.all([
        resResults.json(),
        resIssues.json(),
      ])
      const map: Record<string, TestResult> = {}
      for (const r of dataResults) map[r.test_id] = r
      setResults(map)
      setIssues(Array.isArray(dataIssues) ? dataIssues : [])
    } catch {
      // stil falen — pagina toont pending staat
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Status opslaan ───────────────────────────────────────────────────────

  const saveStatus = async (testId: string, status: TestStatus) => {
    setSavingId(testId)
    try {
      const res = await fetch('/api/admin/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testId, status }),
      })
      if (res.ok) {
        const updated: TestResult = await res.json()
        setResults(prev => ({ ...prev, [testId]: updated }))
      }
    } finally {
      setSavingId(null)
    }
  }

  // ── Issue indienen ────────────────────────────────────────────────────────

  const submitIssue = async (testCase: TestCase, category: TestCategory) => {
    const description = issueText[testCase.id]?.trim()
    if (!description) return

    const prompt = generateIssuePrompt(testCase, category, description)
    setSubmittingIssue(testCase.id)
    try {
      const res = await fetch('/api/admin/test-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_id: testCase.id, description, prompt }),
      })
      if (res.ok) {
        const newIssue: TestIssue = await res.json()
        setIssues(prev => [newIssue, ...prev])
        setIssueText(prev => ({ ...prev, [testCase.id]: '' }))
        // Status automatisch op failed zetten
        await saveStatus(testCase.id, 'failed')
      }
    } finally {
      setSubmittingIssue(null)
    }
  }

  // ── Prompt kopiëren ──────────────────────────────────────────────────────

  const copyPrompt = async (prompt: string, id: string) => {
    await navigator.clipboard.writeText(prompt)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Issue oplossen ────────────────────────────────────────────────────────

  const resolveIssue = async (issueId: string) => {
    const res = await fetch('/api/admin/test-issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: issueId, status: 'resolved' }),
    })
    if (res.ok) {
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'resolved' } : i))
    }
  }

  // ── Statistieken ─────────────────────────────────────────────────────────

  const { totalTests, totalBlockers } = getTotalCounts()
  const passed   = Object.values(results).filter(r => r.status === 'passed').length
  const failed   = Object.values(results).filter(r => r.status === 'failed').length
  const blockersPassed = TEST_CATEGORIES
    .flatMap(c => c.tests)
    .filter(t => t.isBlocker && results[t.id]?.status === 'passed').length
  const openIssues = issues.filter(i => i.status === 'open').length

  // ── Render guard ─────────────────────────────────────────────────────────

  if (authLoading || loadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push('/admin')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </button>
            <h1 className="text-3xl font-bold tracking-tight">Testmodule</h1>
            {openIssues > 0 && (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                {openIssues}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {totalTests} testcases · {totalBlockers} blockers · bidirectioneel met Claude
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw className="size-4 mr-2" />
          Verversen
        </Button>
      </div>

      {/* Totale voortgangsbalk */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Totale voortgang</span>
          <span className="text-muted-foreground">{passed} / {totalTests} geslaagd</span>
        </div>
        <ProgressBar value={passed} total={totalTests} />
        <div className="grid grid-cols-4 gap-3 pt-1">
          <Stat label="Geslaagd"   value={passed}                color="text-green-500" />
          <Stat label="Mislukt"    value={failed}                color="text-red-500" />
          <Stat label="Open"       value={totalTests - passed - failed} color="text-muted-foreground" />
          <Stat label="Blockers ✓" value={`${blockersPassed}/${totalBlockers}`} color={blockersPassed === totalBlockers ? 'text-green-500' : 'text-amber-500'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['tests', 'issues'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'tests' ? 'Testcases' : `Issues${openIssues > 0 ? ` (${openIssues})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab: Testcases */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {TEST_CATEGORIES.map(category => {
            const catTests   = category.tests
            const catPassed  = catTests.filter(t => results[t.id]?.status === 'passed').length
            const catFailed  = catTests.filter(t => results[t.id]?.status === 'failed').length
            const isOpen     = expanded[category.id] ?? false

            return (
              <div key={category.id} className="rounded-xl border border-border bg-card overflow-hidden">

                {/* Categorie-header */}
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [category.id]: !isOpen }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{ICON_MAP[category.icon]}</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{category.title}</p>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{catPassed}/{catTests.length}</span>
                        {catFailed > 0 && <span className="text-red-500">{catFailed} fout</span>}
                      </div>
                      <ProgressBar
                        value={catPassed}
                        total={catTests.length}
                        color={catFailed > 0 ? 'bg-red-500' : 'bg-green-500'}
                      />
                    </div>
                    {isOpen
                      ? <ChevronDown className="size-4 text-muted-foreground" />
                      : <ChevronRight className="size-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Testcases */}
                {isOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {catTests.map(test => {
                      const status: TestStatus = results[test.id]?.status ?? 'pending'
                      const isSaving   = savingId === test.id
                      const isSubmitting = submittingIssue === test.id
                      const hasIssueText = (issueText[test.id] ?? '').trim().length > 0

                      return (
                        <div key={test.id} className="px-5 py-4 space-y-3">

                          {/* Testcase rij */}
                          <div className="flex items-start gap-3">
                            <StatusIcon status={status} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{test.title}</p>
                                <span className="text-xs text-muted-foreground/60 font-mono">{test.id}</span>
                                {test.isBlocker && (
                                  <span className="text-xs bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-medium">
                                    blocker
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{test.description}</p>

                              {/* Stappen */}
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                                  Teststappen tonen
                                </summary>
                                <ol className="mt-1.5 space-y-0.5 pl-4 list-decimal text-xs text-muted-foreground">
                                  {test.steps.map((step, i) => <li key={i}>{step}</li>)}
                                </ol>
                                <p className="mt-1.5 text-xs">
                                  <span className="font-medium">Verwacht:</span>{' '}
                                  <span className="text-muted-foreground">{test.expectedResult}</span>
                                </p>
                              </details>
                            </div>

                            {/* Status-knoppen */}
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                disabled={isSaving}
                                onClick={() => saveStatus(test.id, 'passed')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  status === 'passed'
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'hover:bg-green-500/10 text-muted-foreground hover:text-green-500'
                                }`}
                                title="Geslaagd"
                              >
                                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                              </button>
                              <button
                                disabled={isSaving}
                                onClick={() => saveStatus(test.id, 'pending')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  status === 'pending'
                                    ? 'bg-muted text-foreground'
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                                title="Resetten"
                              >
                                <Circle className="size-4" />
                              </button>
                            </div>
                          </div>

                          {/* Issue-veld */}
                          <div className="flex gap-2 pl-8">
                            <input
                              type="text"
                              value={issueText[test.id] ?? ''}
                              onChange={e => setIssueText(prev => ({ ...prev, [test.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && hasIssueText) submitIssue(test, category)
                              }}
                              placeholder="Omschrijf het probleem en druk Enter..."
                              className="flex-1 text-xs bg-muted/40 border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                            <button
                              disabled={!hasIssueText || isSubmitting}
                              onClick={() => submitIssue(test, category)}
                              className="px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Issue melden + prompt genereren"
                            >
                              {isSubmitting
                                ? <Loader2 className="size-4 animate-spin" />
                                : <Send className="size-4" />
                              }
                            </button>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center">
              <Bug className="mx-auto size-10 text-muted-foreground mb-3" />
              <p className="font-semibold">Geen issues</p>
              <p className="text-sm text-muted-foreground mt-1">
                Meld een probleem via het invoerveld bij een testcase
              </p>
            </div>
          ) : (
            issues.map(issue => {
              const testCase = TEST_CATEGORIES
                .flatMap(c => c.tests)
                .find(t => t.id === issue.test_id)
              const category = TEST_CATEGORIES.find(c =>
                c.tests.some(t => t.id === issue.test_id),
              )

              return (
                <div
                  key={issue.id}
                  className={`rounded-xl border bg-card p-5 space-y-3 ${
                    issue.status === 'resolved'
                      ? 'border-border opacity-55'
                      : 'border-red-500/30'
                  }`}
                >
                  {/* Issue header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {issue.status === 'resolved'
                        ? <CheckCheck className="size-4 text-green-500 mt-0.5 shrink-0" />
                        : <AlertTriangle className="size-4 text-red-500 mt-0.5 shrink-0" />
                      }
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{testCase?.title ?? issue.test_id}</p>
                          <span className="text-xs text-muted-foreground/60 font-mono">{issue.test_id}</span>
                          {category && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {category.title}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            issue.status === 'resolved'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {issue.status === 'resolved' ? 'opgelost' : 'open'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{issue.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(issue.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {issue.status === 'open' && (
                      <button
                        onClick={() => resolveIssue(issue.id)}
                        className="shrink-0 text-xs text-muted-foreground hover:text-green-500 transition-colors"
                        title="Markeer als opgelost"
                      >
                        <CheckCheck className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* Prompt */}
                  <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        Gegenereerde prompt — kopieer en plak in de chat
                      </p>
                      <button
                        onClick={() => copyPrompt(issue.prompt, issue.id)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedId === issue.id
                          ? <><CheckCheck className="size-3.5 text-green-500" /> Gekopieerd</>
                          : <><ClipboardCopy className="size-3.5" /> Kopiëren</>
                        }
                      </button>
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono leading-relaxed max-h-48 overflow-y-auto">
                      {issue.prompt}
                    </pre>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── Stat component ──────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
