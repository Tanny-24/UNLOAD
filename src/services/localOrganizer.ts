import type { Category, OrganizeResult, Priority } from '../types'

/**
 * The offline organiser.
 *
 * UNLOAD must be completely usable with no API key and no network, so this
 * is not a stub — it is the default experience for anyone who just clones
 * the repo and runs it. Plain deterministic text processing: split the dump
 * into clauses, tidy each into an imperative phrase, then score priority and
 * category from keyword evidence.
 */

/* ---------------------------------------------------------------- */
/* Splitting                                                         */
/* ---------------------------------------------------------------- */

/** Conjunctions and punctuation that usually separate two real tasks. */
const SPLIT_PATTERN =
  /\n+|[;•·]|(?:^|\s)[-–—]\s|(?<=[a-z0-9)"'])\s*[.!?]+\s+|,\s+(?=\w)|\s+(?:and then|and also|but also|and|then|also|plus)\s+/gi

/** Openers that carry no information once the item stands on its own. */
const FILLERS = [
  "i've got to",
  'ive got to',
  'i have got to',
  'i still need to',
  'i still have to',
  'i really need to',
  'i need to',
  'i have to',
  'i should probably',
  'i should',
  'i must',
  'i want to',
  'i ought to',
  "i'm supposed to",
  'im supposed to',
  'i gotta',
  'gotta',
  'need to',
  'have to',
  'got to',
  'remember to',
  "don't forget to",
  'dont forget to',
  'make sure to',
  'i keep meaning to',
  'i keep forgetting to',
  'i am',
  "i'm",
  'im',
  'i',
  'there is',
  "there's",
  'also',
  'and',
  'then',
  'plus',
  'maybe',
  'probably',
  'like',
  'um',
  'uh',
  'so',
  'basically',
  'honestly',
]

/* ---------------------------------------------------------------- */
/* Keyword evidence                                                  */
/* ---------------------------------------------------------------- */

const HIGH_SIGNALS = [
  'today',
  'tonight',
  'tomorrow',
  'due',
  'deadline',
  'overdue',
  'asap',
  'urgent',
  'exam',
  'test',
  'interview',
  'submit',
  'submission',
  'presentation',
  'defend',
  'viva',
  'final',
  'this morning',
  'this afternoon',
  'by friday',
  'by monday',
  'last day',
  'late',
]

const LOW_SIGNALS = [
  'someday',
  'sometime',
  'eventually',
  'at some point',
  'whenever',
  'if i have time',
  'would be nice',
  'groceries',
  'grocery',
  'laundry',
  'dishes',
  'tidy',
  'clean',
  'water the',
  'haircut',
  'unsubscribe',
]

const CATEGORY_SIGNALS: Record<Category, string[]> = {
  academic: [
    'assignment',
    'homework',
    'essay',
    'thesis',
    'dissertation',
    'exam',
    'test',
    'study',
    'revise',
    'revision',
    'lecture',
    'seminar',
    'coursework',
    'paper',
    'reading',
    'lab report',
    'semester',
    'class',
  ],
  work: [
    'deploy',
    'bug',
    'ticket',
    'pr ',
    'pull request',
    'merge',
    'refactor',
    'standup',
    'sprint',
    'client',
    'deck',
    'slides',
    'report',
    'demo',
    'code',
    'build',
    'test suite',
    'meeting',
    'review',
    'hackathon',
    'project',
  ],
  communication: [
    'email',
    'reply',
    'respond',
    'message',
    'text',
    'call',
    'ring',
    'dm',
    'slack',
    'follow up',
    'chase',
    'ask',
    'tell',
    'write back',
    'professor',
    'supervisor',
    'landlord',
    'thank',
  ],
  health: [
    'doctor',
    'dentist',
    'gp',
    'appointment',
    'prescription',
    'pharmacy',
    'gym',
    'run',
    'walk',
    'sleep',
    'eat',
    'lunch',
    'dinner',
    'breakfast',
    'water',
    'physio',
    'therapy',
  ],
  admin: [
    'form',
    'visa',
    'passport',
    'tax',
    'invoice',
    'insurance',
    'bank',
    'renew',
    'register',
    'sign up',
    'pay',
    'bill',
    'rent',
    'book',
    'ticket',
    'flight',
    'train',
    'appointment',
    'deadline form',
  ],
  creative: ['design', 'draw', 'sketch', 'write', 'draft', 'edit', 'record', 'film', 'photo', 'logo', 'blog'],
  personal: [
    'buy',
    'groceries',
    'shop',
    'laundry',
    'clean',
    'tidy',
    'cook',
    'mum',
    'mom',
    'dad',
    'friend',
    'birthday',
    'gift',
    'flat',
    'room',
    'plants',
  ],
  thought: [
    'feel',
    'feeling',
    'worried',
    'worry',
    'anxious about',
    'behind',
    'overwhelmed',
    'scared',
    'nervous',
    'wondering',
    'thinking about',
    'stuck on',
    "can't stop",
    'cant stop',
    'keeps bugging',
    'no idea',
    'lost',
  ],
}

/** Order matters: earlier categories win ties, so specifics beat generics. */
const CATEGORY_ORDER: Category[] = [
  'thought',
  'academic',
  'communication',
  'health',
  'admin',
  'work',
  'creative',
  'personal',
]

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */

const has = (haystack: string, needles: string[]) => needles.some((n) => haystack.includes(n))

function tidy(raw: string, keepSubject = false): string {
  let s = raw.trim().replace(/\s+/g, ' ')

  // Peel filler openers repeatedly: "and i still need to finish" -> "finish".
  // A worry keeps its "I", because "Feel behind on everything" reads like an
  // instruction and "I feel behind on everything" reads like the truth.
  const openers = keepSubject ? FILLERS.filter((f) => !/^i\b|^im$|^i'm$/.test(f)) : FILLERS

  let peeled = true
  let guard = 0
  while (peeled && guard++ < 8) {
    peeled = false
    const lower = s.toLowerCase()
    for (const filler of openers) {
      if (lower.startsWith(filler + ' ')) {
        s = s.slice(filler.length + 1).trim()
        peeled = true
        break
      }
    }
  }

  // "finish my assignment" reads better in a list as "finish assignment".
  s = s.replace(/\s+my\s+/gi, ' ')
  s = s.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[\s,.;:!?]+$/u, '')

  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function priorityFor(lower: string, category: Category): Priority {
  if (has(lower, HIGH_SIGNALS)) return 'high'
  if (has(lower, LOW_SIGNALS)) return 'low'
  // A circling worry is worth writing down, but it is not a task competing
  // for the next hour, so it never outranks something you can actually do.
  if (category === 'thought') return 'low'
  return 'medium'
}

function categoryFor(lower: string): Category {
  for (const category of CATEGORY_ORDER) {
    if (has(lower, CATEGORY_SIGNALS[category])) return category
  }
  return 'personal'
}

/** Rough de-duplication so "email prof" and "email professor" don't both land. */
function fingerprint(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter((w) => w.length > 3)
    .sort()
    .join(' ')
}

const CATEGORY_NOUN: Record<Category, string> = {
  academic: 'coursework',
  work: 'work',
  communication: 'messages to send',
  personal: 'personal errands',
  health: 'looking after yourself',
  admin: 'admin',
  creative: 'creative work',
  thought: 'a thought that keeps circling',
}

function buildSummary(items: { priority: Priority; category: Category }[]): string {
  const kinds = [...new Set(items.map((i) => i.category))].map((c) => CATEGORY_NOUN[c])
  const highs = items.filter((i) => i.priority === 'high').length

  const list =
    kinds.length === 1
      ? kinds[0]
      : kinds.length === 2
        ? `${kinds[0]} and ${kinds[1]}`
        : `${kinds.slice(0, -1).join(', ')} and ${kinds[kinds.length - 1]}`

  if (highs >= 2) return `Two things are genuinely time-sensitive, sitting alongside ${list}.`
  if (highs === 1) return `One thing is time-sensitive; the rest is ${list} that can wait its turn.`
  return `${items.length} things are sharing the same headspace — mostly ${list}.`
}

/* ---------------------------------------------------------------- */
/* Main                                                              */
/* ---------------------------------------------------------------- */

export function organizeLocally(input: string): OrganizeResult {
  const clauses = input
    .split(SPLIT_PATTERN)
    .map((c) => (c ?? '').trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const items: OrganizeResult['items'] = []

  for (const clause of clauses) {
    const lower = ` ${clause.toLowerCase()} `
    const category = categoryFor(lower)

    const text = tidy(clause, category === 'thought')
    // Two characters is noise, not a task.
    if (text.length < 3) continue

    const key = fingerprint(text)
    if (key && seen.has(key)) continue
    if (key) seen.add(key)

    items.push({
      text: text.length > 90 ? `${text.slice(0, 87).trimEnd()}…` : text,
      priority: priorityFor(lower, category),
      category,
    })

    if (items.length >= 10) break
  }

  // Nothing parseable — still return something honest and usable.
  if (items.length === 0) {
    const text = tidy(input).slice(0, 90) || 'Whatever is on your mind'
    return {
      summary: 'One thing on your mind. That is a short enough list to just start.',
      items: [{ text, priority: 'medium', category: 'thought' }],
      recommended_focus: text,
      source: 'local',
    }
  }

  // If everything scored high, only the first two keep it — a list where
  // every line is urgent is the same as a list where nothing is.
  let highsKept = 0
  for (const item of items) {
    if (item.priority !== 'high') continue
    highsKept += 1
    if (highsKept > 2) item.priority = 'medium'
  }

  // Focus on the most urgent *actionable* thing; a circling worry is real,
  // but it isn't something you can sit down and finish.
  const actionable = items.filter((i) => i.category !== 'thought')
  const pool = actionable.length > 0 ? actionable : items
  const focus =
    pool.find((i) => i.priority === 'high') ?? pool.find((i) => i.priority === 'medium') ?? pool[0]

  return {
    summary: buildSummary(items),
    items,
    recommended_focus: focus.text,
    source: 'local',
  }
}
