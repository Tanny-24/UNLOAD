import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import { ActivitySparkline, PrivacyNote, StucknessMeter } from '../components/ActivityIndicator'
import { Companion } from '../components/Companion'
import { ParkingLot } from '../components/ParkingLot'
import { Button, Card, SectionLabel, SpeechBubble } from '../components/ui'
import { DASHBOARD_LINES, greeting } from '../data/messages'
import { useStore } from '../state/store'

export function Home() {
  const { settings, stats, stuckness, buckets, minutesWorking, open, session, items } = useStore()
  const navigate = useNavigate()

  const focus = items.find((i) => i.lane === 'focus' && !i.done)
  const parkedCount = items.filter((i) => !i.done && i.lane === 'parked').length

  // Rotates roughly every 20 seconds — present, but never distracting.
  const line = DASHBOARD_LINES[settings.personality][Math.floor(Date.now() / 20_000) % 3]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2 pb-2">
        <div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{greeting(settings.name)} 👋</h1>
          <p className="text-ink-soft mt-2">
            {focus ? (
              <>
                One thing today: <span className="text-ink font-medium">{focus.text}</span>
              </>
            ) : (
              'Nothing claimed your attention yet. That is a fine place to start.'
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button tone="peach" size="lg" onClick={() => open({ kind: 'dump' })}>
            🧠 Unload
          </Button>
          <Button tone="plain" variant="soft" size="lg" onClick={() => navigate('/focus')}>
            {session.active ? 'Back to focus' : 'Start focus'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* ---------------- left column ---------------- */}
        <div className="space-y-6">
          <Card>
            <SectionLabel>Today's reset</SectionLabel>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat emoji="🧠" value={parkedCount} label="thoughts parked" />
              <Stat emoji="🧘" value={stats.breaksTaken} label="micro breaks" />
              <Stat emoji="🎮" value={stats.questsDone} label="quests done" />
              <Stat emoji="🎯" value={stats.focusSessions} label="focus sessions" />
            </div>
          </Card>

          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <SectionLabel>🧠 Your brain parking lot</SectionLabel>
              <Button size="sm" variant="ghost" onClick={() => open({ kind: 'dump' })}>
                + Unload
              </Button>
            </div>
            <div className="mt-4">
              <ParkingLot />
            </div>
          </Card>
        </div>

        {/* ---------------- right column ---------------- */}
        <div className="space-y-6">
          <Card className="text-center">
            <div className="flex justify-center">
              <Companion expression={stuckness.level === 'clear' ? 'idle' : 'curious'} size={112} />
            </div>
            <SpeechBubble className="mt-2">
              <p className="font-display text-lg">{line}</p>
            </SpeechBubble>
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
            <SectionLabel>Current session</SectionLabel>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <p className="font-display tabular text-4xl">{Math.max(0, Math.round(minutesWorking))}</p>
                <p className="label-caps mt-0.5">minutes at the desk</p>
              </div>
              <motion.div
                className="text-right"
                key={stats.xp}
                initial={{ scale: 1.25 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                <p className="font-display tabular text-2xl">{stats.xp}</p>
                <p className="label-caps mt-0.5">reset xp</p>
              </motion.div>
            </div>

            <div className="mt-5">
              <SectionLabel>Activity</SectionLabel>
              <div className="mt-2">
                <ActivitySparkline buckets={buckets} />
              </div>
              <p className="text-ink-faint mt-1.5 text-xs">
                Event counts per 10 seconds. Never what was typed.
              </p>
            </div>

            <div className="mt-5">
              <StucknessMeter stuckness={stuckness} />
            </div>

            <Button variant="ghost" size="sm" block className="mt-4" onClick={() => navigate('/settings')}>
              How this is measured →
            </Button>
          </Card>

          <PrivacyNote />
        </div>
      </div>
    </div>
  )
}

function Stat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="bg-cream/60 rounded-2xl px-4 py-3.5">
      <span className="text-lg" aria-hidden="true">
        {emoji}
      </span>
      <p className="font-display tabular mt-0.5 text-3xl">{value}</p>
      <p className="text-ink-soft mt-0.5 text-xs leading-snug">{label}</p>
    </div>
  )
}
