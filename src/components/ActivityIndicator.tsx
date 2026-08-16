import { motion } from 'framer-motion'
import type { ActivityBucket, Stuckness } from '../types'
import { LEVEL_COPY, SIGNAL_COPY } from '../services/activity'
import { SectionLabel } from './ui'

/**
 * The honesty panel.
 *
 * Anything that decides when to interrupt someone should be inspectable, so
 * this shows the raw signal and every component of the score. The bars are
 * event *counts* per ten seconds — no content, ever.
 */

const TONE_BAR: Record<string, string> = {
  mint: 'bg-mint',
  sky: 'bg-sky',
  butter: 'bg-butter',
  peach: 'bg-peach',
}

const TONE_TEXT: Record<string, string> = {
  mint: 'text-mint',
  sky: 'text-sky',
  butter: 'text-butter',
  peach: 'text-peach',
}

export function ActivitySparkline({ buckets, bars = 28 }: { buckets: ActivityBucket[]; bars?: number }) {
  const recent = buckets.slice(-bars)
  const padded = [...Array(Math.max(0, bars - recent.length)).fill(null), ...recent] as (ActivityBucket | null)[]
  const peak = Math.max(12, ...recent.map((b) => b.keys + b.mouse))

  return (
    <div className="flex h-14 items-end gap-[3px]" role="img" aria-label="Recent activity, newest on the right">
      {padded.map((bucket, i) => {
        const total = bucket ? bucket.keys + bucket.mouse : 0
        const height = bucket === null ? 6 : Math.max(6, (total / peak) * 100)
        return (
          <motion.div
            key={i}
            className={`flex-1 rounded-full ${
              bucket === null ? 'bg-cream-deep/60' : total === 0 ? 'bg-cream-deep' : 'bg-lilac/60'
            }`}
            initial={false}
            animate={{ height: `${height}%` }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          />
        )
      })}
    </div>
  )
}

export function StucknessMeter({ stuckness, compact = false }: { stuckness: Stuckness; compact?: boolean }) {
  const copy = LEVEL_COPY[stuckness.level]

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`font-display text-2xl ${TONE_TEXT[copy.tone]}`}>{copy.label}</p>
        <p className="tabular text-ink-faint text-sm">{stuckness.score}/100</p>
      </div>

      <div className="bg-cream-deep mt-2.5 h-2.5 w-full overflow-hidden rounded-full">
        <motion.div
          className={`h-full rounded-full ${TONE_BAR[copy.tone]}`}
          initial={false}
          animate={{ width: `${Math.max(3, stuckness.score)}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        />
      </div>

      {!compact && <p className="text-ink-soft mt-2.5 text-sm">{copy.blurb}</p>}
    </div>
  )
}

export function SignalBreakdown({ stuckness }: { stuckness: Stuckness }) {
  const entries = Object.entries(stuckness.breakdown) as [keyof typeof SIGNAL_COPY, number][]

  return (
    <ul className="space-y-3">
      {entries.map(([key, value]) => (
        <li key={key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{SIGNAL_COPY[key].label}</span>
            <span className="tabular text-ink-faint text-xs">{value}</span>
          </div>
          <div className="bg-cream-deep mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
            <motion.div
              className="bg-ink-faint/70 h-full rounded-full"
              initial={false}
              animate={{ width: `${Math.max(2, value)}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 26 }}
            />
          </div>
          <p className="text-ink-faint mt-1 text-xs leading-relaxed">{SIGNAL_COPY[key].why}</p>
        </li>
      ))}
    </ul>
  )
}

export function PrivacyNote({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-mint-soft/40 border-mint/25 rounded-2xl border px-4 py-3.5 ${className}`}>
      <SectionLabel className="!text-[#2c7a63]">🔒 Private by design</SectionLabel>
      <p className="text-ink-soft mt-1.5 text-sm leading-relaxed">
        UNLOAD is built to notice your workflow, not watch you. No webcam, no microphone, no screenshots, and no
        record of what you type — only how many key and pointer events happened in each ten seconds. All of it stays
        in this browser.
      </p>
    </div>
  )
}
