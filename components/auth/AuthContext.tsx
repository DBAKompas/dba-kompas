'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type Plan = 'free' | 'pro' | 'enterprise'

interface AuthContextValue {
  user: User | null
  loading: boolean
  plan: Plan | null
  planLoading: boolean
  refreshPlan: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  plan: null,
  planLoading: true,
  refreshPlan: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const supabase = createClient()

  const fetchPlan = useCallback(async () => {
    setPlanLoading(true)
    try {
      const res = await fetch('/api/user/plan')
      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan ?? 'free')
      } else {
        setPlan('free')
      }
    } catch {
      setPlan('free')
    } finally {
      setPlanLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) {
        fetchPlan()
      } else {
        setPlan(null)
        setPlanLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPlan()
      } else {
        setPlan(null)
        setPlanLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchPlan])

  return (
    <AuthContext.Provider value={{ user, loading, plan, planLoading, refreshPlan: fetchPlan }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
