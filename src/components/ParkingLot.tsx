import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button, SectionLabel } from './ui'
import { EMPTY_PARKING } from '../data/messages'
import { useStore } from '../state/store'
import type { ParkedItem, Priority } from '../types'

/**
 * The Mental Parking Lot.
 *
 * One item sits in FOCUS NOW. Everything else is explicitly parked — the
 * point is not to shorten the list but to make it clear that only one line
 * of it is your problem right now.
 */

const PRIORITY_META: Record<Priority, { label: string; dot: string; chip: string }> = {
  high: { label: 'High', dot: 'bg-[color:var(--color-prio-high)]', chip: 'bg-peach-soft/70 text-[#8a3c22]' },
  medium: { label: 'Medium', dot: 'bg-[color:var(--color-prio-medium)]', chip: 'bg-butter-soft/70 text-[#795012]' },
  low: { label: 'Low', dot: 'bg-[color:var(--color-prio-low)]', chip: 'bg-cream-deep text-ink-soft' },
}

const CATEGORY_LABEL: Record<ParkedItem['category'], string> = {
  academic: 'Academic',
  work: 'Work',
  communication: 'Message',
  personal: 'Personal',
  health: 'Health',
  admin: 'Admin',
  creative: 'Creative',
  thought: 'Thought',
}

const PRIORITY_CYCLE: Priority[] = ['high', 'medium', 'low']

function Row({ item, focus = false }: { item: ParkedItem; focus?: boolean }) {
  const { setPriority, setLane, toggleDone, removeItem } = useStore()
  const meta = PRIORITY_META[item.priority]

  const nextPriority = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(item.priority) + 1) % PRIORITY_CYCLE.length]

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-colors ${
        focus ? 'bg-peach-soft/35' : 'hover:bg-cream-deep/45'
      }`}
    >
      <button
        onClick={() => toggleDone(item.id)}
        aria-pressed={item.done}
        aria-label={item.done ? `Mark "${item.text}" as not done` : `Mark "${item.text}" as done`}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-all ${
          item.done ? 'border-mint bg-mint text-white' : 'border-ink-faint/40 hover:border-mint'
        }`}
      >
        {item.done && (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5">
            <path d="M4 12.5l5.5 5.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`leading-snug ${focus ? 'font-display text-lg' : 'text-[0.95rem]'} ${
            item.done ? 'text-ink-faint line-through' : ''
          }`}
        >
          {item.text}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.68rem] ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
            {meta.label}
          </span>
          <span className="text-ink-faint text-[0.68rem]">{CATEGORY_LABEL[item.category]}</span>
        </div>
      </div>

      {/* Actions stay reachable by keyboard even though they fade in on hover. */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <IconAction
          label={`Change priority of "${item.text}" to ${nextPriority}`}
          onClick={() => setPriority(item.id, nextPriority)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </IconAction>

        {focus ? (
          <IconAction label={`Park "${item.text}" for later`} onClick={() => setLane(item.id, 'parked')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
          </IconAction>
        ) : (
          <IconAction label={`Make "${item.text}" the focus`} onClick={() => setLane(item.id, 'focus')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            </svg>
          </IconAction>
        )}

        <IconAction label={`Delete "${item.text}"`} onClick={() => removeItem(item.id)} danger>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </IconAction>
      </div>
    </motion.li>
  )
}

function IconAction({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
        danger ? 'text-ink-faint hover:bg-peach-soft/70 hover:text-[#8a3c22]' : 'text-ink-faint hover:bg-cream-deep hover:text-ink'
      }`}
    >
      <span className="h-4 w-4">{children}</span>
    </button>
  )
}

export function ParkingLot({ compact = false }: { compact?: boolean }) {
  const { items, summary, open, clearParking, addItem } = useStore()
  const [adding, setAdding] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const live = items.filter((i) => !i.done)
  const done = items.filter((i) => i.done)
  const focus = live.find((i) => i.lane === 'focus')
  const parked = live.filter((i) => i.lane !== 'focus')

  if (items.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="font-display text-xl">{EMPTY_PARKING.title}</p>
        <p className="text-ink-soft mx-auto mt-2 max-w-sm text-sm leading-relaxed">{EMPTY_PARKING.body}</p>
        <Button tone="peach" className="mt-5" onClick={() => open({ kind: 'dump' })}>
          🧠 Unload
        </Button>
      </div>
    )
  }

  return (
    <div>
      {summary && !compact && <p className="text-ink-soft mb-5 leading-relaxed text-balance">{summary}</p>}

      <SectionLabel>Focus now</SectionLabel>
      <ul className="mt-2 mb-1">
        <AnimatePresence initial={false}>
          {focus ? (
            <Row key={focus.id} item={focus} focus />
          ) : (
            <motion.li key="none" className="text-ink-faint px-3.5 py-3 text-sm">
              Nothing in the focus lane — pick something from below.
            </motion.li>
          )}
        </AnimatePresence>
      </ul>

      <div className="bg-cream-deep my-4 h-px" />

      <div className="flex items-baseline justify-between gap-3">
        <SectionLabel>Parked for later</SectionLabel>
        <span className="tabular text-ink-faint text-xs">{parked.length}</span>
      </div>

      <ul className="mt-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {parked.length > 0 ? (
            parked.map((item) => <Row key={item.id} item={item} />)
          ) : (
            <motion.li key="clear" className="text-ink-faint px-3.5 py-3 text-sm">
              Nothing waiting. That's allowed.
            </motion.li>
          )}
        </AnimatePresence>
      </ul>

      {done.length > 0 && (
        <>
          <div className="bg-cream-deep my-4 h-px" />
          <div className="flex items-baseline justify-between gap-3">
            <SectionLabel>Done today</SectionLabel>
            <span className="tabular text-ink-faint text-xs">{done.length}</span>
          </div>
          <ul className="mt-2 space-y-0.5 opacity-60">
            <AnimatePresence initial={false}>
              {done.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}

      {!compact && (
        <>
          <p className="text-ink-soft mt-6 text-center text-sm italic">
            You don't have to solve everything right now.
          </p>

          <form
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addItem(adding)
              setAdding('')
            }}
          >
            <label htmlFor="add-thought" className="sr-only-focusable">
              Add another thought
            </label>
            <input
              id="add-thought"
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              placeholder="Add another thought…"
              maxLength={120}
              className="bg-cream/70 border-cream-deep focus:border-lilac min-w-0 flex-1 rounded-2xl border-2 px-4 py-2.5 text-sm outline-none transition-colors"
            />
            <Button type="submit" variant="soft" size="sm" disabled={!adding.trim()}>
              Add
            </Button>
          </form>

          <div className="mt-4 flex justify-center">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-ink-soft text-xs">Clear everything?</span>
                <Button
                  size="sm"
                  tone="peach"
                  onClick={() => {
                    clearParking()
                    setConfirmClear(false)
                  }}
                >
                  Yes, clear
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)}>
                Clear the lot
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
