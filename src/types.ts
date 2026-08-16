/** Shared vocabulary for the whole app. */

export type Priority = 'high' | 'medium' | 'low'

export type Category =
  | 'academic'
  | 'work'
  | 'communication'
  | 'personal'
  | 'health'
  | 'admin'
  | 'creative'
  | 'thought'

export interface ParkedItem {
  id: string
  text: string
  priority: Priority
  category: Category
  /** `focus` is the single thing to do next; everything else waits in `parked`. */
  lane: 'focus' | 'parked'
  done: boolean
  createdAt: number
}

export interface OrganizeResult {
  summary: string
  items: { text: string; priority: Priority; category: Category }[]
  recommended_focus: string
  /** Which path produced this — surfaced in the UI so it's never a mystery. */
  source: 'anthropic' | 'openai' | 'local'
  /** Set when the dump mentioned something that deserves a human, not an app. */
  supportNote?: string
}

/** How loaded the person might be. Deliberately about workflow, not feelings. */
export type StuckLevel = 'clear' | 'loaded' | 'stuck' | 'overloaded'

export interface StucknessBreakdown {
  continuousWork: number
  pausePattern: number
  activityOscillation: number
  sessionLength: number
}

export interface Stuckness {
  score: number
  level: StuckLevel
  breakdown: StucknessBreakdown
}

/**
 * One 10-second slice of activity.
 *
 * Note what is NOT here: no key codes, no characters, no coordinates,
 * no window titles, no URLs. Counts and a timestamp, nothing else.
 */
export interface ActivityBucket {
  t: number
  keys: number
  mouse: number
}

export type Personality = 'calm' | 'cozy' | 'chaotic' | 'nerd' | 'zen'

export interface Settings {
  name: string
  personality: Personality
  /** Master switch for the automatic nudge. Manual "I'm stuck" always works. */
  autoNudge: boolean
  /** Score at which the companion appears. */
  sensitivity: number
  reducedMotion: boolean
  soundOn: boolean
  demoMode: boolean
  focusMinutes: number
  /** Whether Mochi lives in the workspace at all. */
  mochiVisible: boolean
  /** Whether Mochi wanders. Off = Mochi stays put in its corner. */
  mochiRoams: boolean
}

/**
 * What Mochi is doing right now.
 *
 * Deliberately separate from `StuckLevel`: the score says how loaded the
 * person might be, this says which pose is on screen. One drives the other,
 * but they change on completely different timescales.
 */
export type MochiPose =
  | 'walk'
  | 'idle'
  | 'sit'
  | 'look'
  | 'stretch'
  | 'yawn'
  | 'sleep'
  | 'alert'
  | 'talk'
  | 'cheer'

export interface Stats {
  /** ISO date (YYYY-MM-DD) these daily counters belong to. */
  day: string
  thoughtsParked: number
  breaksTaken: number
  questsDone: number
  focusSessions: number
  mind: number
  body: number
  xp: number
}

export interface SessionState {
  active: boolean
  paused: boolean
  /** Timestamp the current run started; null when not running. */
  startedAt: number | null
  /** Seconds already banked from previous runs of this session. */
  elapsedBefore: number
  goal: string | null
  targetSeconds: number
}

export type Interruption =
  | { kind: 'closed' }
  | { kind: 'companion'; reason: 'auto' | 'manual' | 'demo'; score: number }
  | { kind: 'dump' }
  | { kind: 'break' }
  | { kind: 'quest' }
  /** `mochiLine` is what the companion says about it, in a speech bubble. */
  | { kind: 'reward'; title: string; lines: string[]; mochiLine?: string }
