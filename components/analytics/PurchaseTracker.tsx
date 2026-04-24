'use client'
import { useEffect } from 'react'
import { trackPurchaseCompleted } from '@/lib/dba-analytics'

type Props = { plan: string; priceEur: number; sessionId: string }

export function PurchaseTracker({ plan, priceEur, sessionId }: Props) {
  useEffect(() => {
    trackPurchaseCompleted(plan, priceEur, sessionId)
  }, [plan, priceEur, sessionId])
  return null
}
