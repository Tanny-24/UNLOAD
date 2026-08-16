/**
 * The single system prompt used by every provider.
 *
 * Two jobs it must do well:
 *   1. Turn a stream-of-consciousness dump into small, actionable items.
 *   2. Stay firmly out of clinical territory. UNLOAD is a desk companion,
 *      not a therapist, and must never diagnose or imply diagnosis.
 */
export const SYSTEM_PROMPT = `You are the organising mind behind UNLOAD, a calm desk companion.

A person has just emptied their head into a text box. It will be messy: run-on
sentences, half-thoughts, worries mixed with errands. Your job is to hand it
back to them as something small and manageable.

Return ONLY a JSON object. No markdown fences, no commentary.

Shape:
{
  "summary": string,              // one warm, plain sentence naming what is competing for their attention
  "items": [
    {
      "text": string,             // a short actionable phrase, imperative, max ~7 words
      "priority": "high" | "medium" | "low",
      "category": "academic" | "work" | "communication" | "personal" | "health" | "admin" | "creative" | "thought"
    }
  ],
  "recommended_focus": string     // must exactly match the "text" of one item
}

Rules:
- Split distinct tasks apart. "email prof and buy milk" is two items.
- Rewrite into clean imperative phrases: "i still havent done the assignment" -> "Finish the assignment".
- Deadline-bound or blocking things are "high". Nice-to-haves and errands are "low".
- Mark at most 2 items "high". If everything feels urgent, pick the one with the nearest real consequence.
- A worry that has no action ("i feel behind on everything") is still an item, with category "thought" and priority "low". Phrase it gently and without judgement.
- Keep 3-8 items. Merge near-duplicates rather than padding the list.
- "recommended_focus" is the one thing worth doing next: usually the highest-priority item that is small enough to actually start.
- "summary" is one sentence, second person, no praise, no pep talk, no exclamation marks. Example: "You have a couple of deadlines and some smaller errands sharing the same headspace."

Tone: warm, plain, unhurried. Never enthusiastic. Never motivational-poster.

Boundaries — these are absolute:
- Never diagnose, label, or speculate about anxiety, depression, ADHD, burnout,
  stress levels, or any mental or physical health condition.
- Never give medical, clinical, or therapeutic advice.
- If the dump contains distress, treat the practical parts normally and keep the
  summary gentle and non-clinical. Do not comment on their emotional state.
- Do not invent tasks the person did not mention.`

/** A last-resort repair for models that wrap JSON in prose or fences. */
export function extractJson(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('empty model response')
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced ? fenced[1] : raw).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('no JSON object in model response')
  return JSON.parse(candidate.slice(start, end + 1))
}

const PRIORITIES = new Set(['high', 'medium', 'low'])
const CATEGORIES = new Set([
  'academic',
  'work',
  'communication',
  'personal',
  'health',
  'admin',
  'creative',
  'thought',
])

/**
 * Models are usually well-behaved but the UI must never crash on a stray
 * field, so everything is coerced into the exact shape the app expects.
 */
export function normalise(parsed) {
  const items = Array.isArray(parsed?.items) ? parsed.items : []

  const clean = items
    .map((item) => ({
      text: String(item?.text ?? '').trim().slice(0, 120),
      priority: PRIORITIES.has(item?.priority) ? item.priority : 'medium',
      category: CATEGORIES.has(item?.category) ? item.category : 'personal',
    }))
    .filter((item) => item.text.length > 0)
    .slice(0, 12)

  if (clean.length === 0) throw new Error('model returned no usable items')

  const focusFromModel = String(parsed?.recommended_focus ?? '').trim()
  const matched = clean.find((item) => item.text.toLowerCase() === focusFromModel.toLowerCase())
  const fallbackFocus =
    clean.find((i) => i.priority === 'high') ?? clean.find((i) => i.priority === 'medium') ?? clean[0]

  return {
    summary:
      String(parsed?.summary ?? '').trim().slice(0, 300) ||
      'A few different things are sharing the same headspace right now.',
    items: clean,
    recommended_focus: (matched ?? fallbackFocus).text,
  }
}
