/**
 * Micro-breaks: 30–60 seconds, no equipment, no camera, nothing to install.
 * Each one is a small guided sequence of steps with its own timing.
 */

export type BreakId = 'breathing' | 'shoulders' | 'eyes' | 'movement' | 'quote'

export interface BreakStep {
  /** Big line in the middle of the screen. */
  label: string
  /** Optional supporting line underneath. */
  detail?: string
  seconds: number
  /** Drives the circle animation: grow, hold, shrink, or stay still. */
  motion: 'in' | 'hold' | 'out' | 'still'
}

export interface MicroBreak {
  id: BreakId
  title: string
  emoji: string
  blurb: string
  /** Rough total, shown before starting so nobody feels ambushed. */
  seconds: number
  accent: 'sky' | 'mint' | 'lilac' | 'butter' | 'peach'
  steps: BreakStep[]
}

/** 4-7-8-ish, softened. Four rounds lands at about 52 seconds. */
const breathRound = (round: number): BreakStep[] => [
  { label: 'Breathe in', detail: `Round ${round} of 4`, seconds: 4, motion: 'in' },
  { label: 'Hold', seconds: 3, motion: 'hold' },
  { label: 'Breathe out', detail: 'Slowly', seconds: 6, motion: 'out' },
]

export const MICRO_BREAKS: MicroBreak[] = [
  {
    id: 'breathing',
    title: 'Four breaths',
    emoji: '🫁',
    blurb: 'Follow the circle. In, hold, out, four times.',
    seconds: 55,
    accent: 'sky',
    steps: [
      { label: 'Settle', detail: 'Put your hands somewhere comfortable', seconds: 3, motion: 'still' },
      ...breathRound(1),
      ...breathRound(2),
      ...breathRound(3),
      ...breathRound(4),
    ],
  },
  {
    id: 'shoulders',
    title: 'Shoulder reset',
    emoji: '🙆',
    blurb: 'Undo the desk hunch in under a minute.',
    seconds: 45,
    accent: 'mint',
    steps: [
      { label: 'Sit back', detail: 'Let your arms hang', seconds: 5, motion: 'still' },
      { label: 'Roll shoulders backward', detail: 'Five slow circles', seconds: 15, motion: 'hold' },
      { label: 'Roll them forward', detail: 'Five more, the other way', seconds: 15, motion: 'hold' },
      { label: 'Drop them', detail: 'Notice how much higher they were', seconds: 10, motion: 'out' },
    ],
  },
  {
    id: 'eyes',
    title: 'Eye reset',
    emoji: '👀',
    blurb: 'Look at something further away than your screen.',
    seconds: 40,
    accent: 'lilac',
    steps: [
      { label: 'Look away from the screen', detail: 'Find the furthest thing you can see', seconds: 5, motion: 'still' },
      { label: 'Stay there', detail: 'Let your eyes go soft', seconds: 20, motion: 'hold' },
      { label: 'Blink slowly', detail: 'Ten times, no rush', seconds: 10, motion: 'out' },
      { label: 'Come back', seconds: 5, motion: 'still' },
    ],
  },
  {
    id: 'movement',
    title: 'Stand and move',
    emoji: '🚶',
    blurb: 'Up, stretch, twenty steps. That is the whole thing.',
    seconds: 60,
    accent: 'butter',
    steps: [
      { label: 'Stand up', detail: 'All the way up', seconds: 5, motion: 'in' },
      { label: 'Reach for the ceiling', detail: 'Both arms, hold it', seconds: 12, motion: 'hold' },
      { label: 'Walk twenty steps', detail: 'Anywhere. The kitchen counts', seconds: 30, motion: 'still' },
      { label: 'Come back when you are ready', seconds: 13, motion: 'out' },
    ],
  },
  {
    id: 'quote',
    title: 'One quiet line',
    emoji: '🕯️',
    blurb: 'No exercise. Just something to read and sit with.',
    seconds: 30,
    accent: 'peach',
    steps: [
      { label: '__QUOTE__', seconds: 22, motion: 'still' },
      { label: 'Okay. Back to it.', seconds: 8, motion: 'out' },
    ],
  },
]

export const getBreak = (id: BreakId) => MICRO_BREAKS.find((b) => b.id === id) ?? MICRO_BREAKS[0]
