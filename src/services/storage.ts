import type { ParkedItem, Settings, Stats } from '../types'

/**
 * Everything UNLOAD remembers lives in this browser's localStorage.
 * There is no account, no sync, no server-side record. Clearing site
 * data is a complete and permanent uninstall.
 */

const PREFIX = 'unload:v1:'

const KEYS = {
  settings: `${PREFIX}settings`,
  parking: `${PREFIX}parking`,
  stats: `${PREFIX}stats`,
  totals: `${PREFIX}totals`,
  lastDump: `${PREFIX}lastDump`,
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    // Merge so that a new field added in a later version doesn't come back
    // undefined for someone with existing saved data.
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? { ...(fallback as object), ...parsed } as T
      : (parsed as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing or a full quota — the app keeps working in memory.
  }
}

export const today = () => new Date().toISOString().slice(0, 10)

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  personality: 'calm',
  autoNudge: true,
  sensitivity: 65,
  reducedMotion: false,
  soundOn: false,
  demoMode: false,
  focusMinutes: 25,
}

export const emptyStats = (): Stats => ({
  day: today(),
  thoughtsParked: 0,
  breaksTaken: 0,
  questsDone: 0,
  focusSessions: 0,
  mind: 0,
  body: 0,
  xp: 0,
})

export const storage = {
  loadSettings: () => read<Settings>(KEYS.settings, DEFAULT_SETTINGS),
  saveSettings: (s: Settings) => write(KEYS.settings, s),

  loadParking: (): ParkedItem[] => {
    const items = read<ParkedItem[]>(KEYS.parking, [])
    return Array.isArray(items) ? items : []
  },
  saveParking: (items: ParkedItem[]) => write(KEYS.parking, items),

  /** Daily counters roll over at midnight; lifetime totals never reset. */
  loadStats: (): Stats => {
    const stats = read<Stats>(KEYS.stats, emptyStats())
    return stats.day === today() ? stats : { ...emptyStats() }
  },
  saveStats: (s: Stats) => write(KEYS.stats, s),

  loadTotals: () => read(KEYS.totals, { xp: 0, mind: 0, body: 0, resets: 0 }),
  saveTotals: (t: { xp: number; mind: number; body: number; resets: number }) => write(KEYS.totals, t),

  loadLastDump: () => read<{ summary: string; at: number } | null>(KEYS.lastDump, null),
  saveLastDump: (d: { summary: string; at: number }) => write(KEYS.lastDump, d),

  /** Used by Settings → "Erase everything". */
  clearAll: () => {
    Object.values(KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k)
      } catch {
        /* ignore */
      }
    })
  },
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
