import { useState } from 'react'
import { motion } from 'framer-motion'

import { ActivitySparkline, StucknessMeter } from '../components/ActivityIndicator'
import { Companion } from '../components/Companion'
import { ParkingLot } from '../components/ParkingLot'
import { Button, Card, SectionLabel } from '../components/ui'
import { useStore } from '../state/store'

const clock = (seconds: number) => {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Focus mode.
 *
 * Big timer, one goal, and an "I'm stuck" button — the manual escape hatch
 * that makes the whole product work even when the automatic detection
 * misses, which it sometimes will.
 */
export function Focus() {
  const {
    session,
    sessionSeconds,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    items,
    open,
    stuckness,
    buckets,
    settings,
    stats,
  } = useStore()

  const focusItem = items.find((i) => i.lane === 'focus' && !i.done)
  const parkedCount = items.filter((i) => !i.done && i.lane === 'parked').length
  const [customGoal, setCustomGoal] = useState('')

  const remaining = session.targetSeconds - sessionSeconds
  const overtime = remaining < 0
  const progress = Math.min(1, sessionSeconds / Math.max(1, session.targetSeconds))

  if (!session.active) {
    return (
      <div className="mx-auto max-w-xl py-6">
        <Card className="text-center">
          <SectionLabel>Focus mode</SectionLabel>
          <h1 className="font-display mt-2 text-4xl leading-tight">One thing at a time</h1>
          <p className="text-ink-soft mt-3">
            {settings.focusMinutes} minutes on a single thing. UNLOAD stays quiet unless your rhythm suggests you're
            stuck — and you can always call it yourself.
          </p>

          <div className="mt-7 text-left">
            <SectionLabel>What are you working on?</SectionLabel>
            {focusItem && (
              <button
                onClick={() => startSession(focusItem.text)}
                className="border-peach/40 bg-peach-soft/25 hover:bg-peach-soft/50 mt-2 w-full rounded-2xl border-2 px-4 py-3.5 text-left transition-colors"
              >
                <span className="label-caps">From your parking lot</span>
                <span className="font-display mt-0.5 block text-lg">{focusItem.text}</span>
              </button>
            )}

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                startSession(customGoal.trim() || null)
              }}
            >
              <label htmlFor="goal" className="sr-only-focusable">
                Or type what you're working on
              </label>
              <input
                id="goal"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder={focusItem ? 'Or something else…' : 'e.g. Finish assignment'}
                maxLength={90}
                className="bg-cream/70 border-cream-deep focus:border-lilac min-w-0 flex-1 rounded-2xl border-2 px-4 py-3 outline-none transition-colors"
              />
              <Button type="submit" tone="plain" variant="soft">
                Start
              </Button>
            </form>
          </div>

          {parkedCount > 0 && (
            <p className="text-ink-faint mt-6 text-sm">
              🧠 {parkedCount} {parkedCount === 1 ? 'thought is' : 'thoughts are'} parked and can stay that way.
            </p>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 py-2 lg:grid-cols-[1.4fr_1fr]">
      <Card className="flex flex-col items-center justify-center py-14 text-center">
        <SectionLabel>{session.paused ? 'Paused' : 'Focus mode'}</SectionLabel>

        <h1 className="font-display mt-3 max-w-md text-3xl leading-tight text-balance">
          {session.goal ?? 'Whatever you sat down to do'}
        </h1>

        <motion.p
          className={`font-display tabular mt-7 text-7xl tracking-tight sm:text-8xl ${
            session.paused ? 'text-ink-faint' : overtime ? 'text-peach' : ''
          }`}
          animate={session.paused ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
          transition={session.paused ? { duration: 2.4, repeat: Infinity } : { duration: 0.2 }}
          aria-live="off"
        >
          {overtime ? '+' : ''}
          {clock(remaining)}
        </motion.p>

        <p className="text-ink-faint mt-1 text-sm">
          {overtime ? 'Over your planned time — no penalty either way.' : `of ${settings.focusMinutes} minutes`}
        </p>

        <div className="bg-cream-deep mt-5 h-2 w-56 overflow-hidden rounded-full">
          <motion.div
            className={`h-full rounded-full ${overtime ? 'bg-peach' : 'bg-mint'}`}
            animate={{ width: `${Math.max(2, progress * 100)}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>

        {parkedCount > 0 && (
          <p className="text-ink-soft mt-6 text-sm">
            🧠 {parkedCount} {parkedCount === 1 ? 'thought' : 'thoughts'} parked — none of them are for right now.
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {session.paused ? (
            <Button tone="mint" size="lg" onClick={resumeSession}>
              Resume
            </Button>
          ) : (
            <Button tone="plain" variant="soft" size="lg" onClick={pauseSession}>
              Pause
            </Button>
          )}
          <Button
            tone="peach"
            size="lg"
            onClick={() => open({ kind: 'companion', reason: 'manual', score: stuckness.score })}
          >
            I'm stuck
          </Button>
          <Button variant="ghost" size="lg" onClick={endSession}>
            End session
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="text-center">
          <div className="flex justify-center">
            <Companion expression={session.paused ? 'sleepy' : stuckness.level === 'clear' ? 'idle' : 'curious'} size={96} />
          </div>
          <p className="text-ink-soft mt-2 text-sm">
            {session.paused
              ? 'Taking five. Nothing is running.'
              : 'Watching your rhythm, not your screen.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button tone="sky" variant="soft" size="sm" onClick={() => open({ kind: 'break' })}>
              🧘 Break
            </Button>
            <Button tone="butter" variant="soft" size="sm" onClick={() => open({ kind: 'quest' })}>
              🎮 Quest
            </Button>
          </div>
        </Card>

        <Card>
          <SectionLabel>Right now</SectionLabel>
          <div className="mt-3">
            <StucknessMeter stuckness={stuckness} compact />
          </div>
          <div className="mt-4">
            <ActivitySparkline buckets={buckets} bars={22} />
          </div>
          <div className="text-ink-faint mt-3 flex justify-between text-xs">
            <span>Reset XP today</span>
            <span className="tabular">{stats.xp}</span>
          </div>
        </Card>

        <Card>
          <SectionLabel>🧠 Parked</SectionLabel>
          <div className="mt-3">
            <ParkingLot compact />
          </div>
        </Card>
      </div>
    </div>
  )
}
