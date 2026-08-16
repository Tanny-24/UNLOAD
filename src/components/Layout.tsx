import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { Pill } from './ui'
import { useStore } from '../state/store'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/focus', label: 'Focus' },
  { to: '/settings', label: 'Settings' },
]

/** Soft drifting colour behind everything. Purely decorative. */
function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="bg-peach-soft/45 animate-drift absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full blur-[110px]" />
      <div
        className="bg-lilac-soft/45 animate-drift absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full blur-[110px]"
        style={{ animationDelay: '-8s' }}
      />
      <div
        className="bg-mint-soft/40 animate-drift absolute -bottom-52 left-1/3 h-[28rem] w-[28rem] rounded-full blur-[110px]"
        style={{ animationDelay: '-15s' }}
      />
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { aiStatus, settings, session } = useStore()
  const location = useLocation()

  return (
    <>
      <Backdrop />

      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl tracking-tight">UNLOAD</span>
            <span className="text-ink-faint hidden text-xs sm:inline">unload your mind</span>
          </div>

          <nav aria-label="Main" className="bg-paper/70 flex items-center gap-1 rounded-full p-1 backdrop-blur-sm">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="bg-cream-deep absolute inset-0 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                    <span className="relative">{link.label}</span>
                    {link.to === '/focus' && session.active && (
                      <span
                        className="bg-peach absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                        aria-label="session running"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {settings.demoMode && <Pill tone="butter">Demo mode</Pill>}
            <Pill tone={aiStatus.mode === 'model' ? 'lilac' : 'plain'}>
              {aiStatus.mode === 'checking' ? '…' : aiStatus.mode === 'model' ? `AI · ${aiStatus.provider}` : 'Local mode'}
            </Pill>
          </div>
        </header>

        <motion.main
          id="main"
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex-1 pb-16"
        >
          {children}
        </motion.main>

        <footer className="text-ink-faint border-cream-deep/70 border-t py-6 text-xs">
          🔒 No webcam. No microphone. No screenshots. No record of what you type. Everything stays on this machine.
        </footer>
      </div>
    </>
  )
}
