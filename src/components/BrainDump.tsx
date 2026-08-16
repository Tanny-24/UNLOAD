import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Companion } from './Companion'
import { Button, Sheet } from './ui'
import { organizeDump } from '../services/ai'
import { useStore } from '../state/store'

const EXAMPLE =
  'I need to finish my assignment, reply to my professor, study for tomorrow and buy groceries.'

/**
 * The dump box.
 *
 * Deliberately one big undecorated textarea. Anything that looks like a form
 * makes people tidy their thoughts before typing, which is the exact
 * behaviour this screen exists to prevent.
 */
export function BrainDump() {
  const { interruption, close, open, applyOrganize, aiStatus } = useStore()
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'thinking' | 'error'>('idle')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const visible = interruption.kind === 'dump'

  useEffect(() => {
    if (!visible) return
    setText('')
    setState('idle')
    const t = window.setTimeout(() => areaRef.current?.focus(), 120)
    return () => window.clearTimeout(t)
  }, [visible])

  async function submit() {
    const clean = text.trim()
    if (!clean || state === 'thinking') return

    setState('thinking')
    try {
      const result = await organizeDump(clean, aiStatus.mode)
      applyOrganize(result)
      open({
        kind: 'reward',
        title: 'Brain unloaded',
        lines: [
          result.summary,
          // Can be empty if everything in the dump was filtered out.
          ...(result.recommended_focus ? [`One thing to focus on: ${result.recommended_focus}`] : []),
          ...(result.supportNote ? [result.supportNote] : []),
        ],
      })
    } catch {
      // organizeDump already falls back internally; reaching here means
      // something genuinely unexpected happened.
      setState('error')
    }
  }

  /** Cmd/Ctrl+Enter submits — the muscle memory people already have. */
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <Sheet open={visible} onClose={close} labelledBy="dump-title" dismissible={state !== 'thinking'}>
      <AnimatePresence mode="wait">
        {state === 'thinking' ? (
          <motion.div
            key="thinking"
            className="py-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-center">
              <Companion expression="idle" size={120} />
            </div>
            <p className="font-display mt-4 text-2xl">Sorting it out…</p>
            <p className="text-ink-soft mt-1.5 text-sm">
              {aiStatus.mode === 'model' ? 'Working through what you wrote.' : 'Untangling this on your machine.'}
            </p>
            <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="bg-peach h-2 w-2 rounded-full"
                  animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.16 }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 id="dump-title" className="font-display text-3xl leading-tight text-balance">
              What's taking up space in your head?
            </h2>
            <p className="text-ink-soft mt-2">
              Don't organise it. Just dump it. Half-sentences are fine — that's the point.
            </p>

            <label htmlFor="dump-input" className="sr-only-focusable">
              Type everything on your mind
            </label>
            <textarea
              id="dump-input"
              ref={areaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={7}
              maxLength={4000}
              placeholder={`e.g. ${EXAMPLE}`}
              className="bg-cream/70 border-cream-deep focus:border-lilac mt-5 w-full resize-none rounded-3xl border-2 px-5 py-4 text-[1.05rem] leading-relaxed outline-none transition-colors placeholder:text-[color:var(--color-ink-faint)]"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setText(EXAMPLE)
                  areaRef.current?.focus()
                }}
                className="text-ink-faint hover:text-ink-soft rounded-lg text-xs underline underline-offset-2 transition-colors"
              >
                Use the example
              </button>
              <span className="tabular text-ink-faint text-xs">{text.length}/4000</span>
            </div>

            {state === 'error' && (
              <p role="alert" className="bg-peach-soft/60 mt-4 rounded-2xl px-4 py-3 text-sm text-[#8a3c22]">
                Something went wrong sorting that. Your text is still here — try again.
              </p>
            )}

            <Button tone="peach" size="lg" block className="mt-5" disabled={!text.trim()} onClick={submit}>
              Unload my brain
            </Button>

            <p className="text-ink-faint mt-3 text-center text-xs">
              {aiStatus.mode === 'model'
                ? `Sent to ${aiStatus.provider} to be organised, then forgotten. Nothing is stored on a server.`
                : 'Organised on this machine. Nothing leaves your browser.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
