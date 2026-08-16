import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button, SectionLabel, Sheet } from './ui'
import { MICRO_BREAKS, type MicroBreak as Break } from '../data/breaks'
import { CALM_QUOTES } from '../data/messages'
import { useStore } from '../state/store'

const ACCENT_RING: Record<string, string> = {
  sky: 'from-sky-soft to-sky/50',
  mint: 'from-mint-soft to-mint/50',
  lilac: 'from-lilac-soft to-lilac/50',
  butter: 'from-butter-soft to-butter/50',
  peach: 'from-peach-soft to-peach/50',
}

/** A guided 30–60 second reset. Pick one, follow it, go back to work. */
export function MicroBreak() {
  const { interruption, close, open, reward, markReset, settings } = useStore()
  const visible = interruption.kind === 'break'

  const [chosen, setChosen] = useState<Break | null>(null)

  useEffect(() => {
    if (!visible) setChosen(null)
  }, [visible])

  return (
    // Plain conditional rather than an AnimatePresence exit-then-enter: the
    // handover is one more thing that can wedge, and a break that refuses to
    // start is worse than one that doesn't cross-fade.
    <Sheet open={visible} onClose={close} labelledBy="break-title" dismissible={!chosen}>
      {chosen ? (
        <BreakRunner
          key={chosen.id}
          plan={chosen}
          reducedMotion={settings.reducedMotion}
          onQuit={() => setChosen(null)}
          onDone={() => {
            markReset()
            reward({ mind: 1, body: 1, xp: 6 }, 'break')
            open({
              kind: 'reward',
              title: 'Reset complete',
              lines: [`${chosen.title} — done.`, 'Nothing else is required of you right now.'],
            })
          }}
        />
      ) : (
        <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 id="break-title" className="font-display text-3xl leading-tight">
              Take a tiny break
            </h2>
            <p className="text-ink-soft mt-2">Under a minute, all of them. Nothing to install, nothing to watch you.</p>

            <ul className="mt-6 space-y-2.5">
              {MICRO_BREAKS.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setChosen(item)}
                    aria-label={`Start ${item.title}, ${item.seconds} seconds. ${item.blurb}`}
                    className="hover:bg-cream-deep/50 border-cream-deep flex w-full items-center gap-4 rounded-3xl border-2 border-transparent px-4 py-3.5 text-left transition-all hover:border-[color:var(--color-cream-deep)]"
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.title}</span>
                      <span className="text-ink-soft block text-sm">{item.blurb}</span>
                    </span>
                    <span className="tabular text-ink-faint shrink-0 text-xs">{item.seconds}s</span>
                  </button>
                </li>
              ))}
            </ul>

            <Button variant="ghost" block className="mt-5" onClick={close}>
              Not now
            </Button>
        </motion.div>
      )}
    </Sheet>
  )
}

function BreakRunner({
  plan,
  onDone,
  onQuit,
  reducedMotion,
}: {
  plan: Break
  onDone: () => void
  onQuit: () => void
  reducedMotion: boolean
}) {
  // A single elapsed counter, with the current step derived from it. Keeping
  // the only piece of state a pure increment means StrictMode's double
  // invocation can't skip a step or fire completion twice.
  const [elapsed, setElapsed] = useState(0)
  const doneRef = useRef(false)

  // Picked once per run so the line doesn't change under the reader.
  const quote = useMemo(() => CALM_QUOTES[Math.floor(Math.random() * CALM_QUOTES.length)], [])

  const totalSeconds = plan.steps.reduce((sum, s) => sum + s.seconds, 0)

  let stepIndex = 0
  let intoStep = elapsed
  while (stepIndex < plan.steps.length - 1 && intoStep >= plan.steps[stepIndex].seconds) {
    intoStep -= plan.steps[stepIndex].seconds
    stepIndex += 1
  }
  const step = plan.steps[stepIndex]
  const remaining = Math.max(0, step.seconds - intoStep)

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (elapsed < totalSeconds || doneRef.current) return
    doneRef.current = true
    const t = window.setTimeout(onDone, 350)
    return () => window.clearTimeout(t)
  }, [elapsed, totalSeconds, onDone])

  const scale = reducedMotion ? 1 : step.motion === 'in' ? 1.25 : step.motion === 'out' ? 0.8 : step.motion === 'hold' ? 1.12 : 1

  return (
    <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <SectionLabel>
        {plan.emoji} {plan.title}
      </SectionLabel>

      <div className="relative mx-auto mt-6 grid h-56 w-56 place-items-center">
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${ACCENT_RING[plan.accent]}`}
          animate={{ scale, opacity: step.motion === 'still' ? 0.5 : 0.85 }}
          transition={{ duration: Math.min(step.seconds, 4), ease: 'easeInOut' }}
        />
        <div className="bg-paper absolute inset-6 rounded-full" />
        <div className="relative px-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="font-display text-xl leading-snug text-balance"
            >
              {step.label === '__QUOTE__' ? quote : step.label}
            </motion.p>
          </AnimatePresence>
          {step.detail && <p className="text-ink-soft mt-1.5 text-xs">{step.detail}</p>}
        </div>
      </div>

      <p className="tabular text-ink-faint mt-5 text-sm" aria-live="polite">
        {remaining}s
      </p>

      <div className="bg-cream-deep mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full">
        <motion.div
          className="bg-ink-faint/60 h-full rounded-full"
          animate={{ width: `${(elapsed / totalSeconds) * 100}%` }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </div>

      <Button variant="ghost" size="sm" className="mt-5" onClick={onQuit}>
        Pick a different one
      </Button>
    </motion.div>
  )
}
