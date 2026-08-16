import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

import { Companion } from './Companion'
import { Button, Sheet, SpeechBubble } from './ui'
import { DISMISS_LINE, MANUAL_LINE, nudgeLine, subLine } from '../data/messages'
import { levelFor } from '../services/activity'
import { useStore } from '../state/store'

/**
 * The moment the whole product is built around.
 *
 * Rules it has to follow: never block work, never repeat itself immediately,
 * always offer a way out, and never tell the person how they feel — only
 * what their working rhythm looked like.
 */
export function CompanionPrompt() {
  const { interruption, close, open, settings, minutesWorking, snooze, markReset } = useStore()
  const [leaving, setLeaving] = useState(false)

  const visible = interruption.kind === 'companion'
  const score = interruption.kind === 'companion' ? interruption.score : 0
  const reason = interruption.kind === 'companion' ? interruption.reason : 'auto'
  const level = levelFor(score)

  // Freeze the line for the lifetime of this appearance, otherwise it would
  // reshuffle on every re-render.
  const line = useMemo(() => {
    if (!visible) return ''
    return reason === 'manual' ? MANUAL_LINE[settings.personality] : nudgeLine(settings.personality, level, score * 7)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reason, settings.personality, level])

  function dismiss(minutes: number) {
    setLeaving(true)
    snooze(minutes)
    window.setTimeout(() => {
      setLeaving(false)
      close()
    }, 900)
  }

  function choose(next: 'dump' | 'break' | 'quest') {
    markReset()
    open({ kind: next })
  }

  return (
    <Sheet open={visible} onClose={() => dismiss(10)} labelledBy="companion-line" width="max-w-md">
      <div className="text-center">
        <div className="flex justify-center">
          <Companion expression={leaving ? 'sleepy' : 'curious'} size={150} enter />
        </div>

        <SpeechBubble className="mt-3">
          <p id="companion-line" className="font-display text-xl leading-snug text-balance">
            {leaving ? DISMISS_LINE[settings.personality] : line}
          </p>
        </SpeechBubble>

        {!leaving && (
          <>
            <p className="text-ink-soft mt-4 text-sm">{subLine(minutesWorking, level)}</p>

            <motion.div
              className="mt-6 space-y-2.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <Button tone="peach" size="lg" block onClick={() => choose('dump')}>
                🧠 Unload
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button tone="sky" variant="soft" size="lg" onClick={() => choose('break')}>
                  🧘 Tiny break
                </Button>
                <Button tone="butter" variant="soft" size="lg" onClick={() => choose('quest')}>
                  🎮 Micro quest
                </Button>
              </div>
            </motion.div>

            <div className="mt-5 flex items-center justify-center gap-1">
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

            <p className="text-ink-faint mt-4 text-xs">
              {reason === 'manual'
                ? 'You called — no detection involved. Nothing you type is ever read.'
                : `Noticed from activity timing only — ${score}/100. Nothing you typed was read.`}
            </p>
          </>
        )}
      </div>
    </Sheet>
  )
}
