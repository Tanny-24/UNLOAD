/**
 * Micro-quests: the same idea as a break, wearing a slightly sillier hat.
 *
 * A break is something you follow. A quest is something you complete — it
 * has a name, a reward, and a button that says you did it. None of them
 * need a camera, a phone, or anyone else in the room.
 */

export type QuestId = 'yoda' | 'distance' | 'walk' | 'breaths' | 'clear' | 'water'

export interface Quest {
  id: QuestId
  title: string
  emoji: string
  /** The flavour line, in the companion's voice. */
  callout: string
  /** What to actually do. */
  instruction: string
  seconds: number
  accent: 'sky' | 'mint' | 'lilac' | 'butter' | 'peach'
  reward: { mind: number; body: number; xp: number }
  /** Quests where the person types something instead of running a timer. */
  input?: { prompt: string; placeholder: string }
}

export const QUESTS: Quest[] = [
  {
    id: 'yoda',
    title: 'Yoda Reset',
    emoji: '🧘',
    callout: 'Stuck, you are. Stretch, you must.',
    instruction: 'Raise both arms straight above your head and hold until the timer runs out.',
    seconds: 15,
    accent: 'mint',
    reward: { mind: 0, body: 1, xp: 5 },
  },
  {
    id: 'distance',
    title: '20-Second Distance',
    emoji: '👀',
    callout: 'Your eyes have been 50cm from a rectangle for a while.',
    instruction: 'Look at the furthest thing you can see and stay there. No screens in the way.',
    seconds: 20,
    accent: 'lilac',
    reward: { mind: 1, body: 1, xp: 5 },
  },
  {
    id: 'walk',
    title: 'Mini Walk',
    emoji: '🚶',
    callout: 'Thirty steps. The kitchen counts. The hallway counts.',
    instruction: 'Stand up and walk about thirty steps, then come back.',
    seconds: 35,
    accent: 'butter',
    reward: { mind: 0, body: 2, xp: 8 },
  },
  {
    id: 'breaths',
    title: 'Four Breaths',
    emoji: '🫁',
    callout: 'Four slow breaths. That is the entire ask.',
    instruction: 'In for four, out for six. Four times through. Follow the ring.',
    seconds: 40,
    accent: 'sky',
    reward: { mind: 2, body: 0, xp: 8 },
  },
  {
    id: 'clear',
    title: 'Mental Clear',
    emoji: '🧠',
    callout: 'Name the thought that keeps interrupting you.',
    instruction: 'Write down the one thing pulling at your attention. It goes straight to your parking lot.',
    seconds: 0,
    accent: 'peach',
    reward: { mind: 2, body: 0, xp: 6 },
    input: {
      prompt: 'What keeps pulling your attention away?',
      placeholder: 'e.g. I still have not replied to that email',
    },
  },
  {
    id: 'water',
    title: 'Glass of Water',
    emoji: '💧',
    callout: 'When did you last drink something that was not coffee?',
    instruction: 'Go and fill a glass of water. Drink some of it before you sit back down.',
    seconds: 30,
    accent: 'sky',
    reward: { mind: 0, body: 1, xp: 5 },
  },
]

export const getQuest = (id: QuestId) => QUESTS.find((q) => q.id === id) ?? QUESTS[0]

/** Deterministic-ish pick so the same quest doesn't come up twice running. */
export function suggestQuest(exclude?: QuestId): Quest {
  const pool = QUESTS.filter((q) => q.id !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}
