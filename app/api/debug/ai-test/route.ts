import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY niet ingesteld' }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Zeg alleen: {"test": "ok"}' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : 'geen tekst'

    return NextResponse.json({
      success: true,
      model: response.model,
      response: text,
      usage: response.usage,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : 'unknown',
    }, { status: 500 })
  }
}
