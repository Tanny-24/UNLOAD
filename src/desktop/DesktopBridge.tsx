import { useEffect, useRef } from 'react'

import { openChannel, type PetMessage, type PetState } from './channel'
import { levelFor } from '../services/activity'
import { MANUAL_LINE, nudgeLine, subLine } from '../data/messages'
import { useStore } from '../state/store'

/**
 * Publishes just enough state for the desktop Mochi window to mirror what
 * the in-app Mochi is doing, and relays clicks on the desktop pet back into
 * the existing companion flow.
 *
 * Renders nothing. Reads the store, never writes to it except through the
 * same `open()` the "I'm stuck" button already uses — so the activity
 * engine, the scoring and the roaming state machine are all untouched.
 *
 * In a plain browser this mounts, finds no one listening, and costs nothing.
 */
export function DesktopBridge() {
  const { settings, stuckness, interruption, open, minutesWorking } = useStore()
  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastSent = useRef('')

  const talking = interruption.kind === 'companion'
  const reason = interruption.kind === 'companion' ? interruption.reason : 'auto'
  const score = interruption.kind === 'companion' ? interruption.score : 0

  useEffect(() => {
    const channel = openChannel()
    channelRef.current = channel
    if (!channel) return

    channel.onmessage = (event: MessageEvent<PetMessage>) => {
      const message = event.data
      if (message?.type === 'summon') {
        // Exactly what the in-app "I'm stuck" button does.
        open({ kind: 'companion', reason: 'manual', score: stuckness.score })
      }
      if (message?.type === 'hello') lastSent.current = ''
    }

    return () => {
      channel.close()
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const channel = channelRef.current
    if (!channel) return

    const level = levelFor(score)
    const state: PetState = {
      visible: settings.mochiVisible,
      talking,
      line: talking
        ? reason === 'manual'
          ? MANUAL_LINE[settings.personality]
          : nudgeLine(settings.personality, level, score * 7)
        : '',
      // subLine rounds to whole minutes, so this only changes once a minute
      // rather than on every tick of the store.
      sub: talking && reason !== 'manual' ? subLine(minutesWorking, level) : '',
      expression: talking ? (level === 'overloaded' ? 'concerned' : 'curious') : 'idle',
    }

    // The store ticks every second; only speak up when something changed.
    const encoded = JSON.stringify(state)
    if (encoded === lastSent.current) return
    lastSent.current = encoded
    channel.postMessage({ type: 'state', state } satisfies PetMessage)
  }, [settings.mochiVisible, settings.personality, talking, reason, score, stuckness.score, minutesWorking])

  return null
}
