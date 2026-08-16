import { useEffect, useMemo, useRef, useState } from 'react'

import { useStore } from '../../state/store'
import type { Expression } from '../Companion'
import type { MochiPose, StuckLevel } from '../../types'

/**
 * Mochi's behaviour, separated from Mochi's rendering.
 *
 * This owns two things: where Mochi is, and what Mochi is doing. It reads
 * the existing store — the activity engine, the stuckness score and the
 * interruption state are untouched — and turns them into a pose and a
 * position. Nothing in here feeds anything back into the detector.
 */

export interface Point {
  x: number
  y: number
}

export type MochiMode = 'hidden' | 'roam' | 'summon' | 'cheer'

/** Matches `max-w-6xl` on the app shell, so we can find the empty gutters. */
const CONTENT_WIDTH = 1152
const EDGE = 16
/** Header is ~96px, footer ~70px; keep out of both. */
const TOP_SAFE = 132
const BOTTOM_SAFE = 84

/**
 * Places Mochi is allowed to be.
 *
 * On a wide screen the side gutters are genuinely empty, which is where a
 * wandering creature belongs. On anything narrower there are no gutters, so
 * Mochi keeps to the very bottom edge where it can't sit on top of text.
 */
function computeSpots(vw: number, vh: number, size: number): Point[] {
  const spots: Point[] = []
  const gutter = (vw - CONTENT_WIDTH) / 2
  const floor = vh - size - EDGE

  if (gutter >= size + 24) {
    const top = TOP_SAFE
    const bottom = vh - size - BOTTOM_SAFE
    const left = Math.max(EDGE, gutter / 2 - size / 2)
    const right = Math.min(vw - size - EDGE, vw - gutter / 2 - size / 2)

    for (const x of [left, right]) {
      for (const f of [0.12, 0.42, 0.72]) {
        spots.push({ x, y: top + (bottom - top) * f })
      }
    }
  }

  // The bottom strip always works, whatever the width.
  spots.push({ x: EDGE + 8, y: floor })
  spots.push({ x: vw / 2 - size / 2, y: floor })
  spots.push({ x: vw - size - EDGE - 8, y: floor })

  return spots
}

/**
 * A walk, broken into legs.
 *
 * The gutters are safe and the floor is safe, but the straight line between
 * the left and right gutters goes directly across the dashboard. So a
 * cross-screen trip goes down to the floor, along it, and back up — which
 * also happens to look far more like something walking around a desk than
 * gliding through a monitor.
 */
function route(from: Point, to: Point, vw: number, vh: number, size: number): Point[] {
  const gutter = (vw - CONTENT_WIDTH) / 2
  if (gutter < size + 24) return [to]

  const shellLeft = gutter
  const shellRight = vw - gutter
  const startsLeft = from.x + size <= shellLeft
  const startsRight = from.x >= shellRight
  const endsLeft = to.x + size <= shellLeft
  const endsRight = to.x >= shellRight

  const crosses = (startsLeft && endsRight) || (startsRight && endsLeft)
  if (!crosses) return [to]

  const floor = vh - size - EDGE
  return [
    { x: from.x, y: floor },
    { x: to.x, y: floor },
    to,
  ]
}

const legSeconds = (from: Point, to: Point) =>
  Math.min(4, Math.max(1.1, Math.hypot(to.x - from.x, to.y - from.y) / 150))

/** Mochi's corner. Where it drifts back to, and where it starts. */
const homeSpot = (vw: number, vh: number, size: number): Point => ({
  x: vw - size - 28,
  y: vh - size - 28,
})

/**
 * Where Mochi stands to talk.
 *
 * `BUBBLE_TAIL_FROM_RIGHT` is shared with MochiLayer so that the tail of the
 * speech bubble lands directly over Mochi's head. If you move one, move the
 * other — a tail pointing at empty space is worse than no tail.
 */
export const BUBBLE_TAIL_FROM_RIGHT = 60

const talkSpot = (vw: number, vh: number, size: number): Point => ({
  x: Math.max(EDGE, vw - BUBBLE_TAIL_FROM_RIGHT - size / 2),
  y: vh - size - 36,
})

/** How long each pose lasts, in ms. */
const POSE_MS: Record<MochiPose, [number, number]> = {
  walk: [2400, 3200],
  idle: [2600, 4500],
  sit: [5000, 9000],
  look: [2600, 4200],
  stretch: [2800, 2800],
  yawn: [2800, 2800],
  sleep: [10000, 16000],
  alert: [950, 950],
  talk: [0, 0],
  cheer: [3000, 3000],
}

type Weighted = [MochiPose, number][]

/** Calm and rested wanders more; a long session makes Mochi sleepy too. */
const WEIGHTS: Record<'clear' | 'loaded', Weighted> = {
  clear: [
    ['walk', 44],
    ['look', 18],
    ['sit', 14],
    ['stretch', 10],
    ['yawn', 7],
    ['sleep', 7],
  ],
  loaded: [
    ['walk', 24],
    ['sit', 24],
    ['look', 16],
    ['yawn', 18],
    ['sleep', 16],
    ['stretch', 2],
  ],
}

const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo)

function pickPose(previous: MochiPose, level: StuckLevel, canWalk: boolean): MochiPose {
  let pool = WEIGHTS[level === 'clear' ? 'clear' : 'loaded']
  if (!canWalk) pool = pool.filter(([p]) => p !== 'walk')
  // Never two walks back to back — arriving somewhere and immediately
  // leaving again reads as twitchy rather than alive.
  if (previous === 'walk') pool = pool.filter(([p]) => p !== 'walk')

  const total = pool.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [pose, weight] of pool) {
    roll -= weight
    if (roll <= 0) return pose
  }
  return 'idle'
}

const EXPRESSION: Record<MochiPose, Expression> = {
  walk: 'idle',
  idle: 'idle',
  sit: 'idle',
  look: 'curious',
  stretch: 'stretch',
  yawn: 'yawn',
  sleep: 'sleepy',
  alert: 'alert',
  talk: 'curious',
  cheer: 'happy',
}

export interface MochiBehavior {
  mode: MochiMode
  pose: MochiPose
  pos: Point
  /** 1 = facing right, -1 = facing left. */
  facing: 1 | -1
  expression: Expression
  /** True while Mochi is walking, so the layer can add a bob. */
  moving: boolean
  /** Travel duration for the current move, in seconds. */
  travel: number
  size: number
}

export function useMochiBehavior(size: number): MochiBehavior {
  const { settings, stuckness, interruption } = useStore()

  const [viewport, setViewport] = useState(() => ({
    w: typeof window === 'undefined' ? 1440 : window.innerWidth,
    h: typeof window === 'undefined' ? 900 : window.innerHeight,
  }))

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const home = useMemo(() => homeSpot(viewport.w, viewport.h, size), [viewport, size])
  const anchor = useMemo(() => talkSpot(viewport.w, viewport.h, size), [viewport, size])
  const spots = useMemo(() => computeSpots(viewport.w, viewport.h, size), [viewport, size])

  const [pose, setPose] = useState<MochiPose>('idle')
  const [pos, setPos] = useState<Point>(home)
  const [facing, setFacing] = useState<1 | -1>(-1)
  const [travel, setTravel] = useState(2.8)
  const [cheering, setCheering] = useState(false)
  /** Bumped on every transition so the scheduler re-arms even pose-to-same-pose. */
  const [seq, setSeq] = useState(0)

  const posRef = useRef(pos)
  posRef.current = pos
  const walksSinceHome = useRef(0)
  /** Remaining legs of the current walk, and how long the whole walk takes. */
  const [route_, setRoute] = useState<Point[]>([])
  const walkMs = useRef(2800)
  const legTimers = useRef<number[]>([])

  const still = settings.reducedMotion
  const canWalk = settings.mochiRoams && !still

  /* ---------------- mode ---------------- */

  const prevKind = useRef(interruption.kind)
  useEffect(() => {
    // Finishing a break, quest or dump earns a small celebration.
    if (prevKind.current === 'reward' && interruption.kind === 'closed') {
      setCheering(true)
      const t = window.setTimeout(() => setCheering(false), 3200)
      prevKind.current = interruption.kind
      return () => window.clearTimeout(t)
    }
    prevKind.current = interruption.kind
  }, [interruption.kind])

  const mode: MochiMode = !settings.mochiVisible
    ? 'hidden'
    : interruption.kind === 'companion'
      ? 'summon'
      : interruption.kind !== 'closed'
        ? // A full sheet owns the screen and has its own Mochi in it.
          'hidden'
        : cheering
          ? 'cheer'
          : 'roam'

  /* ---------------- summon sequence ---------------- */

  useEffect(() => {
    if (mode !== 'summon') return

    if (still) {
      // No theatre when motion is reduced: Mochi is simply there, talking.
      setPos(anchor)
      setPose('talk')
      return
    }

    // Notice first, then cross the room. The pause is what makes it read as
    // "Mochi saw something" rather than "a panel appeared".
    const timers: number[] = []
    setPose('alert')

    timers.push(
      window.setTimeout(() => {
        setFacing(anchor.x >= posRef.current.x ? 1 : -1)
        setTravel(1.5)
        setPos(anchor)
        setPose('walk')
        timers.push(window.setTimeout(() => setPose('talk'), 1500))
      }, POSE_MS.alert[0]),
    )

    return () => timers.forEach(window.clearTimeout)
  }, [mode, still, anchor])

  /* ---------------- cheer ---------------- */

  useEffect(() => {
    if (mode === 'cheer') setPose('cheer')
  }, [mode])

  /* ---------------- roaming scheduler ---------------- */

  useEffect(() => {
    if (mode !== 'roam') return

    if (still) {
      setPose('idle')
      setPos(home)
      return
    }

    // Coming back from an interruption: settle, don't resume mid-stride.
    if (pose === 'talk' || pose === 'alert' || pose === 'cheer') {
      setPose('idle')
      return
    }

    const duration = pose === 'walk' ? walkMs.current : between(POSE_MS[pose])
    const timer = window.setTimeout(() => {
      const next = pickPose(pose, stuckness.level, canWalk)

      if (next === 'walk') {
        // Every few wanders, head back to the corner it belongs to.
        walksSinceHome.current += 1
        const target =
          walksSinceHome.current >= 4
            ? ((walksSinceHome.current = 0), home)
            : spots[Math.floor(Math.random() * spots.length)]

        const legs = route(posRef.current, target, viewport.w, viewport.h, size)
        // Computed here, before the render, so the scheduler below can't read
        // a stale duration for the walk it is about to time.
        let total = 0
        let cursor = posRef.current
        for (const leg of legs) {
          total += legSeconds(cursor, leg)
          cursor = leg
        }
        walkMs.current = total * 1000 + 500
        setRoute(legs)
      }

      setPose(next)
      setSeq((n) => n + 1)
    }, duration)

    return () => window.clearTimeout(timer)
    // `pos` is deliberately absent: it changes as a *result* of a transition,
    // and including it would restart the timer mid-walk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pose, seq, stuckness.level, canWalk, still, home, spots])

  /* ---------------- walk the legs of the current route ---------------- */

  useEffect(() => {
    legTimers.current.forEach(window.clearTimeout)
    legTimers.current = []
    if (route_.length === 0) return

    let elapsed = 0
    let cursor = posRef.current

    for (const leg of route_) {
      const seconds = legSeconds(cursor, leg)
      const at = elapsed
      const target = leg
      legTimers.current.push(
        window.setTimeout(() => {
          setFacing(target.x >= posRef.current.x ? 1 : -1)
          setTravel(seconds)
          setPos(target)
        }, at * 1000),
      )
      elapsed += seconds
      cursor = leg
    }

    return () => legTimers.current.forEach(window.clearTimeout)
  }, [route_])

  /** An interruption cancels whatever walk was in progress. */
  useEffect(() => {
    if (mode !== 'roam') {
      legTimers.current.forEach(window.clearTimeout)
      legTimers.current = []
      setRoute([])
    }
  }, [mode])

  /* ---------------- keep Mochi on screen ---------------- */

  useEffect(() => {
    setPos((p) => ({
      x: Math.min(Math.max(EDGE, p.x), Math.max(EDGE, viewport.w - size - EDGE)),
      y: Math.min(Math.max(EDGE, p.y), Math.max(EDGE, viewport.h - size - EDGE)),
    }))
  }, [viewport, size])

  const expression: Expression =
    pose === 'talk' && stuckness.level === 'overloaded' ? 'concerned' : EXPRESSION[pose]

  return {
    mode,
    pose,
    pos,
    facing,
    expression,
    moving: pose === 'walk',
    travel,
    size,
  }
}
