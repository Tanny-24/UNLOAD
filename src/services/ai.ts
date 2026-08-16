import type { OrganizeResult } from '../types'
import { organizeLocally } from './localOrganizer'

/**
 * The one entry point the UI uses to turn a brain dump into structure.
 *
 * Order of attempts:
 *   1. the local proxy (which holds the API key, if one is configured)
 *   2. the built-in offline organiser
 *
 * Step 2 is not an error path. Most people running this repo will have no
 * key, and the product has to feel finished for them too.
 */

export type AiMode = 'checking' | 'model' | 'local'

export interface AiStatus {
  mode: AiMode
  provider: string
  model: string | null
}

export async function fetchAiStatus(): Promise<AiStatus> {
  try {
    const res = await fetch('/api/status', { signal: AbortSignal.timeout(2500) })
    if (!res.ok) throw new Error('bad status')
    const data = await res.json()
    return {
      mode: data.configured ? 'model' : 'local',
      provider: data.provider ?? 'local',
      model: data.model ?? null,
    }
  } catch {
    // The API process isn't running (or someone is serving the built
    // frontend on its own). Local mode, no drama.
    return { mode: 'local', provider: 'local', model: null }
  }
}

/**
 * A sentence about wanting to die must never come back as a task with a
 * priority chip next to it. When the safety check fires, those clauses are
 * dropped from the list entirely — the practical items are still organised,
 * and the support note carries the rest.
 */
function stripCrisisItems(result: OrganizeResult): OrganizeResult {
  const items = result.items.filter((item) => !isCrisisText(item.text))
  if (items.length === result.items.length) return result

  const focusStillPresent = items.some((i) => i.text === result.recommended_focus)
  return {
    ...result,
    items,
    recommended_focus: focusStillPresent ? result.recommended_focus : (items[0]?.text ?? ''),
  }
}

/**
 * @param mode  What `/api/status` reported at startup. When it already says
 *              there is no model, we skip the request entirely rather than
 *              firing one off to collect a 503 — a predictable red line in
 *              the console on every single unload is not "working as
 *              intended", it is noise that hides real errors.
 */
export async function organizeDump(text: string, mode: AiMode = 'model'): Promise<OrganizeResult> {
  const supportNote = safetyNoteFor(text)
  const finish = (result: OrganizeResult): OrganizeResult =>
    supportNote ? { ...stripCrisisItems(result), supportNote } : result

  if (mode !== 'model') return finish(organizeLocally(text))

  try {
    const res = await fetch('/api/organize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(25_000),
    })

    if (res.ok) {
      const data = await res.json()
      if (data?.ok && Array.isArray(data.items) && data.items.length > 0) {
        return finish({
          summary: data.summary,
          items: data.items,
          recommended_focus: data.recommended_focus,
          source: data.source ?? 'local',
        })
      }
    }
  } catch {
    // Timeout, offline, server down — all handled the same way.
  }

  return finish(organizeLocally(text))
}

/* ------------------------------------------------------------------ */
/* Safety                                                              */
/*                                                                     */
/* UNLOAD organises tasks. It is not a therapist and must never behave */
/* like one. This check does exactly one thing: if a dump contains      */
/* language about self-harm, the app stops pretending a to-do list is   */
/* the right response and points toward an actual human. It does not    */
/* diagnose, score, label, or store anything.                          */
/* ------------------------------------------------------------------ */

const CRISIS_PHRASES = [
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'take my own life',
  'want to die',
  'wish i was dead',
  'wish i were dead',
  'better off dead',
  'suicidal',
  'suicide',
  'self harm',
  'self-harm',
  'harm myself',
  'hurt myself',
  'cut myself',
  'no reason to live',
  "don't want to be here anymore",
  'dont want to be here anymore',
]

export const SUPPORT_NOTE =
  'Some of what you wrote sounds heavier than a to-do list. UNLOAD is a small desk tool, not a substitute for a person — please consider talking to someone you trust, your GP or student wellbeing service, or a local crisis line. In the US and Canada you can call or text 988; in the UK and Ireland, call 116 123. If you are in immediate danger, please contact emergency services.'

export function isCrisisText(text: string): boolean {
  const lower = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `
  return CRISIS_PHRASES.some((phrase) => lower.includes(phrase))
}

export function safetyNoteFor(text: string): string | undefined {
  return isCrisisText(text) ? SUPPORT_NOTE : undefined
}
