import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Companion } from '../components/Companion'
import { desktop, openChannel, type PetMessage, type PetState } from './channel'

/**
 * The desktop Mochi.
 *
 * A separate entry point rendered into the small transparent always-on-top
 * window. It is deliberately not the roaming Mochi from the app: on the
 * desktop *you* decide where it sits, so it stays where you drag it and
 * mirrors what the in-app companion is doing.
 */

/** Kept in step with PET_IDLE / PET_TALKING in electron/main.cjs. */
const MOCHI_SIZE = 76
const INSET = 21

const INITIAL: PetState = {
  visible: true,
  talking: false,
  line: '',
  sub: '',
  expression: 'idle',
}

export function Pet() {
  const [state, setState] = useState<PetState>(INITIAL)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const api = desktop()

  /* ---------------- state from the main window ---------------- */

  useEffect(() => {
    const channel = openChannel()
    channelRef.current = channel
    if (!channel) return

    channel.onmessage = (event: MessageEvent<PetMessage>) => {
      if (event.data?.type === 'state') setState(event.data.state)
    }
    // The app may have been running long before this window appeared.
    channel.postMessage({ type: 'hello' } satisfies PetMessage)

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [])

  /* ---------------- window follows the state ---------------- */

  useEffect(() => {
    api?.setTalking(state.talking)
  }, [api, state.talking])

  useEffect(() => {
    api?.setPetVisible(state.visible)
  }, [api, state.visible])

  /* ---------------- drag, and click ---------------- */

  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { x: e.screenX, y: e.screenY, moved: false }
    api?.dragStart()
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const dx = e.screenX - d.x
    const dy = e.screenY - d.y
    // A few pixels of slop, so a slightly shaky click is still a click.
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    if (d.moved) api?.dragMove(dx, dy)
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current
    drag.current = null
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    api?.dragEnd()

    if (d && !d.moved) {
      // A plain click asks the app for the companion, exactly as the
      // in-app "I'm stuck" button does, and brings UNLOAD forward.
      channelRef.current?.postMessage({ type: 'summon' } satisfies PetMessage)
      api?.focusMain()
    }
  }

  if (!state.visible) return null

  return (
    <div className="relative h-screen w-screen">
      <AnimatePresence>
        {state.talking && state.line && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="absolute"
            style={{ right: 16, bottom: INSET + MOCHI_SIZE + 14, width: 268 }}
          >
            <div className="card relative px-4 py-3 shadow-[var(--shadow-lift)]">
              <span
                aria-hidden="true"
                className="bg-paper absolute -bottom-2 h-4 w-4 rotate-45 rounded-br-[3px] border-r border-b border-[rgb(120_96_72/0.09)]"
                style={{ right: 30 }}
              />
              <p className="font-display text-base leading-snug">{state.line}</p>
              {state.sub && <p className="text-ink-soft mt-1 text-xs">{state.sub}</p>}
              <p className="text-ink-faint mt-1.5 text-[0.65rem]">Click Mochi to open UNLOAD.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        role="button"
        tabIndex={0}
        aria-label="Mochi. Click to open UNLOAD and ask for a reset. Drag to move."
        title="Mochi — click to open UNLOAD, drag to move"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          channelRef.current?.postMessage({ type: 'summon' } satisfies PetMessage)
          api?.focusMain()
        }}
        className="absolute cursor-pointer outline-none"
        style={{ right: INSET, bottom: INSET, width: MOCHI_SIZE }}
      >
        <Companion expression={state.expression} size={MOCHI_SIZE} />
      </div>
    </div>
  )
}
