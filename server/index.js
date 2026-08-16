/**
 * UNLOAD — local AI proxy
 *
 * The only reason this process exists is so that an API key never has to
 * live in browser code. It does two things:
 *
 *   GET  /api/status    → tells the UI whether a model is configured
 *   POST /api/organize  → turns a messy brain dump into structured JSON
 *
 * If no key is configured it answers /api/organize with 503 + a reason, and
 * the frontend transparently falls back to its built-in local organiser.
 * The app is fully usable either way — that is a product requirement, not a
 * degraded mode.
 *
 * Nothing is logged to disk. Nothing is stored. The dump text is held only
 * for the duration of the request.
 */
import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import { organize } from './providers/index.js'

const app = express()
const PORT = Number(process.env.PORT ?? 8787)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '64kb' }))

/** Which provider is actually usable right now. */
function resolveProvider() {
  const declared = (process.env.AI_PROVIDER ?? '').trim().toLowerCase()
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim())

  if (declared === 'openai' && hasOpenAI) return 'openai'
  if (declared === 'local') return 'local'

  // No explicit choice: use a key if one happens to be present.
  if (!declared && hasOpenAI) return 'openai'

  return 'local'
}

function modelFor(provider) {
  if (provider === 'openai') return process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  return null
}

app.get('/api/status', (_req, res) => {
  const provider = resolveProvider()
  res.json({
    ok: true,
    provider,
    model: modelFor(provider),
    // `configured: false` is the signal the UI uses to show "Local mode".
    configured: provider !== 'local',
  })
})

app.post('/api/organize', async (req, res) => {
  const provider = resolveProvider()

  if (provider === 'local') {
    return res.status(503).json({
      ok: false,
      reason: 'no-provider',
      message: 'No model configured. Set a key in .env to enable AI organising.',
    })
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!text) {
    return res.status(400).json({ ok: false, reason: 'empty', message: 'Nothing to organise.' })
  }
  if (text.length > 6000) {
    return res.status(413).json({ ok: false, reason: 'too-long', message: 'That dump is very long — try trimming it.' })
  }

  try {
    const result = await organize({ provider, model: modelFor(provider), text })
    res.json({ ok: true, source: provider, ...result })
  } catch (err) {
    // Never leak key material or raw provider errors to the client.
    console.error('[unload] organize failed:', err?.message ?? err)
    res.status(502).json({
      ok: false,
      reason: 'provider-error',
      message: 'The model could not be reached. Using the local organiser instead.',
    })
  }
})

app.listen(PORT, () => {
  const provider = resolveProvider()
  console.log(`\n  🧸 UNLOAD api  →  http://localhost:${PORT}`)
  console.log(
    provider === 'local'
      ? '     mode: local fallback (no API key found — the app still works)\n'
      : `     mode: ${provider} (${modelFor(provider)})\n`,
  )
})
