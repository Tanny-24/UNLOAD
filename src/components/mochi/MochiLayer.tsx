import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Companion } from '../Companion'
import { Button } from '../ui'
import { BUBBLE_TAIL_FROM_RIGHT, useMochiBehavior } from './useMochiBehavior'
import { DISMISS_LINE, MANUAL_LINE, nudgeLine, RESET_DONE, subLine } from '../../data/messages'
import { levelFor } from '../../services/activity'
import { useStore } from '../../state/store'

/**
 * The layer Mochi lives in.
 *
 * A fixed, click-through overlay above the app. Mochi wanders the empty
 * gutters while you work; when the existing stuckness engine crosses the
 * threshold, Mochi notices, walks over, and says something — with the same
 * four actions the modal prompt used to offer, wired to the same store.
 *
 * The important property is that none of this blocks the page. The old
 * prompt was a modal: it dimmed the app and trapped focus, which is the
 * behaviour of a notification, not a companion.
 */

const SIZE = 64
const SIZE_TALKING = 78

export function MochiLayer() {
  const { settings, stuckness, interruption, close, open, snooze, markReset, minutesWorking } = useStore()

  const talking = interruption.kind === 'companion'
  const behaviour = useMochiBehavior(talking ? SIZE_TALKING : SIZE)
  const { mode, pos, facing, expression, moving, travel, pose } = behaviour

  const [leaving, setLeaving] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const reason = interruption.kind === 'companion' ? interruption.reason : 'auto'
  const score = interruption.kind === 'companion' ? interruption.score : 0
  const level = levelFor(score)

  // Frozen for the lifetime of one appearance, so it can't reshuffle on a
  // re-render — and the store re-renders every second.
  const line = useMemo(() => {
    if (!talking) return ''
    return reason === 'manual' ? MANUAL_LINE[settings.personality] : nudgeLine(settings.personality, level, score * 7)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talking, reason, settings.personality, level])

  // Chosen when the celebration starts, not on every render, so the line
  // holds still long enough to be read.
  const [cheerLine, setCheerLine] = useState('')
  useEffect(() => {
    if (mode !== 'cheer') return
    const pool = RESET_DONE[settings.personality]
    setCheerLine(pool[Math.floor(Math.random() * pool.length)])
  }, [mode, settings.personality])

  /**
   * Focus goes to the card only when the person asked for Mochi. An
   * automatic nudge must never steal the caret out from under someone who
   * is mid-sentence.
   */
  useEffect(() => {
    if (!talking || reason === 'auto') return
    const t = window.setTimeout(() => cardRef.current?.querySelector('button')?.focus(), 420)
    return () => window.clearTimeout(t)
  }, [talking, reason])

  useEffect(() => {
    if (!talking) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss(10)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talking])

  useEffect(() => {
    if (!talking) setLeaving(false)
  }, [talking])

  function dismiss(minutes: number) {
    setLeaving(true)
    snooze(minutes)
    window.setTimeout(() => {
      setLeaving(false)
      close()
    }, 950)
  }

  function choose(next: 'dump' | 'break' | 'quest') {
    markReset()
    open({ kind: next })
  }

  if (mode === 'hidden') return null

  const bubble =
    mode === 'cheer' ? cheerLine : talking ? (leaving ? DISMISS_LINE[settings.personality] : line) : null

  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden={false}>
      {/* ---------------- Mochi ---------------- */}
      <motion.div
        className="pointer-events-auto absolute"
        style={{ width: behaviour.size }}
        initial={false}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ duration: travel, ease: [0.32, 0.08, 0.24, 1] }}
      >
        {/* The little hop while walking is separate from the travel tween so
            the two don't fight over the same transform. */}
        <motion.div
          animate={moving ? { y: [0, -3.5, 0] } : { y: 0 }}
          transition={moving ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        >
          <motion.div
            animate={{ scaleX: facing, scale: pose === 'talk' ? 1.06 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <button
              type="button"
              // Surfaced for debugging and for the behaviour checks — it is
              // the one bit of Mochi's internal state worth being able to see.
              data-mochi-pose={pose}
              onClick={() =>
                interruption.kind === 'closed' &&
                open({ kind: 'companion', reason: 'manual', score: stuckness.score })
              }
              aria-label="Mochi, your desk companion. Activate to ask for a reset."
              className="block cursor-pointer rounded-full border-0 bg-transparent p-0 outline-offset-4"
            >
              <Companion
                expression={expression}
                size={behaviour.size}
                float={pose === 'sit' || pose === 'sleep' ? false : !moving}
              />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ---------------- speech bubble ---------------- */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            key={mode === 'cheer' ? 'cheer' : 'talk'}
            className="pointer-events-auto fixed right-6 bottom-[8.5rem] w-[min(20rem,calc(100vw-3rem))]"
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          >
            <div
              ref={cardRef}
              role="status"
              aria-live="polite"
              className="card relative px-5 py-4 shadow-[var(--shadow-lift)]"
            >
              {/* Tail, pointing down at Mochi's head. Offset is
                  BUBBLE_TAIL_FROM_RIGHT minus the bubble's own right inset
                  (1.5rem), so the two stay locked together. */}
              <span
                aria-hidden="true"
                style={{ right: BUBBLE_TAIL_FROM_RIGHT - 24 - 8 }}
                className="bg-paper absolute -bottom-2 h-4 w-4 rotate-45 rounded-br-[3px] border-r border-b border-[rgb(120_96_72/0.09)]"
              />

              <p className="font-display text-lg leading-snug text-balance">{bubble}</p>

              {talking && !leaving && (
                <>
                  <p className="text-ink-soft mt-1.5 text-sm">
                    {reason === 'manual' ? 'Pick whatever helps.' : subLine(minutesWorking, level)}
                  </p>

                  <div className="mt-4 space-y-2">
                    <Button tone="peach" block onClick={() => choose('dump')}>
                      🧠 Unload
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button tone="sky" variant="soft" onClick={() => choose('break')}>
                        🧘 Break
                      </Button>
                      <Button tone="butter" variant="soft" onClick={() => choose('quest')}>
                        🎮 Quest
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => dismiss(25)}>
                      I'm good
                    </Button>
                    <span className="text-ink-faint/50" aria-hidden="true">
                      ·
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => dismiss(10)}>
                      Snooze 10 min
                    </Button>
                  </div>

                  <p className="text-ink-faint mt-2.5 text-center text-[0.68rem] leading-relaxed">
                    {reason === 'manual'
                      ? 'You called — no detection involved.'
                      : `Noticed from activity timing only — ${score}/100. Nothing you typed was read.`}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
