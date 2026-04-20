'use client'

import { useActionState } from 'react'
import { ArrowRight } from 'lucide-react'
import { startMagicLinkAction, type WelcomeActionState } from './actions'

const INITIAL: WelcomeActionState = {}

export function WelcomeForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(startMagicLinkAction, INITIAL)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-60"
      >
        {pending ? 'Bezig met inloggen...' : <><span>Log mij nu in</span> <ArrowRight className="w-4 h-4" /></>}
      </button>
      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
    </form>
  )
}
