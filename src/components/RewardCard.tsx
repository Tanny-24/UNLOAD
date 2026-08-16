import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Companion } from './Companion'
import { Button, Sheet } from './ui'
import { SUPPORT_NOTE } from '../services/ai'
import { useStore } from '../state/store'

/**
 * The payoff screen shared by every flow: unload, break, quest.
 *
 * It exists to make the reset feel finished rather than merely interrupted,
 * and to hand back one clear next step instead of a to-do list.
 */
export function RewardCard() {
  const { interruption, close, open, stats, items, session } = useStore()
  const navigate = useNavigate()

  const visible = interruption.kind === 'reward'
  const title = interruption.kind === 'reward' ? interruption.title : ''
  const lines = interruption.kind === 'reward' ? interruption.lines : []

  const focus = items.find((i) => i.lane === 'focus' && !i.done)

  // The safety note is passed through as a line but must not look like a
  // cheerful bullet point, so it is pulled out and rendered separately.
  const supportNote = lines.find((l) => l === SUPPORT_NOTE)
  const normalLines = lines.filter((l) => l !== SUPPORT_NOTE)

  return (
    <Sheet open={visible} onClose={close} labelledBy="reward-title" width="max-w-md">
      <div className="text-center">
        {/* Celebration is wrong when the support note is showing. Same screen,
            quieter face, no tick, note first. */}
        <div className="flex justify-center">
          <Companion expression={supportNote ? 'idle' : 'happy'} size={140} enter />
        </div>

        {supportNote && (
          <div className="bg-sky-soft/45 border-sky/25 mt-4 rounded-2xl border px-4 py-3.5 text-left">
            <p className="text-sm leading-relaxed text-[#245c82]">{supportNote}</p>
          </div>
        )}

        <motion.h2
          id="reward-title"
          className="font-display mt-4 text-3xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          {title}
          {supportNote ? '' : ' ✓'}
        </motion.h2>

        <motion.div
          className="mt-3 space-y-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26 }}
        >
          {normalLines.map((line, i) => (
            <p key={i} className={i === 0 ? 'text-ink-soft leading-relaxed text-balance' : 'font-medium text-balance'}>
              {line}
            </p>
          ))}
        </motion.div>

        <motion.div
          className="bg-cream-deep/50 mt-6 flex items-center justify-center gap-6 rounded-2xl py-3.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
        >
          <Tally label="Mind" value={stats.mind} />
          <Tally label="Body" value={stats.body} />
          <Tally label="Reset XP" value={stats.xp} />
        </motion.div>

        <div className="mt-6 space-y-2">
          {focus && !session.active && (
            <Button
              tone="peach"
              size="lg"
              block
              onClick={() => {
                close()
                navigate('/focus')
              }}
            >
              Focus on "{focus.text}"
            </Button>
          )}
          {focus && session.active && (
            <Button tone="peach" size="lg" block onClick={close}>
              Back to focus
            </Button>
          )}
          <Button variant="ghost" block onClick={() => open({ kind: 'closed' })}>
            {focus ? 'Not yet' : 'Back to work'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display tabular text-2xl">{value}</p>
      <p className="label-caps mt-0.5">{label}</p>
    </div>
  )
}
