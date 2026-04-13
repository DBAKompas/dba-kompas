'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'
import type { User } from '@supabase/supabase-js'

export type Plan = 'free' | 'pro' | 'enterprise'
export type Role = 'user' | 'admin'

interface AuthContextValue {
  user: User | null
  loading: boolean
  plan: Plan | null
  planLoading: boolean
  role: Role | null
  isAdmin: boolean
  refreshPlan: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  plan: null,
  planLoading: true,
  role: null,
  isAdmin: false,
  refreshPlan: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const supabase = createClient()

  const fetchRole = useCallback(async () => {
    try {
      const res = await fetch('/api/user/role')
      if (res.ok) {
        const data = await res.json()
        setRole(data.role ?? 'user')
      } else {
        setRole('user')
      }
    } catch {
      setRole('user')
    }
  }, [])

  const fetchPlan = useCallback(async (userId?: string, email?: string) => {
    setPlanLoading(true)
    try {
      const res = await fetch('/api/user/plan')
      if (res.ok) {
        const data = await res.json()
        const resolvedPlan: Plan = data.plan ?? 'free'
        setPlan(resolvedPlan)

        // PostHog: plan als person property bijwerken
        if (userId) {
          posthog.identify(userId, { email })
          posthog.setPersonPropertiesForFlags({ plan: resolvedPlan })
          posthog.setPersonProperties({ plan: resolvedPlan })
        }
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
        // PostHog: identify terugkerende gebruiker bij app-load
        posthog.identify(user.id, { email: user.email })
        fetchPlan(user.id, user.email)
        fetchRole()
      } else {
        setPlan(null)
        setPlanLoading(false)
        setRole(null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email })
        fetchPlan(session.user.id, session.user.email)
        fetchRole()
      } else {
        setPlan(null)
        setPlanLoading(false)
        setRole(null)
        // PostHog: reset na uitloggen zodat de volgende sessie anoniem start
        if (event === 'SIGNED_OUT') {
          posthog.reset()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchPlan])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      plan,
      planLoading,
      role,
      isAdmin: role === 'admin',
      refreshPlan: () => fetchPlan(user?.id, user?.email),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
