import type { Expression } from '../components/Companion'

/**
 * The link between the UNLOAD window and the desktop Mochi window.
 *
 * A BroadcastChannel rather than IPC: both windows are the same origin, so
 * this keeps the state sync entirely inside the web app and means the
 * Electron main process never has to know anything about stuckness,
 * personalities or what Mochi is saying. It also degrades to nothing in a
 * plain browser, where there is simply no second window listening.
 */

export const MOCHI_CHANNEL = 'unload-mochi'

export interface PetState {
  /** Mirrors the existing `settings.mochiVisible` toggle. */
  visible: boolean
  /** True while the companion prompt is up in the main window. */
  talking: boolean
  line: string
  sub: string
  expression: Expression
}

export type PetMessage =
  | { type: 'state'; state: PetState }
  /** Pet asking the app to re-send state, e.g. after a reload. */
  | { type: 'hello' }
  /** Someone clicked the desktop Mochi. */
  | { type: 'summon' }

export const openChannel = () =>
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(MOCHI_CHANNEL)

/** The desktop bridge exposed by electron/preload.cjs, when present. */
export interface DesktopApi {
  isDesktop: true
  setTalking: (talking: boolean) => void
  setPetVisible: (visible: boolean) => void
  dragStart: () => void
  dragMove: (dx: number, dy: number) => void
  dragEnd: () => void
  focusMain: () => void
}

export const desktop = (): DesktopApi | null =>
  (globalThis as { unloadDesktop?: DesktopApi }).unloadDesktop ?? null
