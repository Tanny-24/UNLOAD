import { useEffect, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { BrainDump } from './components/BrainDump'
import { Layout } from './components/Layout'
import { MochiLayer } from './components/mochi/MochiLayer'
import { MicroBreak } from './components/MicroBreak'
import { MicroQuest } from './components/MicroQuest'
import { RewardCard } from './components/RewardCard'
import { DesktopBridge } from './desktop/DesktopBridge'
import { Focus } from './pages/Focus'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'
import { StoreProvider, useStore } from './state/store'

/**
 * Mochi is not in here.
 *
 * These are the full interactions — dump, break, quest, reward — and they
 * are modals on purpose: once you've chosen to do one, it should have your
 * attention. Mochi's own nudge is deliberately *not* a modal; it lives in
 * <MochiLayer> and never blocks the page.
 */
function Overlays() {
  return (
    <>
      <BrainDump />
      <MicroBreak />
      <MicroQuest />
      <RewardCard />
    </>
  )
}

/** Two shortcuts that are worth the keystrokes: unload, and call for help. */
function Shortcuts() {
  const { open, interruption, stuckness } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return

      if (e.key.toLowerCase() === 'u' && e.shiftKey) {
        e.preventDefault()
        open({ kind: 'dump' })
      }
      if (e.key.toLowerCase() === 'k' && e.shiftKey) {
        e.preventDefault()
        if (interruption.kind === 'closed') {
          open({ kind: 'companion', reason: 'manual', score: stuckness.score })
        }
      }
      if (e.key.toLowerCase() === 'f' && e.shiftKey) {
        e.preventDefault()
        navigate('/focus')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, navigate, interruption.kind, stuckness.score])

  return null
}

/**
 * The reduced-motion switch has to reach Framer as well as CSS, or the
 * floating, springing half of the app ignores it. `user` still honours the
 * operating system preference for everyone who never opens Settings.
 */
function Motion({ children }: { children: ReactNode }) {
  const { settings } = useStore()
  return <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>{children}</MotionConfig>
}

export default function App() {
  return (
    <StoreProvider>
      <Motion>
        <Shortcuts />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Overlays />
        <MochiLayer />
        {/* Mirrors Mochi onto the desktop window when running in the
            Electron shell. No-op in a plain browser. */}
        <DesktopBridge />
      </Motion>
    </StoreProvider>
  )
}
