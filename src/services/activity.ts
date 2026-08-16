import type { ActivityBucket, Stuckness, StuckLevel, StucknessBreakdown } from '../types'

/**
 * UNLOAD's activity engine.
 *
 * ── What it collects ──────────────────────────────────────────────
 * Two integers per ten seconds: how many key events, how many pointer
 * events. That is the entire dataset.
 *
 * ── What it deliberately does not collect ─────────────────────────
 * Key identities or characters, pointer coordinates, clipboard, window
 * titles, app names, URLs, screenshots, camera, microphone. `keydown`
 * handlers here never read `event.key`, and nothing is ever sent to a
 * server — the buckets live in memory and a rolling window in
 * localStorage, on this machine only.
 *
 * ── Scope ─────────────────────────────────────────────────────────
 * Browser events reach us only while an UNLOAD window has focus. That
 * is a real limitation, and it is why the app also treats "the window
 * has been unfocused for a long time" as a signal in its own right,
 * and why Demo Mode exists for presenting the flow.
 */

export const BUCKET_MS = 10_000
/** 10 minutes of history is plenty for every signal below. */
export const WINDOW_BUCKETS = 60

type Listener = () => void

class ActivityEngine {
  private buckets: ActivityBucket[] = []
  private currentKeys = 0
  private currentMouse = 0
  private bucketStart = Date.now()
  private lastEventAt = Date.now()
  private listeners = new Set<Listener>()
  private timer: number | null = null
  private started = false

  /** Wall-clock start of the current stretch of work, reset by any reset. */
  sessionStart = Date.now()
  /** Last time the person actually took a reset (break, quest, or unload). */
  lastResetAt = Date.now()

  start() {
    if (this.started || typeof window === 'undefined') return
    this.started = true

    window.addEventListener('keydown', this.onKey, { passive: true })
    window.addEventListener('pointerdown', this.onPointer, { passive: true })
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('wheel', this.onPointer, { passive: true })

    this.timer = window.setInterval(this.flush, BUCKET_MS)
  }

  stop() {
    if (!this.started) return
    this.started = false
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('pointerdown', this.onPointer)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('wheel', this.onPointer)
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  // `event` is intentionally never inspected. We increment and discard.
  private onKey = () => {
    this.currentKeys += 1
    this.lastEventAt = Date.now()
  }

  private onPointer = () => {
    this.currentMouse += 1
    this.lastEventAt = Date.now()
  }

  /** Pointer moves are throttled so a single sweep isn't 200 "events". */
  private lastMoveAt = 0
  private onPointerMove = () => {
    const now = Date.now()
    if (now - this.lastMoveAt < 250) return
    this.lastMoveAt = now
    this.currentMouse += 1
    this.lastEventAt = now
  }

  private flush = () => {
    this.buckets.push({ t: this.bucketStart, keys: this.currentKeys, mouse: this.currentMouse })
    if (this.buckets.length > WINDOW_BUCKETS) this.buckets = this.buckets.slice(-WINDOW_BUCKETS)
    this.currentKeys = 0
    this.currentMouse = 0
    this.bucketStart = Date.now()
    this.listeners.forEach((fn) => fn())
  }

  /** Buckets plus the partially-filled current one, so the UI feels live. */
  snapshot(): ActivityBucket[] {
    return [...this.buckets, { t: this.bucketStart, keys: this.currentKeys, mouse: this.currentMouse }]
  }

  get idleSeconds() {
    return (Date.now() - this.lastEventAt) / 1000
  }

  get sessionMinutes() {
    return (Date.now() - this.sessionStart) / 60_000
  }

  get minutesSinceReset() {
    return (Date.now() - this.lastResetAt) / 60_000
  }

  /** Called after a break, quest or brain dump — the score should drop. */
  markReset() {
    this.lastResetAt = Date.now()
    this.sessionStart = Date.now()
    this.buckets = []
    this.listeners.forEach((fn) => fn())
  }

  /**
   * Demo Mode: replace the rolling window with a synthetic pattern and
   * backdate the session clock, so the whole flow can be shown in seconds
   * instead of waiting out a real 55-minute stretch.
   */
  injectDemo(profile: DemoProfile) {
    const spec = DEMO_PROFILES[profile]
    const now = Date.now()
    this.buckets = spec.pattern.map((p, i) => ({
      t: now - (spec.pattern.length - i) * BUCKET_MS,
      keys: p[0],
      mouse: p[1],
    }))
    this.sessionStart = now - spec.sessionMinutes * 60_000
    this.lastResetAt = now - spec.sessionMinutes * 60_000
    this.lastEventAt = now - spec.idleSeconds * 1000
    this.listeners.forEach((fn) => fn())
  }
}

export const activityEngine = new ActivityEngine()

/* ------------------------------------------------------------------ */
/* Demo profiles                                                       */
/* ------------------------------------------------------------------ */

export type DemoProfile = 'deepStretch' | 'burstStall' | 'staring' | 'fresh'

interface DemoSpec {
  label: string
  hint: string
  sessionMinutes: number
  idleSeconds: number
  /** [keys, mouse] per 10-second bucket, oldest first. */
  pattern: [number, number][]
}

/** Small helpers to keep the patterns below readable. */
const busy = (n = 22): [number, number] => [n, 4]
const quiet = (): [number, number] => [0, 0]
const twitch = (): [number, number] => [1, 3]

export const DEMO_PROFILES: Record<DemoProfile, DemoSpec> = {
  deepStretch: {
    label: '55 minutes deep',
    hint: 'A long unbroken stretch — the classic "still here?" moment.',
    sessionMinutes: 55,
    idleSeconds: 4,
    pattern: [
      ...Array.from({ length: 30 }, () => busy(26)),
      ...Array.from({ length: 12 }, () => busy(18)),
      quiet(),
      quiet(),
      ...Array.from({ length: 10 }, () => busy(14)),
      quiet(),
      twitch(),
      twitch(),
      quiet(),
      busy(9),
    ],
  },
  burstStall: {
    label: 'Type, delete, repeat',
    hint: 'Bursts of typing separated by stalls — the shape of being stuck.',
    sessionMinutes: 38,
    idleSeconds: 12,
    pattern: [
      ...Array.from({ length: 8 }, () => busy(20)),
      ...Array(4).fill(null).flatMap(() => [busy(34), quiet(), quiet(), twitch()] as [number, number][]),
      busy(30),
      quiet(),
      quiet(),
      busy(28),
      quiet(),
      quiet(),
      quiet(),
      busy(31),
      quiet(),
      twitch(),
      quiet(),
      busy(26),
      quiet(),
      quiet(),
    ],
  },
  staring: {
    label: 'Staring at the screen',
    hint: 'A long session that has quietly stopped producing anything.',
    sessionMinutes: 47,
    idleSeconds: 95,
    pattern: [
      ...Array.from({ length: 22 }, () => busy(24)),
      ...Array.from({ length: 6 }, () => twitch()),
      ...Array.from({ length: 20 }, () => quiet()),
    ],
  },
  fresh: {
    label: 'Just sat down',
    hint: 'Everything clear — useful for showing that UNLOAD stays quiet.',
    sessionMinutes: 3,
    idleSeconds: 2,
    pattern: [...Array.from({ length: 16 }, () => busy(20))],
  },
}

/* ------------------------------------------------------------------ */
/* Stuckness scoring                                                   */
/*                                                                     */
/* Four transparent signals, each 0-100, combined with fixed weights.  */
/* No model, no training, nothing hidden — the breakdown is shown in   */
/* the UI so the person can see exactly why they were nudged.          */
/* ------------------------------------------------------------------ */

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

const WEIGHTS: Record<keyof StucknessBreakdown, number> = {
  continuousWork: 0.3,
  pausePattern: 0.2,
  activityOscillation: 0.25,
  sessionLength: 0.25,
}

export interface ScoreInput {
  buckets: ActivityBucket[]
  sessionMinutes: number
  minutesSinceReset: number
  idleSeconds: number
}

/**
 * How long you have gone without stepping away.
 *
 * Ramps from 0 at 15 minutes to 100 at 50 minutes, because under a quarter
 * of an hour nobody needs interrupting.
 */
function continuousWorkScore({ sessionMinutes }: ScoreInput) {
  return clamp(((sessionMinutes - 15) / 35) * 100)
}

/**
 * Long gaps inside an otherwise active stretch. Someone reading, thinking
 * or stuck on one line produces empty buckets without leaving the desk.
 * Only counts once there's enough session behind it to be meaningful.
 */
function pausePatternScore({ buckets, sessionMinutes, idleSeconds }: ScoreInput) {
  const recent = buckets.slice(-18) // last ~3 minutes
  if (recent.length < 6 || sessionMinutes < 8) return 0

  const empty = recent.filter((b) => b.keys + b.mouse === 0).length
  const ratio = empty / recent.length

  // A short idle spell right now nudges this up; being properly away does not
  // (that person already took their break, they just haven't told us).
  const idleBoost = idleSeconds > 45 && idleSeconds < 300 ? 18 : 0
  return clamp(ratio * 130 + idleBoost)
}

/**
 * Burst, stall, burst, stall. Writing a sentence, deleting it, staring,
 * writing it again. The most recognisable shape of "stuck" that metadata
 * alone can see.
 */
function activityOscillationScore({ buckets, sessionMinutes }: ScoreInput) {
  const recent = buckets.slice(-24) // last ~4 minutes
  if (recent.length < 8 || sessionMinutes < 5) return 0

  const active = recent.map((b) => b.keys + b.mouse >= 5)
  let flips = 0
  for (let i = 1; i < active.length; i++) if (active[i] !== active[i - 1]) flips += 1

  // Volatility in how much is being produced, on top of the on/off flipping.
  const counts = recent.map((b) => b.keys + b.mouse)
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length
  const spread =
    mean > 0 ? Math.sqrt(counts.reduce((a, c) => a + (c - mean) ** 2, 0) / counts.length) / mean : 0

  return clamp((flips / 10) * 70 + Math.min(spread, 1.6) * 30)
}

/** Time since the last real reset, independent of how busy it looked. */
function sessionLengthScore({ minutesSinceReset }: ScoreInput) {
  return clamp(((minutesSinceReset - 20) / 40) * 100)
}

export function scoreStuckness(input: ScoreInput): Stuckness {
  const breakdown: StucknessBreakdown = {
    continuousWork: continuousWorkScore(input),
    pausePattern: pausePatternScore(input),
    activityOscillation: activityOscillationScore(input),
    sessionLength: sessionLengthScore(input),
  }

  const score = clamp(
    (Object.keys(WEIGHTS) as (keyof StucknessBreakdown)[]).reduce(
      (sum, key) => sum + breakdown[key] * WEIGHTS[key],
      0,
    ),
  )

  return { score, level: levelFor(score), breakdown }
}

export function levelFor(score: number): StuckLevel {
  if (score >= 80) return 'overloaded'
  if (score >= 65) return 'stuck'
  if (score >= 40) return 'loaded'
  return 'clear'
}

export const LEVEL_COPY: Record<StuckLevel, { label: string; blurb: string; tone: string }> = {
  clear: {
    label: 'Clear',
    blurb: 'Nothing to see here. Carry on.',
    tone: 'mint',
  },
  loaded: {
    label: 'Loaded',
    blurb: 'A fair bit going on, but you look fine.',
    tone: 'sky',
  },
  stuck: {
    label: 'Might be stuck',
    blurb: 'Your rhythm has gone start-stop for a while.',
    tone: 'butter',
  },
  overloaded: {
    label: 'Probably overloaded',
    blurb: 'Long stretch, lots of churn. Worth a pause.',
    tone: 'peach',
  },
}

export const SIGNAL_COPY: Record<keyof StucknessBreakdown, { label: string; why: string }> = {
  continuousWork: {
    label: 'Continuous work',
    why: 'How long since you last stepped away from the desk.',
  },
  pausePattern: {
    label: 'Pause pattern',
    why: 'Gaps appearing inside an otherwise active stretch.',
  },
  activityOscillation: {
    label: 'Start-stop rhythm',
    why: 'Bursts of activity separated by stalls — writing, deleting, staring.',
  },
  sessionLength: {
    label: 'Time since reset',
    why: 'How long it has been since your last break, quest or unload.',
  },
}
