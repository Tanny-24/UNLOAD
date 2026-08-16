import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { Button, SectionLabel, Sheet } from './ui'
import { Companion } from './Companion'
import { QUEST_INTRO, RESET_DONE } from '../data/messages'
import { QUESTS, suggestQuest, type Quest } from '../data/quests'
import { useStore } from '../state/store'

const ACCENT_FILL: Record<string, string> = {
  sky: 'stroke-[color:var(--color-sky)]',
  mint: 'stroke-[color:var(--color-mint)]',
  lilac: 'stroke-[color:var(--color-lilac)]',
  butter: 'stroke-[color:var(--color-butter)]',
  peach: 'stroke-[color:var(--color-peach)]',
}

/**
 * Micro quests — a break with a name and a reward.
 *
 * Same 30 seconds as a break, but framed as something you complete, which
 * for a lot of people is the difference between doing it and closing the tab.
 * None of them need a camera or leave the room.
 */
export function MicroQuest() {
  const { interruption, close, open, reward, markReset, addItem, settings } = useStore()
  const visible = interruption.kind === 'quest'

  const [active, setActive] = useState<Quest | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [suggestion, setSuggestion] = useState<Quest>(() => suggestQuest())

  useEffect(() => {
    if (visible) {
      setActive(null)
      setShowAll(false)
      setSuggestion(suggestQuest())
    }
  }, [visible])

  function completeQuest(quest: Quest, note?: string) {
    markReset()
    reward(quest.reward, 'quest')
    if (note?.trim()) addItem(note.trim())

    const cheer = RESET_DONE[settings.personality]
    open({
      kind: 'reward',
      title: 'Quest complete',
      mochiLine: cheer[Math.floor(Math.random() * cheer.length)],
      lines: [
        quest.title,
        ...(note?.trim() ? [`Parked: "${note.trim()}"`] : []),
        'Back whenever you are ready.',
      ],
    })
  }

  return (
    // The picker/runner swap is a plain conditional, not an AnimatePresence
    // exit-then-enter: waiting on an exit animation to hand over is one more
    // thing that can wedge, and a modal that ignores "Accept" is unforgivable.
    <Sheet open={visible} onClose={close} labelledBy="quest-title" dismissible={!active}>
      {active ? (
        <QuestRunner key={active.id} quest={active} onQuit={() => setActive(null)} onDone={completeQuest} />
      ) : (
        <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Mochi hands you the quest rather than a panel announcing one. */}
          <div className="mb-4 flex items-center gap-3">
            <Companion expression="curious" size={54} float={false} />
            <p className="bg-cream-deep/70 text-ink-soft rounded-2xl px-3.5 py-2 text-sm leading-snug">
              {QUEST_INTRO[settings.personality]}
            </p>
          </div>

          <h2 id="quest-title" className="font-display text-3xl leading-tight">
            Micro quest
          </h2>
          <p className="text-ink-soft mt-2">A tiny challenge instead of a lecture about taking breaks.</p>

            {!showAll ? (
              <>
                <div className="border-butter/30 bg-butter-soft/25 mt-6 rounded-3xl border-2 p-6 text-center">
                  <span className="text-4xl" aria-hidden="true">
                    {suggestion.emoji}
                  </span>
                  <h3 className="font-display mt-2 text-2xl">{suggestion.title}</h3>
                  <p className="text-ink-soft mt-2 text-sm italic">"{suggestion.callout}"</p>
                  <p className="mt-3 text-sm leading-relaxed">{suggestion.instruction}</p>
                  <p className="text-ink-faint mt-3 text-xs">
                    {suggestion.seconds > 0 ? `${suggestion.seconds} seconds` : 'No timer'} · +{suggestion.reward.xp} XP
                  </p>
                </div>

                <Button tone="butter" size="lg" block className="mt-5" onClick={() => setActive(suggestion)}>
                  Accept quest
                </Button>
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" block onClick={() => setSuggestion(suggestQuest(suggestion.id))}>
                    Give me another
                  </Button>
                  <Button variant="ghost" block onClick={() => setShowAll(true)}>
                    See all {QUESTS.length}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <ul className="mt-6 space-y-2.5">
                  {QUESTS.map((quest) => (
                    <li key={quest.id}>
                      <button
                        onClick={() => setActive(quest)}
                        aria-label={`Start quest: ${quest.title}. ${quest.instruction}`}
                        className="hover:bg-cream-deep/50 flex w-full items-center gap-4 rounded-3xl border-2 border-transparent px-4 py-3.5 text-left transition-all hover:border-[color:var(--color-cream-deep)]"
                      >
                        <span className="text-2xl" aria-hidden="true">
                          {quest.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{quest.title}</span>
                          <span className="text-ink-soft block text-sm italic">"{quest.callout}"</span>
                        </span>
                        <span className="tabular text-ink-faint shrink-0 text-xs">+{quest.reward.xp}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" block className="mt-4" onClick={() => setShowAll(false)}>
                  Back
                </Button>
              </>
            )}
        </motion.div>
      )}
    </Sheet>
  )
}

function QuestRunner({
  quest,
  onDone,
  onQuit,
}: {
  quest: Quest
  onDone: (quest: Quest, note?: string) => void
  onQuit: () => void
}) {
  const [remaining, setRemaining] = useState(quest.seconds)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const timed = quest.seconds > 0
  const finished = !timed || remaining <= 0

  useEffect(() => {
    if (!timed) {
      inputRef.current?.focus()
      return
    }
    const id = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => window.clearInterval(id)
  }, [timed])

  const progress = timed ? 1 - remaining / quest.seconds : 1
  const circumference = 2 * Math.PI * 52

  return (
    <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <SectionLabel>Quest in progress</SectionLabel>
      <h3 className="font-display mt-1.5 text-2xl">
        {quest.emoji} {quest.title}
      </h3>
      <p className="text-ink-soft mx-auto mt-2 max-w-xs text-sm leading-relaxed">{quest.instruction}</p>

      {timed ? (
        <div className="relative mx-auto mt-6 h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" className="stroke-[color:var(--color-cream-deep)]" strokeWidth="9" fill="none" />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              className={ACCENT_FILL[quest.accent]}
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-display tabular text-4xl" aria-live="polite">
              {remaining}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <label htmlFor="quest-note" className="text-ink-soft block text-sm">
            {quest.input?.prompt}
          </label>
          <textarea
            id="quest-note"
            ref={inputRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={120}
            placeholder={quest.input?.placeholder}
            className="bg-cream/70 border-cream-deep focus:border-lilac mt-2 w-full resize-none rounded-2xl border-2 px-4 py-3 text-sm outline-none transition-colors"
          />
        </div>
      )}

      <Button
        tone="mint"
        size="lg"
        block
        className="mt-6"
        disabled={!finished || (!timed && !note.trim())}
        onClick={() => onDone(quest, note)}
      >
        {finished ? 'Mark complete' : `Hold on… ${remaining}s`}
      </Button>

      <Button variant="ghost" size="sm" className="mt-2" onClick={onQuit}>
        Choose a different quest
      </Button>
    </motion.div>
  )
}
