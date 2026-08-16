import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

/** Small shared primitives. Everything cozy-shaped and large enough to hit. */

type Tone = 'peach' | 'lilac' | 'mint' | 'butter' | 'sky' | 'plain'

const TONE_SOLID: Record<Tone, string> = {
  peach: 'bg-peach text-white hover:bg-[#f97a53]',
  lilac: 'bg-lilac text-white hover:bg-[#9678f6]',
  mint: 'bg-mint text-white hover:bg-[#43ae90]',
  butter: 'bg-butter text-[#4a3512] hover:bg-[#eaa93c]',
  sky: 'bg-sky text-white hover:bg-[#5aa8de]',
  plain: 'bg-ink text-cream hover:bg-[#494440]',
}

const TONE_SOFT: Record<Tone, string> = {
  peach: 'bg-peach-soft/70 text-[#8a3c22] hover:bg-peach-soft',
  lilac: 'bg-lilac-soft/70 text-[#553a9c] hover:bg-lilac-soft',
  mint: 'bg-mint-soft/70 text-[#1f6b56] hover:bg-mint-soft',
  butter: 'bg-butter-soft/70 text-[#795012] hover:bg-butter-soft',
  sky: 'bg-sky-soft/70 text-[#255d84] hover:bg-sky-soft',
  plain: 'bg-cream-deep/60 text-ink-soft hover:bg-cream-deep',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone
  variant?: 'solid' | 'soft' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
}

export function Button({
  tone = 'plain',
  variant = 'solid',
  size = 'md',
  block = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const sizes = {
    sm: 'px-3.5 py-2 text-sm rounded-xl gap-1.5',
    md: 'px-5 py-3 text-[0.95rem] rounded-2xl gap-2',
    lg: 'px-6 py-4 text-base rounded-2xl gap-2.5',
  }[size]

  const look =
    variant === 'solid'
      ? TONE_SOLID[tone]
      : variant === 'soft'
        ? TONE_SOFT[tone]
        : 'text-ink-soft hover:text-ink hover:bg-cream-deep/60'

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 ${sizes} ${look} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  as: As = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'aside'
}) {
  return <As className={`card p-6 ${className}`}>{children}</As>
}

export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`label-caps ${className}`}>{children}</p>
}

/**
 * The one overlay used by every interruption.
 *
 * Focus is trapped inside while open, Escape closes it (unless the flow is
 * mid-timer), and the underlying page is inert to screen readers.
 */
export function Sheet({
  open,
  onClose,
  children,
  labelledBy,
  dismissible = true,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  dismissible?: boolean
  width?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    restoreTo.current = document.activeElement
    document.body.style.overflow = 'hidden'

    // Send focus into the panel so keyboard users land in the right place.
    const t = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), textarea, input, [href], select, [tabindex]:not([tabindex="-1"])',
      )
      ;(focusable ?? panelRef.current)?.focus()
    }, 60)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return

      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null)
      if (nodes.length === 0) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      ;(restoreTo.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose, dismissible])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-[#2b211a]/35 backdrop-blur-[3px]"
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className={`card relative max-h-[92vh] w-full overflow-y-auto p-7 shadow-[var(--shadow-lift)] outline-none sm:p-9 ${width}`}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Speech bubble with a little tail, used wherever Mochi talks. */
export function SpeechBubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative rounded-3xl bg-cream-deep/80 px-6 py-4 text-center ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-tl-sm bg-cream-deep/80"
      />
      {children}
    </motion.div>
  )
}

export function Pill({
  children,
  tone = 'plain',
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${TONE_SOFT[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
