import { describe, it, expect } from 'vitest'
import {
  resolveQuotaPlan,
  getQuotaPlansForUsers,
} from '@/modules/billing/entitlements'

// ─── Pure resolver ────────────────────────────────────────────────────────────
// resolveQuotaPlan is de bron van waarheid voor plan-resolutie. Deze tests
// leggen de regels expliciet vast zodat toekomstige wijzigingen niet
// stilletjes de admin-lijst of quota-beslissingen veranderen.

describe('resolveQuotaPlan', () => {
  it('retourneert free zonder subscription en zonder one_time', () => {
    expect(
      resolveQuotaPlan({ subscription: null, hasOneTimePurchase: false })
    ).toBe('free')
  })

  it('retourneert monthly bij actieve maand-subscription', () => {
    expect(
      resolveQuotaPlan({
        subscription: { status: 'active', plan: 'monthly' },
        hasOneTimePurchase: false,
      })
    ).toBe('monthly')
  })

  it('retourneert yearly bij trialing jaar-subscription', () => {
    expect(
      resolveQuotaPlan({
        subscription: { status: 'trialing', plan: 'yearly' },
        hasOneTimePurchase: false,
      })
    ).toBe('yearly')
  })

  it('retourneert one_time zonder subscription maar met eenmalige aankoop', () => {
    expect(
      resolveQuotaPlan({ subscription: null, hasOneTimePurchase: true })
    ).toBe('one_time')
  })

  it('subscription wint van one_time als beide bestaan', () => {
    expect(
      resolveQuotaPlan({
        subscription: { status: 'active', plan: 'monthly' },
        hasOneTimePurchase: true,
      })
    ).toBe('monthly')
  })

  it('cancelled subscription degradeert naar free zonder one_time', () => {
    expect(
      resolveQuotaPlan({
        subscription: { status: 'canceled', plan: 'monthly' },
        hasOneTimePurchase: false,
      })
    ).toBe('free')
  })

  it('cancelled subscription met one_time valt terug op one_time', () => {
    expect(
      resolveQuotaPlan({
        subscription: { status: 'canceled', plan: 'monthly' },
        hasOneTimePurchase: true,
      })
    ).toBe('one_time')
  })
})

// ─── Batch-helper ─────────────────────────────────────────────────────────────
// Minimale thenable Supabase mock: ondersteunt de chain .from().select().in().in()
// en .from().select().in().eq(). Filtert op basis van de filters die de
// helper daadwerkelijk aanroept.

type MockRow = Record<string, unknown>
type MockData = { subscriptions: MockRow[]; one_time_purchases: MockRow[] }

function makeMockClient(data: MockData) {
  return {
    from(table: keyof MockData) {
      const rows = data[table] ?? []
      let filtered = [...rows]
      const builder: {
        select: (cols: string) => typeof builder
        in: (col: string, values: string[]) => typeof builder
        eq: (col: string, value: string) => typeof builder
        then: (
          onFulfilled: (v: { data: MockRow[]; error: null }) => unknown
        ) => unknown
      } = {
        select() {
          return builder
        },
        in(col, values) {
          filtered = filtered.filter((r) =>
            values.includes(r[col] as string)
          )
          return builder
        },
        eq(col, value) {
          filtered = filtered.filter((r) => r[col] === value)
          return builder
        },
        then(onFulfilled) {
          return Promise.resolve({ data: filtered, error: null }).then(
            onFulfilled
          )
        },
      }
      return builder
    },
  }
}

describe('getQuotaPlansForUsers', () => {
  it('retourneert lege map bij lege input zonder queries', async () => {
    const client = makeMockClient({
      subscriptions: [],
      one_time_purchases: [],
    })
    const result = await getQuotaPlansForUsers(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      []
    )
    expect(result.size).toBe(0)
  })

  it('resolvet alle drie de fixtures correct in één batch', async () => {
    const client = makeMockClient({
      subscriptions: [
        { user_id: 'u-sub', status: 'active', plan: 'monthly' },
        { user_id: 'u-both', status: 'trialing', plan: 'yearly' },
        // Niet-actieve sub mag niet meetellen:
        { user_id: 'u-canceled', status: 'canceled', plan: 'monthly' },
      ],
      one_time_purchases: [
        { user_id: 'u-one', status: 'purchased' },
        { user_id: 'u-both', status: 'purchased' },
        // Niet-purchased one_time mag niet meetellen:
        { user_id: 'u-expired', status: 'expired' },
      ],
    })

    const result = await getQuotaPlansForUsers(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      ['u-sub', 'u-one', 'u-both', 'u-free', 'u-canceled', 'u-expired']
    )

    expect(result.get('u-sub')).toBe('monthly')
    expect(result.get('u-one')).toBe('one_time')
    expect(result.get('u-both')).toBe('yearly')
    expect(result.get('u-free')).toBe('free')
    expect(result.get('u-canceled')).toBe('free')
    expect(result.get('u-expired')).toBe('free')
  })
})
