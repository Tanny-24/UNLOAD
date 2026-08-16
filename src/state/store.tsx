import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type {
  ActivityBucket,
  Interruption,
  OrganizeResult,
  ParkedItem,
  Priority,
  SessionState,
  Settings,
  Stats,
  Stuckness,
} from '../types'
import { activityEngine, scoreStuckness, type DemoProfile } from '../services/activity'
import { fetchAiStatus, type AiStatus } from '../services/ai'
import { DEFAULT_SETTINGS, emptyStats, storage, today, uid } from '../services/storage'

interface Totals {
  xp: number
  mind: number
  body: number
  resets: number
}

interface Store {
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void

  items: ParkedItem[]
  summary: string | null
  applyOrganize: (result: OrganizeResult) => void
  addItem: (text: string, priority?: Priority) => void
  setPriority: (id: string, priority: Priority) => void
  setLane: (id: string, lane: ParkedItem['lane']) => void
  toggleDone: (id: string) => void
  removeItem: (id: string) => void
  clearParking: () => void

  stats: Stats
  totals: Totals
  reward: (gain: { mind?: number; body?: number; xp?: number }, kind?: 'break' | 'quest') => void

  session: SessionState
  startSession: (goal: string | null) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => void
  sessionSeconds: number

  stuckness: Stuckness
  buckets: ActivityBucket[]
  minutesWorking: number
  snoozedUntil: number
  snooze: (minutes: number) => void
  markReset: () => void

  interruption: Interruption
  open: (next: Interruption) => void
  close: () => void

  aiStatus: AiStatus
  runDemo: (profile: DemoProfile) => void
}

const StoreContext = createContext<Store | null>(null)

const ZERO_STUCKNESS: Stuckness = {
  score: 0,
  level: 'clear',
  breakdown: { continuousWork: 0, pausePattern: 0, activityOscillation: 0, sessionLength: 0 },
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(() => storage.loadSettings())
  const [items, setItems] = useState<ParkedItem[]>(() => storage.loadParking())
  const [summary, setSummary] = useState<string | null>(() => storage.loadLastDump()?.summary ?? null)
  const [stats, setStats] = useState<Stats>(() => storage.loadStats())
  const [totals, setTotals] = useState<Totals>(() => storage.loadTotals())
  const [interruption, setInterruption] = useState<Interruption>({ kind: 'closed' })
  const [aiStatus, setAiStatus] = useState<AiStatus>({ mode: 'checking', provider: 'local', model: null })

  const [session, setSession] = useState<SessionState>({
    active: false,
    paused: false,
    startedAt: null,
    elapsedBefore: 0,
    goal: null,
    targetSeconds: DEFAULT_SETTINGS.focusMinutes * 60,
  })

  const [stuckness, setStuckness] = useState<Stuckness>(ZERO_STUCKNESS)
  const [buckets, setBuckets] = useState<ActivityBucket[]>([])
  const [minutesWorking, setMinutesWorking] = useState(0)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [snoozedUntil, setSnoozedUntil] = useState(0)

  /* ---------------------------------------------------------------- */
  /* Persistence                                                       */
  /* ---------------------------------------------------------------- */

  useEffect(() => storage.saveSettings(settings), [settings])
  useEffect(() => storage.saveParking(items), [items])
  useEffect(() => storage.saveStats(stats), [stats])
  useEffect(() => storage.saveTotals(totals), [totals])

  /** Animation preference is a document-level concern, not a component one. */
  useEffect(() => {
    document.documentElement.dataset.calm = String(settings.reducedMotion)
  }, [settings.reducedMotion])

  useEffect(() => {
    fetchAiStatus().then(setAiStatus)
  }, [])

  /* ---------------------------------------------------------------- */
  /* The clock                                                         */
  /*                                                                   */
  /* One interval drives everything time-based: the score, the session */
  /* timer, and the midnight rollover. Fewer timers, fewer surprises.  */
  /* ---------------------------------------------------------------- */

  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => {
    activityEngine.start()

    const tick = () => {
      setBuckets(activityEngine.snapshot())
      setMinutesWorking(activityEngine.sessionMinutes)
      setStuckness(
        scoreStuckness({
          buckets: activityEngine.snapshot(),
          sessionMinutes: activityEngine.sessionMinutes,
          minutesSinceReset: activityEngine.minutesSinceReset,
          idleSeconds: activityEngine.idleSeconds,
        }),
      )

      const s = sessionRef.current
      setSessionSeconds(
        s.active && !s.paused && s.startedAt
          ? s.elapsedBefore + Math.floor((Date.now() - s.startedAt) / 1000)
          : s.elapsedBefore,
      )

      setStats((prev) => (prev.day === today() ? prev : emptyStats()))
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
      activityEngine.stop()
    }
  }, [])

  /* ---------------------------------------------------------------- */
  /* The nudge                                                         */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!settings.autoNudge) return
    if (interruption.kind !== 'closed') return
    if (Date.now() < snoozedUntil) return
    if (stuckness.score < settings.sensitivity) return
    if (document.visibilityState !== 'visible') return

    setInterruption({ kind: 'companion', reason: 'auto', score: stuckness.score })
  }, [stuckness.score, settings.autoNudge, settings.sensitivity, interruption.kind, snoozedUntil])

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }))
  }, [])

  const snooze = useCallback((minutes: number) => {
    setSnoozedUntil(Date.now() + minutes * 60_000)
  }, [])

  const markReset = useCallback(() => {
    activityEngine.markReset()
    setStuckness(ZERO_STUCKNESS)
    setSnoozedUntil(Date.now() + 3 * 60_000)
    setTotals((t) => ({ ...t, resets: t.resets + 1 }))
  }, [])

  const open = useCallback((next: Interruption) => setInterruption(next), [])

  const close = useCallback(() => {
    setInterruption({ kind: 'closed' })
    // A closed overlay shouldn't instantly reopen because the score is
    // still high — give it a moment of quiet either way.
    setSnoozedUntil((prev) => Math.max(prev, Date.now() + 2 * 60_000))
  }, [])

  const applyOrganize = useCallback((result: OrganizeResult) => {
    const now = Date.now()
    const created: ParkedItem[] = result.items.map((item) => ({
      id: uid(),
      text: item.text,
      priority: item.priority,
      category: item.category,
      lane: item.text === result.recommended_focus ? 'focus' : 'parked',
      done: false,
      createdAt: now,
    }))

    // Exactly one thing can be in the focus lane. If the model didn't give
    // us a match, promote the first item so the lane is never empty.
    if (!created.some((i) => i.lane === 'focus') && created.length > 0) created[0].lane = 'focus'

    setItems((prev) => [...created, ...prev.filter((i) => !i.done).map((i) => ({ ...i, lane: 'parked' as const }))])
    setSummary(result.summary)
    storage.saveLastDump({ summary: result.summary, at: now })
    setStats((s) => ({ ...s, thoughtsParked: s.thoughtsParked + created.length }))
  }, [])

  const addItem = useCallback((text: string, priority: Priority = 'medium') => {
    const clean = text.trim()
    if (!clean) return
    setItems((prev) => [
      {
        id: uid(),
        text: clean.slice(0, 120),
        priority,
        category: 'thought',
        lane: prev.some((i) => i.lane === 'focus' && !i.done) ? 'parked' : 'focus',
        done: false,
        createdAt: Date.now(),
      },
      ...prev,
    ])
    setStats((s) => ({ ...s, thoughtsParked: s.thoughtsParked + 1 }))
  }, [])

  const setPriority = useCallback((id: string, priority: Priority) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, priority } : i)))
  }, [])

  /** Promoting to focus demotes whatever was there — only one focus at a time. */
  const setLane = useCallback((id: string, lane: ParkedItem['lane']) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, lane } : lane === 'focus' && i.lane === 'focus' ? { ...i, lane: 'parked' } : i,
      ),
    )
  }, [])

  const toggleDone = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i))

      // Completing the focus item shouldn't leave an empty focus lane.
      if (target && !target.done && target.lane === 'focus') {
        const promote = next.find((i) => !i.done && i.lane === 'parked')
        if (promote) promote.lane = 'focus'
      }
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearParking = useCallback(() => {
    setItems([])
    setSummary(null)
  }, [])

  const reward = useCallback(
    (gain: { mind?: number; body?: number; xp?: number }, kind?: 'break' | 'quest') => {
      const mind = gain.mind ?? 0
      const body = gain.body ?? 0
      const xp = gain.xp ?? 0
      setStats((s) => ({
        ...s,
        mind: s.mind + mind,
        body: s.body + body,
        xp: s.xp + xp,
        breaksTaken: s.breaksTaken + (kind === 'break' ? 1 : 0),
        questsDone: s.questsDone + (kind === 'quest' ? 1 : 0),
      }))
      setTotals((t) => ({ ...t, mind: t.mind + mind, body: t.body + body, xp: t.xp + xp }))
    },
    [],
  )

  const startSession = useCallback(
    (goal: string | null) => {
      setSession({
        active: true,
        paused: false,
        startedAt: Date.now(),
        elapsedBefore: 0,
        goal,
        targetSeconds: settings.focusMinutes * 60,
      })
      setStats((s) => ({ ...s, focusSessions: s.focusSessions + 1 }))
      activityEngine.markReset()
      setSnoozedUntil(0)
    },
    [settings.focusMinutes],
  )

  const pauseSession = useCallback(() => {
    setSession((s) =>
      !s.active || s.paused || !s.startedAt
        ? s
        : {
            ...s,
            paused: true,
            elapsedBefore: s.elapsedBefore + Math.floor((Date.now() - s.startedAt) / 1000),
            startedAt: null,
          },
    )
  }, [])

  const resumeSession = useCallback(() => {
    setSession((s) => (s.active && s.paused ? { ...s, paused: false, startedAt: Date.now() } : s))
  }, [])

  const endSession = useCallback(() => {
    setSession((s) => ({ ...s, active: false, paused: false, startedAt: null, elapsedBefore: 0 }))
    setSessionSeconds(0)
  }, [])

  const runDemo = useCallback(
    (profile: DemoProfile) => {
      activityEngine.injectDemo(profile)
      setSnoozedUntil(0)
      const next = scoreStuckness({
        buckets: activityEngine.snapshot(),
        sessionMinutes: activityEngine.sessionMinutes,
        minutesSinceReset: activityEngine.minutesSinceReset,
        idleSeconds: activityEngine.idleSeconds,
      })
      setStuckness(next)
      setMinutesWorking(activityEngine.sessionMinutes)

      // The point of a demo is that the thing happens, so a profile that
      // clears the bar opens the companion immediately rather than waiting
      // for the next tick.
      if (next.score >= settings.sensitivity) {
        setInterruption({ kind: 'companion', reason: 'demo', score: next.score })
      } else {
        setInterruption({ kind: 'closed' })
      }
    },
    [settings.sensitivity],
  )

  const value = useMemo<Store>(
    () => ({
      settings,
      setSettings,
      items,
      summary,
      applyOrganize,
      addItem,
      setPriority,
      setLane,
      toggleDone,
      removeItem,
      clearParking,
      stats,
      totals,
      reward,
      session,
      startSession,
      pauseSession,
      resumeSession,
      endSession,
      sessionSeconds,
      stuckness,
      buckets,
      minutesWorking,
      snoozedUntil,
      snooze,
      markReset,
      interruption,
      open,
      close,
      aiStatus,
      runDemo,
    }),
    [
      settings,
      setSettings,
      items,
      summary,
      applyOrganize,
      addItem,
      setPriority,
      setLane,
      toggleDone,
      removeItem,
      clearParking,
      stats,
      totals,
      reward,
      session,
      startSession,
      pauseSession,
      resumeSession,
      endSession,
      sessionSeconds,
      stuckness,
      buckets,
      minutesWorking,
      snoozedUntil,
      snooze,
      markReset,
      interruption,
      open,
      close,
      aiStatus,
      runDemo,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
