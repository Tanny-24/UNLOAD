import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { PrivacyNote, SignalBreakdown, StucknessMeter } from '../components/ActivityIndicator'
import { Button, Card, Pill, SectionLabel } from '../components/ui'
import { PERSONALITIES } from '../data/messages'
import { DEMO_PROFILES, type DemoProfile } from '../services/activity'
import { storage } from '../services/storage'
import { useStore } from '../state/store'
import type { Personality } from '../types'

export function Settings() {
  const { settings, setSettings, stuckness, aiStatus, runDemo, totals, open } = useStore()
  const navigate = useNavigate()
  const [confirmErase, setConfirmErase] = useState(false)

  function demo(profile: DemoProfile) {
    // The companion is a modal, so get out of Settings first — otherwise the
    // reveal happens on top of a page of switches.
    navigate('/')
    window.setTimeout(() => runDemo(profile), 260)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <div className="pb-1">
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="text-ink-soft mt-2">Everything here is stored in this browser and nowhere else.</p>
      </div>

      {/* ------------------------------ demo ------------------------------ */}
      <Card className="border-butter/40 bg-butter-soft/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionLabel>🎬 Demo mode</SectionLabel>
            <p className="text-ink-soft mt-1.5 text-sm">
              Replay a work pattern instead of waiting an hour for one. Nothing here is fabricated data — it feeds the
              same scoring engine the real signals do.
            </p>
          </div>
          <Toggle
            label="Show demo badge"
            checked={settings.demoMode}
            onChange={(v) => setSettings({ demoMode: v })}
          />
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {(Object.keys(DEMO_PROFILES) as DemoProfile[]).map((key) => (
            <button
              key={key}
              onClick={() => demo(key)}
              className="bg-paper/80 hover:bg-paper rounded-2xl border-2 border-transparent px-4 py-3.5 text-left transition-all hover:border-[color:var(--color-butter)]"
            >
              <span className="block font-medium">{DEMO_PROFILES[key].label}</span>
              <span className="text-ink-soft mt-0.5 block text-xs leading-relaxed">{DEMO_PROFILES[key].hint}</span>
              <span className="text-ink-faint tabular mt-1.5 block text-[0.68rem]">
                simulates {DEMO_PROFILES[key].sessionMinutes} min at the desk
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="soft" tone="peach" onClick={() => open({ kind: 'dump' })}>
            Open brain dump
          </Button>
          <Button size="sm" variant="soft" tone="sky" onClick={() => open({ kind: 'break' })}>
            Open a break
          </Button>
          <Button size="sm" variant="soft" tone="butter" onClick={() => open({ kind: 'quest' })}>
            Open a quest
          </Button>
        </div>
      </Card>

      {/* --------------------------- companion --------------------------- */}
      <Card>
        <SectionLabel>Your companion</SectionLabel>

        <div className="mt-4">
          <label htmlFor="name" className="text-sm font-medium">
            What should Mochi call you?
          </label>
          <input
            id="name"
            value={settings.name}
            onChange={(e) => setSettings({ name: e.target.value })}
            placeholder="Leave blank for none"
            maxLength={24}
            className="bg-cream/70 border-cream-deep focus:border-lilac mt-2 w-full rounded-2xl border-2 px-4 py-2.5 outline-none transition-colors"
          />
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Personality</legend>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {PERSONALITIES.map((p) => (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 transition-all ${
                  settings.personality === p.id
                    ? 'border-lilac bg-lilac-soft/35'
                    : 'border-cream-deep hover:border-ink-faint/30'
                }`}
              >
                <input
                  type="radio"
                  name="personality"
                  value={p.id}
                  checked={settings.personality === p.id}
                  onChange={() => setSettings({ personality: p.id as Personality })}
                  className="accent-lilac mt-1"
                />
                <span>
                  <span className="block font-medium">
                    {p.emoji} {p.name}
                  </span>
                  <span className="text-ink-soft block text-xs">{p.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {/* --------------------------- nudging ----------------------------- */}
      <Card>
        <SectionLabel>When to interrupt you</SectionLabel>

        <div className="mt-4 space-y-4">
          <Toggle
            label="Let Mochi turn up on its own"
            hint="Off means the companion only appears when you press “I'm stuck”."
            checked={settings.autoNudge}
            onChange={(v) => setSettings({ autoNudge: v })}
          />

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="sensitivity" className="text-sm font-medium">
                Nudge me at
              </label>
              <span className="tabular text-ink-faint text-sm">{settings.sensitivity}/100</span>
            </div>
            <input
              id="sensitivity"
              type="range"
              min={40}
              max={90}
              step={5}
              value={settings.sensitivity}
              onChange={(e) => setSettings({ sensitivity: Number(e.target.value) })}
              disabled={!settings.autoNudge}
              className="accent-peach mt-2 w-full disabled:opacity-40"
            />
            <div className="text-ink-faint mt-1 flex justify-between text-xs">
              <span>40 — chatty</span>
              <span>90 — barely ever</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="focus-minutes" className="text-sm font-medium">
                Focus session length
              </label>
              <span className="tabular text-ink-faint text-sm">{settings.focusMinutes} min</span>
            </div>
            <input
              id="focus-minutes"
              type="range"
              min={10}
              max={60}
              step={5}
              value={settings.focusMinutes}
              onChange={(e) => setSettings({ focusMinutes: Number(e.target.value) })}
              className="accent-peach mt-2 w-full"
            />
          </div>
        </div>
      </Card>

      {/* ------------------------- transparency -------------------------- */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionLabel>How the score is built</SectionLabel>
          <Pill>live</Pill>
        </div>

        <div className="mt-4">
          <StucknessMeter stuckness={stuckness} />
        </div>

        <div className="mt-6">
          <SignalBreakdown stuckness={stuckness} />
        </div>

        <p className="text-ink-faint mt-5 text-xs leading-relaxed">
          Four signals, fixed weights, no model. UNLOAD notices that your working rhythm changed — it does not know
          why, and it will never claim to. It does not detect stress, mood, or any health condition.
        </p>
      </Card>

      {/* -------------------------- accessibility ------------------------ */}
      <Card>
        <SectionLabel>Comfort</SectionLabel>
        <div className="mt-4 space-y-4">
          <Toggle
            label="Reduce motion"
            hint="Stops the floating, breathing and sliding animations everywhere."
            checked={settings.reducedMotion}
            onChange={(v) => setSettings({ reducedMotion: v })}
          />
        </div>
      </Card>

      {/* ------------------------------ ai ------------------------------- */}
      <Card>
        <SectionLabel>AI</SectionLabel>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone={aiStatus.mode === 'model' ? 'lilac' : 'plain'}>
            {aiStatus.mode === 'model' ? `${aiStatus.provider} · ${aiStatus.model}` : 'Local mode'}
          </Pill>
        </div>
        <p className="text-ink-soft mt-3 text-sm leading-relaxed">
          {aiStatus.mode === 'model'
            ? 'Brain dumps are sent to the model through a proxy running on your machine, which holds the API key. The text is used for that one request and is never stored, logged or used for anything else.'
            : 'No API key is configured, so brain dumps are organised by UNLOAD’s built-in offline organiser. Nothing leaves this browser. Add a key to .env and restart to switch models.'}
        </p>
        <p className="text-ink-faint mt-3 text-xs leading-relaxed">
          Either way the AI does exactly one job: turning a messy dump into a short, prioritised list. It does not
          score you, coach you, or make any health claim.
        </p>
      </Card>

      {/* ----------------------------- data ------------------------------ */}
      <Card>
        <SectionLabel>Your data</SectionLabel>
        <div className="text-ink-soft mt-3 space-y-1 text-sm">
          <p>
            Lifetime: <span className="tabular text-ink font-medium">{totals.resets}</span> resets ·{' '}
            <span className="tabular text-ink font-medium">{totals.xp}</span> XP
          </p>
          <p>Stored in this browser's localStorage. No account, no sync, no server copy.</p>
        </div>

        <div className="mt-4">
          {confirmErase ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Erase settings, parking lot and all counters?</span>
              <Button
                size="sm"
                tone="peach"
                onClick={() => {
                  storage.clearAll()
                  window.location.reload()
                }}
              >
                Erase everything
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmErase(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="soft" onClick={() => setConfirmErase(true)}>
              Erase everything
            </Button>
          )}
        </div>
      </Card>

      <PrivacyNote />
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: ReactNode
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="text-ink-soft mt-0.5 block text-xs leading-relaxed">{hint}</span>}
      </span>
      <span className="relative shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only-focusable"
        />
        <span
          aria-hidden="true"
          className={`block h-6 w-11 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--color-lilac)] ${
            checked ? 'bg-mint' : 'bg-cream-deep'
          }`}
        >
          <span
            className={`mt-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              checked ? 'translate-x-[1.4rem]' : 'translate-x-0.5'
            }`}
          />
        </span>
      </span>
    </label>
  )
}
