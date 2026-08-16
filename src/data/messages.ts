import type { Personality, StuckLevel } from '../types'

/**
 * Everything the companion says.
 *
 * House style: warm, short, a little dry. Never a cheerleader, never
 * clinical. It notices a work rhythm — it does not tell anyone how they
 * feel, and it never uses the words stressed, anxious, burnt out or
 * overwhelmed about the person.
 */

export interface PersonalityProfile {
  id: Personality
  name: string
  blurb: string
  emoji: string
}

export const PERSONALITIES: PersonalityProfile[] = [
  { id: 'calm', name: 'Calm', blurb: 'Quiet, warm, gets out of the way.', emoji: '🫧' },
  { id: 'cozy', name: 'Cozy', blurb: 'Soft blanket energy. Fond of you.', emoji: '🧶' },
  { id: 'chaotic', name: 'Chaotic', blurb: 'Loud, fond of you, slightly unhinged.', emoji: '✨' },
  { id: 'nerd', name: 'Nerd', blurb: 'Speaks fluent stack trace.', emoji: '🤓' },
  { id: 'zen', name: 'Zen', blurb: 'Small words. Long pauses.', emoji: '🍃' },
]

/** The line in the speech bubble when the companion turns up unprompted. */
const NUDGE: Record<Personality, Record<StuckLevel, string[]>> = {
  calm: {
    clear: ['Just saying hello.', 'All quiet here.'],
    loaded: ['Still going strong?', 'You have been at this a little while.'],
    stuck: ['Hey… brain buffering?', 'Your rhythm went a bit start-stop.', 'Same paragraph for a while now?'],
    overloaded: ['That is a long stretch.', 'You have been here a while. A tiny reset?'],
  },
  cozy: {
    clear: ['Just pottering about.', 'Nice and quiet in here.'],
    loaded: ['You have been working hard.', 'Still with me?'],
    stuck: [
      'You have been working hard. Want a little breather?',
      'That one is being stubborn, isn’t it.',
      'Hey. Kettle moment?',
    ],
    overloaded: ['Long old stretch, that. Come away for a minute?', 'That is enough for now, I reckon.'],
  },
  chaotic: {
    clear: ['Hi. No reason.', 'Vibes check: fine.'],
    loaded: ['Still upright? Impressive.', 'BESTIE. Just checking.'],
    stuck: [
      'BESTIE. Your brain has 17 tabs open.',
      'Okay you have read that line four times.',
      'Brain buffering. Loading… loading…',
    ],
    overloaded: ['BESTIE. It has been HOURS.', 'Your brain is at 4% battery and refusing to charge.'],
  },
  nerd: {
    clear: ['Heartbeat OK. Carry on.', 'No anomalies detected.'],
    loaded: ['Uptime is getting respectable.', 'Memory usage climbing steadily.'],
    stuck: [
      'Runtime warning: human needs a break.',
      '404: focus not found.',
      'Detected: high churn, low output. Classic.',
      'You appear to be in a retry loop.',
    ],
    overloaded: ['Uptime exceeded. Recommend restart.', 'Thermal throttling detected. Metaphorically.'],
  },
  zen: {
    clear: ['Here, you are.', 'Steady, the water is.'],
    loaded: ['Long, this sitting has been.', 'Notice your shoulders, you might.'],
    stuck: ['Stuck, you are. Move, you must.', 'Forward, the thought will not go.', 'Push harder, the door does not open.'],
    overloaded: ['Enough, this stretch has been.', 'Rest is not the opposite of work.'],
  },
}

/** The smaller line underneath — always factual, never interpretive. */
export function subLine(minutes: number, level: StuckLevel): string {
  const m = Math.max(1, Math.round(minutes))
  const mins = `${m} ${m === 1 ? 'minute' : 'minutes'}`
  if (level === 'overloaded') return `${mins} without a proper pause.`
  if (level === 'stuck') return `You have been working for ${mins}.`
  if (level === 'loaded') return `${mins} in.`
  return `${mins} in, and everything looks fine.`
}

export function nudgeLine(personality: Personality, level: StuckLevel, seed = Date.now()): string {
  const pool = NUDGE[personality][level]
  return pool[Math.abs(seed) % pool.length]
}

/** Shown when the person taps "I'm stuck" themselves. */
export const MANUAL_LINE: Record<Personality, string> = {
  calm: 'Alright. What do you need?',
  cozy: 'Oh good, you shouted. What is it?',
  chaotic: 'SAY LESS. What are we doing.',
  nerd: 'Manual interrupt received.',
  zen: 'Called me, you did.',
}

/** After "I'm good" — the companion has to leave gracefully. */
export const DISMISS_LINE: Record<Personality, string> = {
  calm: 'Fair enough. I will be quiet.',
  cozy: 'Right you are. I’ll potter off.',
  chaotic: 'SAY NO MORE. Vanishing.',
  nerd: 'Acknowledged. Snoozing.',
  zen: 'Go, then.',
}

/** Idle chatter on the dashboard card. */
export const DASHBOARD_LINES: Record<Personality, string[]> = {
  calm: ['One thing at a time.', 'Nothing is on fire.', 'Start with the small one.'],
  cozy: ['One thing at a time.', 'No rush from me.', 'Start with the easy one.'],
  chaotic: ['One thing. ONE. Choose.', 'You are doing better than you think.', 'The list can wait.'],
  nerd: ['Single-threaded works better.', 'Ship the small one first.', 'Scope creep is a choice.'],
  zen: ['One thing at a time.', 'Begin where you are.', 'Small steps still move.'],
}

/* ------------------------------------------------------------------ */
/* Lines for the moments inside a flow                                 */
/*                                                                     */
/* Short on purpose. Mochi is commenting alongside the interface, not  */
/* narrating it, and a companion that talks over every screen stops    */
/* being charming after about four minutes.                            */
/* ------------------------------------------------------------------ */

/** Above the empty dump box. */
export const DUMP_INTRO: Record<Personality, string> = {
  calm: 'Give me everything that’s bouncing around up there.',
  cozy: 'Go on then. Everything that’s rattling about.',
  chaotic: 'OKAY. Every single tab. GO.',
  nerd: 'Dump the stack. I’ll parse it.',
  zen: 'Empty it. Sort it, we will.',
}

/** On the reward screen, right after a dump has been organised. */
export const DUMP_DONE: Record<Personality, string> = {
  calm: 'Much better. One thing at a time.',
  cozy: 'There. That’s a much smaller pile.',
  chaotic: 'WHOA. That was a lot of tabs.',
  nerd: 'Parsed. Sorted. One thread at a time.',
  zen: 'Lighter, your head is.',
}

/** When a break begins. */
export const BREAK_INTRO: Record<Personality, string> = {
  calm: 'Copy me.',
  cozy: 'Come on, do it with me.',
  chaotic: 'COPY ME. I look ridiculous alone.',
  nerd: 'Follow along. I’ll keep time.',
  zen: 'With me, move.',
}

/** When a quest is offered. */
export const QUEST_INTRO: Record<Personality, string> = {
  calm: 'Challenge time.',
  cozy: 'Fancy a little challenge?',
  chaotic: 'CHALLENGE. ACCEPTED? (say yes)',
  nerd: 'New task on the queue.',
  zen: 'A small trial, this is.',
}

/** After a break or quest completes. */
export const RESET_DONE: Record<Personality, string[]> = {
  calm: ['There. Tiny reset.', 'Nice. That counts.'],
  cozy: ['Lovely. That counts, that does.', 'There we go. Better?'],
  chaotic: ['LOOK AT YOU GO.', 'Tiny reset COMPLETE.'],
  nerd: ['Cache cleared.', 'Reset committed.'],
  zen: ['Strong with the Force, you are.', 'Moved, you have. Good.'],
}

/**
 * Calm messages for the "quote" break. No toxic positivity, nothing that
 * demands anything of the reader.
 */
export const CALM_QUOTES = [
  'You do not have to finish everything today.',
  'A tiny reset is still a reset.',
  'You are allowed to pause.',
  'The list will still be there. It is patient.',
  'Half-done is a normal state for a thing to be in.',
  'Nobody is keeping score of your afternoon.',
  'Slow is a pace, not a failure.',
  'You can put a thought down and pick it up later.',
  'One thing at a time is not a compromise.',
  'Being stuck is information, not a verdict.',
  'Rest is part of the work, not a break from it.',
  'You can start again at any point in the day.',
]

export function greeting(name: string, at = new Date()): string {
  const hour = at.getHours()
  const part = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return name.trim() ? `${part}, ${name.trim()}` : part
}

/** Empty-state copy, so the app never shows a blank rectangle. */
export const EMPTY_PARKING = {
  title: 'Nothing parked yet',
  body: 'When your head gets loud, unload it here. UNLOAD will sort it into one thing to do now and a pile that can wait.',
}
