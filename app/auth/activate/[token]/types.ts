/**
 * Gedeelde types voor de /auth/activate/<token>-flow.
 *
 * Waarom een apart bestand:
 *  Next.js 16 / React 19 staat in bestanden met `'use server'` alleen
 *  async function-exports toe. Types en constanten die zowel de server
 *  action als de client-form nodig hebben, horen daarom in een apart
 *  module zonder 'use server'-directive.
 */

export type ActivateActionState = {
  error?: string
}
