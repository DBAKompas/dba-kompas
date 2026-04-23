import { describe, it, expect } from 'vitest'
import {
  resolveQuotaPlan,
  getQuotaPlansForUsers,
  resolveAbonnementStatus,
  resolveEenmaligStatus,
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

// ─── Afgeleide abonnement-status ──────────────────────────────────────────────
// resolveAbonnementStatus vat lifecycle-state (actief/loopt_af/inactief/n.v.t.)
// samen voor admin-overzichten. Losgekoppeld van resolveQuotaPlan omdat die
// alleen naar het betaalplan kijkt, niet naar of het abonnement nog leeft.

describe('resolveAbonnementStatus', () => {
  it("retourneert 'n.v.t.' zonder subscription-record", () => {
    expect(resolveAbonnementStatus({ subscription: null })).toBe('n.v.t.')
  })

  it("retourneert 'n.v.t.' als het plan geen monthly/yearly is", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'active',
          plan: null,
          cancel_at_period_end: false,
        },
      })
    ).toBe('n.v.t.')
  })

  it("retourneert 'actief' bij active monthly zonder cancel_at_period_end", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'active',
          plan: 'monthly',
          cancel_at_period_end: false,
        },
      })
    ).toBe('actief')
  })

  it("retourneert 'actief' bij trialing yearly zonder cancel_at_period_end", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'trialing',
          plan: 'yearly',
          cancel_at_period_end: false,
        },
      })
    ).toBe('actief')
  })

  it("retourneert 'loopt_af' bij active monthly met cancel_at_period_end=true", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'active',
          plan: 'monthly',
          cancel_at_period_end: true,
        },
      })
    ).toBe('loopt_af')
  })

  it("retourneert 'loopt_af' bij trialing yearly met cancel_at_period_end=true", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'trialing',
          plan: 'yearly',
          cancel_at_period_end: true,
        },
      })
    ).toBe('loopt_af')
  })

  it("retourneert 'inactief' bij canceled monthly", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'canceled',
          plan: 'monthly',
          cancel_at_period_end: false,
        },
      })
    ).toBe('inactief')
  })

  it("retourneert 'inactief' bij past_due yearly", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'past_due',
          plan: 'yearly',
          cancel_at_period_end: false,
        },
      })
    ).toBe('inactief')
  })

  it("behandelt null cancel_at_period_end als niet-aflopend (actief)", () => {
    expect(
      resolveAbonnementStatus({
        subscription: {
          status: 'active',
          plan: 'monthly',
          cancel_at_period_end: null,
        },
      })
    ).toBe('actief')
  })
})

// ─── Afgeleide eenmalige-aankoop-status ───────────────────────────────────────
// resolveEenmaligStatus vat de lifecycle van one_time_purchases samen.
// Terminale statussen (expired, finalized, converted) en credit_used=true
// gaan vóór actieve statussen (in_progress, purchased).

describe('resolveEenmaligStatus', () => {
  it("retourneert 'n.v.t.' zonder one_time_purchase-record", () => {
    expect(resolveEenmaligStatus({ oneTimePurchase: null })).toBe('n.v.t.')
  })

  it("retourneert 'vervallen' bij status expired", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'expired', credit_used: false },
      })
    ).toBe('vervallen')
  })

  it("retourneert 'vervuld' bij status finalized", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'finalized', credit_used: false },
      })
    ).toBe('vervuld')
  })

  it("retourneert 'vervuld' bij status converted", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'converted', credit_used: true },
      })
    ).toBe('vervuld')
  })

  it("retourneert 'vervuld' als credit_used=true terwijl status purchased is", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'purchased', credit_used: true },
      })
    ).toBe('vervuld')
  })

  it("retourneert 'in_uitvoering' bij status in_progress en credit_used=false", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'in_progress', credit_used: false },
      })
    ).toBe('in_uitvoering')
  })

  it("retourneert 'beschikbaar' bij status purchased en credit_used=false", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'purchased', credit_used: false },
      })
    ).toBe('beschikbaar')
  })

  it("retourneert 'beschikbaar' bij status purchased en credit_used=null", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'purchased', credit_used: null },
      })
    ).toBe('beschikbaar')
  })

  it("retourneert 'n.v.t.' bij onbekende status zonder credit_used", () => {
    expect(
      resolveEenmaligStatus({
        oneTimePurchase: { status: 'weird_state', credit_used: false },
      })
    ).toBe('n.v.t.')
  })
})
