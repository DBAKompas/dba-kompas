'use client'

import { useActionState, useState } from 'react'
import { Lock, Eye, EyeOff, Check, ArrowRight } from 'lucide-react'
import { activateAccountAction, type ActivateActionState } from './actions'

const INITIAL: ActivateActionState = {}

function inputCls(error?: boolean) {
  return [
    'w-full h-11 rounded-xl border bg-background text-sm transition-all',
    'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
    'placeholder:text-muted-foreground/60',
    error ? 'border-red-400 bg-red-50/40' : 'border-border',
    'pl-10 pr-10',
  ].join(' ')
}

export function ActivateForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const [state, formAction, pending] = useActionState(activateAccountAction, INITIAL)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="rounded-lg bg-background/60 border border-border/60 px-3 py-2 text-sm text-muted-foreground">
        Activatie voor <strong className="text-foreground">{email}</strong>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Kies een wachtwoord</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type={showPw ? 'text' : 'password'}
            name="password"
            placeholder="Minimaal 10 tekens"
            required
            minLength={10}
            className={inputCls(Boolean(state.error))}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Gebruik minimaal een hoofdletter, kleine letter, cijfer en speciaal teken.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground">Herhaal wachtwoord</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type={showConfirm ? 'text' : 'password'}
            name="confirm"
            placeholder="Nogmaals hetzelfde wachtwoord"
            required
            minLength={10}
            className={inputCls(Boolean(state.error))}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(v => !v)}
            aria-label={showConfirm ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-60"
      >
        {pending
          ? 'Bezig met activeren...'
          : <><Check className="w-4 h-4" /> <span>Activeer mijn account</span> <ArrowRight className="w-4 h-4" /></>
        }
      </button>
    </form>
  )
}
