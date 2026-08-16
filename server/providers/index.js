/**
 * Provider abstraction.
 *
 * Every provider is just: (text) -> raw string. Parsing, validation and
 * repair are shared, so adding a provider means adding one function here
 * and one branch in `organize`.
 */
import { SYSTEM_PROMPT, extractJson, normalise } from './prompt.js'

const TIMEOUT_MS = 20_000

async function postJson(url, headers, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function callAnthropic(model, text) {
  const data = await postJson(
    'https://api.anthropic.com/v1/messages',
    {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    {
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    },
  )
  return data?.content?.map((block) => block?.text ?? '').join('') ?? ''
}

async function callOpenAI(model, text) {
  const data = await postJson(
    'https://api.openai.com/v1/chat/completions',
    { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    {
      model,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    },
  )
  return data?.choices?.[0]?.message?.content ?? ''
}

export async function organize({ provider, model, text }) {
  const raw =
    provider === 'anthropic'
      ? await callAnthropic(model, text)
      : provider === 'openai'
        ? await callOpenAI(model, text)
        : (() => {
            throw new Error(`unknown provider: ${provider}`)
          })()

  return normalise(extractJson(raw))
}
