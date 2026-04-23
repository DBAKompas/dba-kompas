/**
 * lib/notifications/index.ts
 *
 * Centrale helper voor het aanmaken van in-app notificaties.
 * Alle functies zijn fire-and-forget veilig: gooi je ze in een .catch(),
 * dan blokkeert een notificatiefout nooit de hoofd-response.
 *
 * Service_role bypast RLS in Supabase - geen extra INSERT-policy nodig.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: NotificationType
  relatedItemId?: string
  relatedItemType?: string
}

// ── createNotification ─────────────────────────────────────────────────────

/**
 * Maakt één notificatie aan voor een specifieke gebruiker.
 * Veilig om fire-and-forget te gebruiken (.catch()) - gooit een fout
 * die de aanroeper zelf kan afhandelen of negeren.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, title, message, type = 'info', relatedItemId, relatedItemType } = params

  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    related_item_id: relatedItemId ?? null,
    related_item_type: relatedItemType ?? null,
  })

  if (error) {
    console.error('[notifications] createNotification fout:', error)
    throw new Error(`createNotification mislukt: ${error.message}`)
  }
}

// ── fanOutNotification ─────────────────────────────────────────────────────

/**
 * Stuurt een notificatie naar ALLE actieve gebruikers:
 * - abonnees met subscription_status = 'active'
 * - eenmalige kopers met een 'purchased' one_time_purchase
 *
 * Gebruikt een batch INSERT (één query) om N+1 te voorkomen.
 * Dupes worden genegeerd dankzij de vangnet-error-log.
 *
 * @param params  Notificatievelden zonder userId
 * @param options.excludeUserId  Eventueel admin-userId die je wil overslaan
 */
export async function fanOutNotification(
  params: Omit<CreateNotificationParams, 'userId'>,
  options?: { excludeUserId?: string },
): Promise<{ count: number }> {
  const { title, message, type = 'info', relatedItemId, relatedItemType } = params

  // 1. Haal alle actieve gebruikers op
  const [{ data: subscribers }, { data: oneTimeBuyers }] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('subscription_status', 'active'),
    supabaseAdmin
      .from('one_time_purchases')
      .select('user_id')
      .eq('status', 'purchased'),
  ])

  // Dedupliceer op user_id
  const userIdSet = new Set<string>()
  for (const row of subscribers ?? []) userIdSet.add(row.user_id)
  for (const row of oneTimeBuyers ?? []) userIdSet.add(row.user_id)
  if (options?.excludeUserId) userIdSet.delete(options.excludeUserId)

  if (userIdSet.size === 0) return { count: 0 }

  const rows = Array.from(userIdSet).map((userId) => ({
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    related_item_id: relatedItemId ?? null,
    related_item_type: relatedItemType ?? null,
  }))

  const { error } = await supabaseAdmin.from('notifications').insert(rows)

  if (error) {
    console.error('[notifications] fanOutNotification fout:', error)
    throw new Error(`fanOutNotification mislukt: ${error.message}`)
  }

  return { count: userIdSet.size }
}
