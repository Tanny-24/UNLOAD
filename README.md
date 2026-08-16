<div align="center">

# UNLOAD

**Unload your mind. Move a little. Get back to what matters.**

A privacy-first AI desk companion for students, programmers, researchers
and anyone else who loses whole afternoons to a screen.

</div>

---

## What is UNLOAD?

Most wellbeing tools nag you on a timer. A pomodoro app has no idea whether
you are in flow or have read the same paragraph eleven times — it just knows
that 25 minutes elapsed.

UNLOAD tries to notice the difference.

It watches the *shape* of your interaction — not what you type, not your
screen, not your face — and when that shape starts to look like being stuck,
a small companion called **Mochi** turns up and offers you a way out:

```
              🧸

     "Hey… brain buffering?"

    You have been working for 55 minutes.

        [  🧠 Unload         ]
        [ 🧘 Tiny break ] [ 🎮 Micro quest ]

           I'm good  ·  Snooze 10 min
```

Choose **Unload** and you get a big empty box. Type everything that is
rattling around, unpunctuated and out of order. UNLOAD turns it into a
**Mental Parking Lot**: one thing to do now, everything else explicitly
parked.

The goal is not to make you more productive. It is to reduce the number of
things you are holding in your head at once, get you to stand up
occasionally, and hand you back **one** clear next step.

## Why

Two problems, one product:

- **Mental clutter.** Working memory holds a handful of things. When you are
  tracking twelve, the cost is not just forgetting one — it is that none of
  them get your full attention. Writing them down helps. Being told which
  single one to start with helps more.
- **Prolonged desk work.** Long unbroken sitting is bad for your eyes, your
  shoulders and your thinking. Everyone knows this. Nobody takes breaks
  because a break feels like an admission of failure. A 20-second quest with
  a name and a reward does not.

## Features

| | |
|---|---|
| 🧸 **Mochi, the companion** | An SVG desk creature with idle float, blinking, four expressions and four personalities (Calm, Chaotic, Nerd, Zen). Appears when you might be stuck; leaves the moment you say you're fine. |
| 📊 **Stuckness detection** | A transparent four-signal heuristic over interaction metadata, scored 0–100 and classified Clear / Loaded / Might be stuck / Probably overloaded. Every component is visible in Settings. |
| 🧠 **Brain dump → Parking Lot** | Free-form dump, organised into prioritised items with exactly one in the FOCUS NOW lane. Change priority, promote, park, complete, delete, add. Persists locally. |
| 🧘 **Micro breaks** | Five guided 30–60 second resets: four breaths, shoulder reset, eye reset, stand and move, one quiet line. |
| 🎮 **Micro quests** | Six tiny challenges with rewards — Yoda Reset, 20-Second Distance, Mini Walk, Four Breaths, Mental Clear, Glass of Water. Mental Clear writes straight back into your parking lot. |
| 🎯 **Focus mode** | One goal, one timer, and a manual **I'm stuck** button so you are never dependent on the detector firing. |
| 🎬 **Demo mode** | Replay a work pattern instead of waiting an hour for one. |
| ♿ **Accessible** | Full keyboard navigation, focus trapping, visible focus rings, reduced-motion toggle, no colour-only information, text alternatives for everything Mochi says. |

## Privacy

> 🔒 **UNLOAD is designed to notice your workflow, not watch you.**
> No webcam. No microphone. No screenshots. No keystroke content.

This is the core design constraint, not a feature bullet.

**What UNLOAD collects**, entirely in your browser:

- a count of key events per 10-second bucket
- a count of pointer events per 10-second bucket
- timestamps and elapsed durations

That is the whole dataset. Two integers and a timestamp, ten times a minute.

**What UNLOAD does not collect, ever:**

- ❌ which keys you pressed, or any typed content
- ❌ pointer coordinates
- ❌ screenshots or screen contents
- ❌ camera or microphone (there is no camera code in this repo at all)
- ❌ window titles, application names, URLs, or clipboard
- ❌ anything sent to an analytics service or a server you don't run

The `keydown` handler in [`src/services/activity.ts`](src/services/activity.ts)
never reads `event.key`. It increments a counter and returns.

**Where it is stored:** `localStorage`, in this browser, on this machine.
There is no account, no sync and no server-side copy. Settings → *Erase
everything* is a complete and permanent uninstall.

**One honest limitation:** because UNLOAD is a web app, it only sees events
while an UNLOAD window has focus. It cannot watch your editor or your
browser tabs — and deliberately so. That is why the manual **I'm stuck**
button and Demo Mode both exist.

## AI

AI does exactly one job in UNLOAD: **turning a messy brain dump into a short,
prioritised, categorised list.** That's it.

It does not score you, coach you, watch you, or interpret your mood.

- Your dump goes to a small Express proxy running on **your** machine, which
  holds the API key. The key is never in the browser bundle.
- The text is used for that single request and is never stored or logged.
- The model returns strict JSON, which is validated and coerced before it
  reaches the UI, so a malformed response degrades instead of crashing.
- **Without an API key the app is fully functional.** A deterministic local
  organiser splits clauses, tidies them into imperative phrases and scores
  priority and category from keyword evidence. The UI shows a *Local mode*
  badge so you always know which path ran.

### AI safety

UNLOAD is a desk tool, not a therapist, and the prompt says so explicitly.
The model is instructed never to diagnose, label or speculate about anxiety,
depression, ADHD, burnout or any health condition, and never to comment on
your emotional state.

Separately — and independently of which path runs — a deterministic check
looks for language about self-harm. If it fires, UNLOAD stops pretending a
to-do list is the right response and surfaces a calm note pointing toward
real human support. Nothing about that check is stored or transmitted.

The app never claims to detect stress, mood or illness. It says *"you might
be stuck"*, and it shows you the four numbers behind that guess.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER                                                     │
│                                                              │
│  keydown / pointer events                                    │
│         │  (counted, never inspected)                        │
│         ▼                                                    │
│  ┌──────────────────┐      ┌────────────────────────────┐    │
│  │ activity engine  │─────▶│ stuckness score  (0-100)   │    │
│  │ 10s buckets      │      │ 4 weighted signals         │    │
│  └──────────────────┘      └─────────────┬──────────────┘    │
│                                          │ ≥ threshold       │
│                                          ▼                   │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  🧸 Mochi   →  Unload · Break · Quest · I'm good       │   │
│  └───────────────────────┬───────────────────────────────┘   │
│                          │                                   │
│                    brain dump text                           │
│                          │                                   │
│         ┌────────────────┴──────────────────┐                │
│         ▼                                   ▼                │
│  ┌─────────────┐                   ┌──────────────────┐      │
│  │ POST /api/  │  ── if no key ──▶ │ local organiser  │      │
│  │  organize   │  ── on failure ─▶ │ (deterministic)  │      │
│  └──────┬──────┘                   └────────┬─────────┘      │
│         │                                   │                │
│         └───────────────┬───────────────────┘                │
│                         ▼                                    │
│              🧠 Mental Parking Lot  ──▶  localStorage        │
└─────────────────────────┼───────────────────────────────────┘
                          │  (only when a key is configured)
┌─────────────────────────▼───────────────────────────────────┐
│  LOCAL NODE PROCESS  ·  localhost:8787                       │
│  Express proxy — holds the API key, stores nothing           │
│  providers/ → anthropic | openai                             │
└─────────────────────────┼───────────────────────────────────┘
                          ▼
                   Anthropic / OpenAI API
```

Two processes, one command. No database, no auth, no cloud.

### Project structure

```
UNLOAD/
├── server/
│   ├── index.js              # Express proxy: /api/status, /api/organize
│   └── providers/
│       ├── index.js          # provider abstraction (anthropic | openai)
│       └── prompt.js         # system prompt + JSON validation
├── src/
│   ├── components/           # Companion, BrainDump, ParkingLot, MicroBreak,
│   │                         # MicroQuest, CompanionPrompt, RewardCard, …
│   ├── pages/                # Home, Focus, Settings
│   ├── services/
│   │   ├── activity.ts       # activity engine + stuckness scoring + demo
│   │   ├── ai.ts             # client, fallback chain, safety check
│   │   ├── localOrganizer.ts # the offline organiser
│   │   └── storage.ts        # localStorage
│   ├── state/store.tsx       # single React context
│   ├── data/                 # quests, breaks, companion copy
│   └── types.ts
├── .env.example
└── README.md
```

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Framer Motion** for animation
- **React Router** for the three routes
- **Express** for the local AI proxy
- **localStorage** for persistence — no database
- Self-hosted **Fraunces** + **Inter** via Fontsource (no external font requests)

Chosen so the whole thing installs and runs in under a minute, with no
native modules and no build steps beyond Vite.

## Running locally

```bash
npm install
```

```bash
npm run dev
```

Then open **http://localhost:5273**.

That one command starts both processes:

- `web` — Vite dev server on `5273`
- `api` — the AI proxy on `8787`

You do **not** need an API key. With no key, the API prints
`mode: local fallback` and the UI shows a *Local mode* badge — everything
works.

Other commands:

```bash
npm run build
```

```bash
npm run lint
```

## Environment variables

Copy the example file and fill in whichever provider you have:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `anthropic`, `openai`, or `local`. Leave blank to auto-detect from whichever key is set. |
| `ANTHROPIC_API_KEY` | Anthropic key. Optional. |
| `ANTHROPIC_MODEL` | Defaults to `claude-sonnet-5`. |
| `OPENAI_API_KEY` | OpenAI key. Optional. |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini`. |
| `PORT` | Proxy port. Defaults to `8787`. |

`.env` is gitignored. Keys are read only by the Node process and never
reach the browser bundle.

## Demo

Go to **Settings → 🎬 Demo mode** and pick a pattern. Each one injects a
synthetic activity window and backdates the session clock, then runs it
through the **same** scoring engine the real signals use — the score is
computed, not faked.

| Profile | What it simulates |
|---|---|
| **55 minutes deep** | A long unbroken stretch. Scores in the mid-70s → Mochi appears. |
| **Type, delete, repeat** | Bursts separated by stalls — the shape of being stuck. |
| **Staring at the screen** | A long session that quietly stopped producing anything. |
| **Just sat down** | Everything clear — proves UNLOAD stays quiet when it should. |

### The two-minute demo

1. Open UNLOAD. Dashboard, companion, privacy note.
2. **Focus → "Finish assignment" → Start.** Timer running.
3. **Settings → 55 minutes deep.** You land back in Focus and Mochi appears
   over it: *"Hey… brain buffering?"*
4. Click **🧠 Unload**. Type:
   *"I need to finish my assignment, reply to my professor, study for tomorrow's exam and buy groceries."*
5. **Unload my brain.** → FOCUS NOW: *Study for tomorrow's exam*, everything else parked.
6. **Back to focus.**
7. Click **I'm stuck** → Mochi returns → **🎮 Micro quest**.
8. Accept **Yoda Reset**, hold for 15 seconds, **Mark complete**.
9. **Quest complete ✓** — mind, body and XP tick up.

Under two minutes, and every step works with no API key and no network.

Keyboard shortcuts: `⌘/Ctrl+Shift+U` unload · `⌘/Ctrl+Shift+K` call Mochi ·
`⌘/Ctrl+Shift+F` focus mode.

## Future improvements

Honest list of what is *not* built:

- **Optional opt-in webcam pose challenge** for the Yoda Reset, using
  on-device pose landmarks with no frame ever leaving the machine. Explicitly
  opt-in, camera off the instant the challenge ends. Deliberately left out of
  this build — the product has to be complete without it, and it is.
- **Richer activity detection** via an Electron shell, so the engine sees
  system-wide interaction rather than only focused-window events — still
  metadata only.
- **Voice input** for the brain dump via the Web Speech API.
- **Weekly patterns** — which hours you tend to get stuck, kept on-device.
- **Parking lot history** beyond the current day.

## Licence

MIT.
