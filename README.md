\<div align="center"> 

# UNLOAD

**Unload your mind. Move a little. Get back to what matters.**

 \</div> 

UNLOAD is a privacy-first AI desk companion for anyone who loses whole afternoons to a screen — students, programmers, researchers, writers, and everyone in between.

Most wellbeing tools nag you on a timer. A pomodoro app doesn't know whether you're in flow or have read the same paragraph eleven times — it just knows 25 minutes elapsed. UNLOAD tries to notice the difference. It watches the *shape* of your interaction — not what you type, not your screen, not your face — and when that shape starts to look like being stuck, a small creature called **Mochi** walks over and offers to help.

The goal is not productivity. It's reducing the number of things you're holding in your head at once, getting you to stand up once in a while, and handing you back **one** clear next step.

---

## Demo

[Watch the Demo](https://youtu.be/tGmK_S5qvkE)

---

## Why UNLOAD?

Two problems, one product.

**Mental clutter.** Working memory holds a handful of things. When you're tracking twelve, none of them get your full attention. Writing them down helps. Being told which single one to start with helps more.

**Prolonged desk work.** Long unbroken sitting is bad for your eyes, your shoulders, and your thinking. Everyone knows this. Nobody takes breaks because a break feels like an admission of failure. A 20-second quest with a name and a reward doesn't.

---

## How It Works

UNLOAD runs a continuous, lightweight activity engine that counts keyboard and pointer events in 10-second buckets — never inspecting what you type, only *how much* you type. Four transparent signals are scored from this data and combined into a single stuckness score (0–100):

1. **Continuous work** — how long since you last stepped away.
2. **Pause pattern** — empty buckets appearing inside an otherwise active stretch.
3. **Start-stop rhythm** — bursts of activity separated by stalls (the shape of "write, delete, stare, repeat").
4. **Time since last reset** — how long since your last break, quest, or brain dump.

When the score crosses your chosen threshold, Mochi stops wandering, notices, walks over, and offers three paths:

- **🧠 Unload** — dump everything in your head into a big empty text box. UNLOAD (or an AI model) turns it into a short, prioritised list with one thing in the "Focus Now" lane and everything else parked.
- **🧘 Break** — a guided 30–60 second reset: breathing, shoulders, eyes, movement, or a quiet line to sit with.
- **🎮 Quest** — a tiny challenge with a name and XP: hold a stretch, look into the distance, walk thirty steps, drink some water.

After any reset, Mochi celebrates and quietly goes back to wandering. The stuckness score resets. You go back to the one thing that matters.

```
flowchart LR
    A["⌨️ Key + pointer events"] --> B["📊 Activity engine\n(10s buckets)"]
    B --> C["🧮 Stuckness score\n(4 signals, 0–100)"]
    C -->|"≥ threshold"| D["🧸 Mochi appears"]
    D --> E["🧠 Unload"]
    D --> F["🧘 Break"]
    D --> G["🎮 Quest"]
    E --> H["🅰️ AI organiser\nor local fallback"]
    H --> I["📋 Mental Parking Lot\n(Focus Now + Parked)"]
    F --> J["✓ Reset complete"]
    G --> J
    I --> J
    J --> K["🧸 Mochi celebrates,\nresumes roaming"]

```

You can also call Mochi yourself at any time — the manual "I'm stuck" button means you're never dependent on the detector firing.

---

## Key Features

### 🧠 AI Brain Dump

A big, deliberately undecorated text area. Type everything that is rattling around — unpunctuated, out of order, half-formed. UNLOAD organises it into a prioritised, categorised list of 3–8 actionable items with a one-sentence summary and a recommended first focus. The AI is explicitly instructed never to diagnose, label, or speculate about any health condition, and never to comment on your emotional state.

A separate, deterministic safety check looks for language about self-harm. If it fires, UNLOAD stops treating the input as a to-do list and surfaces a calm note pointing toward real human support with crisis line numbers.

### 📋 Mental Parking Lot

The result of every brain dump. One item sits in the **Focus Now** lane — the single thing to do next. Everything else is explicitly **Parked for Later**. You can reprioritise (high / medium / low), promote any item to focus, park the focus item, mark items done, delete them, or add new thoughts manually. The parking lot persists in localStorage across sessions.

### 🎯 Focus Mode

One goal, one countdown timer (configurable from 10 to 60 minutes), and a manual "I'm stuck" button. If your parking lot already has a focus item, you can start a session on it with one click, or type a custom goal. The timer counts up past zero without penalty — overtime is noted, not punished. Mochi stays present during focus and the stuckness detector keeps running.

### 🧘 Micro Breaks

Five guided resets, all under a minute, requiring no equipment and no camera:

- **Four Breaths** — a 4-in, 3-hold, 6-out pattern with an animated breathing circle. Four rounds, about 55 seconds.
- **Shoulder Reset** — backward rolls, forward rolls, and a deliberate drop. 45 seconds.
- **Eye Reset** — look at the farthest thing you can see, let your eyes go soft, blink slowly. 40 seconds.
- **Stand and Move** — stand, reach for the ceiling, walk twenty steps, come back. 60 seconds.
- **One Quiet Line** — a line to read and sit with. No exercise. 30 seconds.

Mochi follows along during physical breaks, stretching with you.

### 🎮 Micro Quests

Six tiny challenges framed as something you *complete*, with XP rewards:

- **Yoda Reset** — hold both arms above your head for 15 seconds.
- **20-Second Distance** — look at the farthest thing you can see, no screens.
- **Mini Walk** — stand up, walk thirty steps, come back.
- **Four Breaths** — in for four, out for six, four times.
- **Mental Clear** — name the one thought that keeps interrupting you. It goes straight to your parking lot.
- **Glass of Water** — go fill a glass. Drink some before you sit back down.

None of them need a camera, a phone, or anyone else in the room.

### 🎬 Demo Mode

The stuckness detector takes real time to build a signal — you'd need to work for 40+ minutes to trigger Mochi naturally. Demo Mode injects a synthetic activity pattern into the **same scoring engine** the real signals use, so the entire flow can be shown in seconds. Four profiles are available from Settings:

- **55 minutes deep** — a long unbroken stretch. Mochi appears.
- **Type, delete, repeat** — bursts separated by stalls, the shape of being stuck.
- **Staring at the screen** — a long session that quietly stopped producing anything.
- **Just sat down** — everything clear. Proves UNLOAD stays quiet when it should.

---

## 🧸 Mochi — The Desk Companion

Mochi is drawn entirely in SVG with Framer Motion animation — no images, no sprites, nothing to load. It lives in a fixed, click-through overlay above the app, wandering the empty gutters and bottom edge of the screen while you work.

**Behaviour.** Mochi walks between safe spots (the margins on wide screens, the bottom strip on narrow ones), sits, looks around, stretches, yawns, and dozes off. Eight expressions — idle, curious, happy, sleepy, alert, concerned, yawn, stretch — are full poses, not just face changes: the ears perk up, the arms reach, the body shifts. How often Mochi walks vs. sits vs. sleeps is weighted by your stuckness level.

**Personality.** Five selectable voices change what Mochi says, not what it does: Calm ("Quiet, warm, gets out of the way"), Cozy ("Soft blanket energy"), Chaotic ("Loud, fond of you, slightly unhinged"), Nerd ("Speaks fluent stack trace"), and Zen ("Small words. Long pauses.").

**Nudging.** When the stuckness score crosses your threshold, Mochi stops, its ears go up (the alert pose), then it walks to its speaking position and opens a speech bubble with three options and a snooze. This is **not a modal** — the page is never dimmed, focus is never stolen, and you can keep typing. The bubble shows your current score and confirms: "Noticed from activity timing only — nothing you typed was read."

**Interacting.** You can click Mochi at any time to manually summon the companion prompt. You can also toggle Mochi off entirely in Settings without losing any functionality — every feature still works through the dashboard buttons.

**Controls.** Mochi's visibility, roaming, and animations are all independently toggleable. Reduced Motion mode parks Mochi in its corner and skips the approach animation entirely.

### Desktop Mochi (Electron)

Mochi can live on your desktop as a small transparent window floating above other applications.

The Electron shell opens two windows: the full UNLOAD app in a standard resizable window, and a tiny **frameless, transparent, always-on-top** window holding just Mochi. The desktop Mochi mirrors the in-app companion's state via a BroadcastChannel — when the in-app Mochi notices you're stuck, the desktop Mochi shows the same speech bubble.

**Draggable.** You can drag desktop Mochi anywhere on your screen. A click (without dragging) brings the main UNLOAD window to the front and triggers the companion prompt.

**Window management.** The pet window grows to fit the speech bubble when Mochi has something to say and shrinks back when it doesn't. It is visible on all workspaces, skips the taskbar, and never hijacks focus. Closing either window closes both — UNLOAD is a desk tool, not something to leave resident.

**No extra data collection.** The Electron main process reads no screen content, no keyboard input, and no other application state. It positions a small window and relays two messages.

---

## AI

UNLOAD currently supports **OpenAI** as its AI provider (default model: **gpt-4o-mini**). AI does exactly one job: turning a messy brain dump into a short, prioritised, categorised list. It does not score you, coach you, watch you, or interpret your mood.

The dump text is sent to a small **Express proxy running on your machine** (`localhost:8787`), which holds the API key. The key is never present in the browser bundle. The text is used for that single request — nothing is logged to disk, nothing is stored.

The model returns strict JSON, which the server validates and coerces into the exact shape the app expects before it reaches the UI. If a response is malformed, it degrades to the local fallback rather than crashing.

**Without an API key, the app is fully functional.** A built-in **deterministic local organiser** runs entirely in the browser: it splits clauses, strips filler phrases, tidies each into an imperative phrase, scores priority from keyword evidence, and assigns categories. The UI shows a "Local mode" badge so you always know which path ran. This is the default experience for anyone who clones the repo and runs it — not a degraded mode, a complete one.

---

## Privacy

> 🔒 **UNLOAD is designed to notice your workflow, not watch you.**

**What UNLOAD collects**, entirely in your browser's memory and localStorage:

- A count of key events per 10-second bucket
- A count of pointer events per 10-second bucket
- Timestamps and elapsed durations

That is the whole dataset. Two integers and a timestamp, ten times a minute.

**What UNLOAD does not collect, ever:**

- Which keys you pressed or any typed content (the `keydown` handler never reads `event.key` — it increments a counter and returns)
- Pointer coordinates
- Screenshots or screen contents
- Camera or microphone input (there is no camera or microphone code in this repository)
- Window titles, application names, URLs, or clipboard contents
- Anything sent to an analytics service or a server you don't run

**Where it is stored.** `localStorage`, in this browser, on this machine. There is no account, no sync, and no server-side copy. Settings → "Erase everything" is a complete and permanent uninstall.

**When an API key is configured**, only the brain dump text is sent to the model through the local proxy — the activity data, the stuckness score, and everything else stays in the browser.

**One honest limitation.** Because UNLOAD is a web app, it only sees events while an UNLOAD window has focus. It cannot watch your editor or your other browser tabs. That is why the manual "I'm stuck" button and Demo Mode both exist.

---

## Tech Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Framer Motion** for all animation
- **React Router** for client-side routing (Home, Focus, Settings)
- **Express 5** for the local AI proxy
- **Electron 43** for the desktop companion shell
- **OpenAI API** (via direct `fetch`, no SDK)
- **localStorage** for persistence — no database
- Self-hosted **Fraunces** + **Inter** via Fontsource (no external font requests at runtime)
- **oxlint** for linting
- **concurrently** for running multiple processes in one command

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  BROWSER                                                      │
│                                                               │
│  keydown / pointer events                                     │
│         │  (counted, never inspected)                         │
│         ▼                                                     │
│  ┌──────────────────┐      ┌─────────────────────────────┐    │
│  │ activity engine   │─────▶│ stuckness score  (0-100)    │    │
│  │ 10s buckets       │      │ 4 weighted signals          │    │
│  └──────────────────┘      └──────────────┬──────────────┘    │
│                                           │ ≥ threshold       │
│                                           ▼                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  🧸 Mochi   →  Unload · Break · Quest · I'm good        │   │
│  └────────────────────┬───────────────────────────────────┘   │
│                       │                                       │
│                 brain dump text                                │
│                       │                                       │
│      ┌────────────────┴──────────────────┐                    │
│      ▼                                   ▼                    │
│  ┌─────────────┐                ┌──────────────────┐          │
│  │ POST /api/  │  ── no key ──▶ │ local organiser   │          │
│  │  organize   │  ── error ──▶  │ (deterministic)   │          │
│  └──────┬──────┘                └────────┬─────────┘          │
│         │                                │                    │
│         └────────────────┬───────────────┘                    │
│                          ▼                                    │
│               🧠 Mental Parking Lot  ──▶  localStorage        │
└──────────────────────────┼────────────────────────────────────┘
                           │  (only when a key is configured)
┌──────────────────────────▼────────────────────────────────────┐
│  LOCAL NODE PROCESS  ·  localhost:8787                          │
│  Express proxy — holds the API key, stores nothing             │
│  providers/ → openai                                           │
└──────────────────────────┼────────────────────────────────────┘
                           ▼
                        OpenAI API

┌───────────────────────────────────────────────────────────────┐
│  ELECTRON SHELL (optional)                                     │
│                                                                │
│  main window ←──── BroadcastChannel ────→ pet window           │
│  (full app)          (state sync)         (transparent,        │
│                                            always-on-top,      │
│                                            draggable Mochi)    │
└───────────────────────────────────────────────────────────────┘

```

The frontend is a single React app with three routes (Home, Focus, Settings), a central context-based store, and modal overlays for the brain dump, breaks, quests, and reward screens. The activity engine and stuckness scorer run continuously in the browser on a 1-second tick. Mochi's roaming behaviour is a separate state machine that reads the score but never writes to it.

The server is a minimal Express process whose only purpose is keeping the API key out of the browser. Two endpoints: `GET /api/status` (tells the UI whether a model is configured) and `POST /api/organize` (sends a dump to the model and returns structured JSON).

The desktop companion is an Electron shell that loads the same web app and adds one extra transparent window. State is synced via BroadcastChannel, so the Electron main process never needs to know about stuckness, personalities, or what Mochi is saying.

---

## Getting Started

### Install

```
npm install

```

### Run the Web App

```
npm run dev

```

Open **http\://localhost:5273**. This single command starts both the Vite dev server (port 5273) and the AI proxy (port 8787). No API key is needed — the app works fully in local mode.

### Run the Desktop Companion

```
npm run desktop

```

Starts all three processes: the API proxy, the Vite dev server, and the Electron shell. Mochi appears as a small transparent window on your desktop.

### Build for Production

```
npm run build

```

### Lint

```
npm run lint

```

---

## Environment Variables

Copy the example file and fill in a key if you have one:

```
cp .env.example .env

```

| Variable Purpose Default  |                                                                            |               |
| ------------------------- | -------------------------------------------------------------------------- | ------------- |
| `AI_PROVIDER`             | `openai` or `local`. Leave blank to auto-detect from whether a key is set. | `local`       |
| `OPENAI_API_KEY`          | Your OpenAI API key. Optional — the app works fully without one.           | —             |
| `OPENAI_MODEL`            | Which OpenAI model to use.                                                 | `gpt-4o-mini` |
| `PORT`                    | Port for the AI proxy server.                                              | `8787`        |

`.env` is gitignored. Keys are read only by the Node process and never reach the browser.

---

## Keyboard Shortcuts

| Shortcut Action      |                   |
| -------------------- | ----------------- |
| `⌘/Ctrl + Shift + U` | Open brain dump   |
| `⌘/Ctrl + Shift + K` | Call Mochi        |
| `⌘/Ctrl + Shift + F` | Focus mode        |
| `⌘/Ctrl + Enter`     | Submit brain dump |

---

## Limitations

- Activity detection only works while an UNLOAD window has focus — it cannot observe other apps or browser tabs.
- The Electron desktop companion requires the Vite dev server to be running (it loads the app from `localhost:5273`).
- Brain dump text has a 4,000-character limit in the UI and 6,000-character limit at the server.
- Persistence is localStorage only — no cross-device sync, no backup.

---

## Licence

MIT.
