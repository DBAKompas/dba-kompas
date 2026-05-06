/**
 * Referral & Upgrade configuratie - DBA Kompas v2
 *
 * Centrale plek voor alle constanten rond het referral- en upgrade-systeem.
 * Wijzig hier (en alleen hier) als prijs, kortingstermijn of staffel-window
 * moet worden aangepast.
 */

// ── Prijzen (in centen, conform Stripe-conventie) ────────────────────────────

/** Eenmalige check: €9,95 */
export const ONE_TIME_PRICE_CENTS = 995

/** Maandabonnement: €20,00 */
export const MONTH_PRICE_CENTS = 2000

/** Jaarabonnement: €200,00 (2 maanden gratis t.o.v. €240) */
export const YEAR_PRICE_CENTS = 20000

// ── Referral kortingen (deelcode-ontvanger) ──────────────────────────────────

/** Korting voor wie een deelcode inwisselt: 20 procent */
export const REFERRAL_FRIEND_DISCOUNT_PCT = 20

/** Stripe coupon ID voor de deelcode-korting */
export const REFERRAL_FRIEND_COUPON = 'REFERRAL_FRIEND_20PCT'

// ── Upgrade-aanbod na eerste eenmalige check ─────────────────────────────────

/** Vaste korting op eerste maand abonnement: €9,95 */
export const UPGRADE_FIRST_MONTH_DISCOUNT_CENTS = 995

/** Stripe coupon ID voor de €9,95 upgrade-korting */
export const UPGRADE_FIRST_MONTH_COUPON = 'UPGRADE_FIRST_MONTH_995'

/** Geldigheidsduur upgrade-aanbod in dagen */
export const UPGRADE_OFFER_VALID_DAYS = 14

// ── Deelcodes en staffel ─────────────────────────────────────────────────────

/** Aantal deelcodes per gebruiker (bestaand gedrag, hier voor referentie) */
export const SHARE_CODES_PER_USER = 5

/** Geldigheidsduur deelcode in dagen */
export const SHARE_CODE_VALID_DAYS = 30

/** Staffel-window in dagen vanaf eerste succesvolle referral */
export const STAFFEL_WINDOW_DAYS = 60

/** Mijlpaal-drempels (onveranderd t.o.v. bestaande engine) */
export const MILESTONES = [1, 3, 5] as const

/** Geldigheidsduur van een gratis bonus-check uit mijlpaal 1 */
export const BONUS_CHECK_VALID_DAYS = 30

/** Verloopduur van een mijlpaal-3 reward (1 maand gratis abo): 60 dagen na granting */
export const REWARD_MONTH_DISCOUNT_VALID_DAYS = 60

/** Verloopduur van een mijlpaal-5 reward (2 maanden gratis abo): 60 dagen na granting */
export const REWARD_TWO_MONTH_DISCOUNT_VALID_DAYS = 60

// ── Bestaande Stripe coupons (voor mijlpaal 3 en 5, blijven onveranderd) ─────

/** Mijlpaal 3 reward: 1 maand gratis */
export const REFERRAL_MONTH_DISCOUNT_COUPON = 'REFERRAL_MONTH_DISCOUNT'

/** Mijlpaal 5 reward: 2 maanden gratis */
export const REFERRAL_TWO_MONTH_DISCOUNT_COUPON = 'REFERRAL_TWO_MONTH_DISCOUNT'

// ── Feature flag ─────────────────────────────────────────────────────────────

/**
 * V2-mechaniek staat alleen aan als deze env var "true" is.
 * Houdt nieuwe UI en e-mailflows uit tot we live gaan in fase 6.
 */
export const REFERRAL_V2_ENABLED =
  process.env.REFERRAL_V2_ENABLED === 'true'
