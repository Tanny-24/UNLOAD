/**
 * Provider abstraction.
 *
 * A provider is just: (model, text) -> raw string. Parsing, validation and
 * repair are shared below, so adding another one means adding a single
 * function here and a branch in `organize`.
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
  if (provider !== 'openai') throw new Error(`unknown provider: ${provider}`)

  return normalise(extractJson(await callOpenAI(model, text)))
}
