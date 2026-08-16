import { motion } from 'framer-motion'

/**
 * Mochi — the desk companion.
 *
 * Drawn entirely in SVG so it scales cleanly from the 56px roaming size up
 * to the 150px version inside a modal, themes with the palette, and adds
 * nothing to the bundle.
 *
 * Expressions are poses, not just faces: `stretch` and `yawn` move the arms
 * and body too, because a creature that only ever changes its mouth reads as
 * a sticker rather than something alive.
 */

export type Expression =
  | 'idle'
  | 'curious'
  | 'happy'
  | 'sleepy'
  /** Ears up, eyes wide — the "hang on, something's off" beat. */
  | 'alert'
  /** Softly worried. Never disapproving. */
  | 'concerned'
  | 'yawn'
  | 'stretch'

interface Props {
  expression?: Expression
  size?: number
  /** Entrance animation — off for the small always-present versions. */
  enter?: boolean
  /** The gentle bob. Off when something else owns Mochi's position. */
  float?: boolean
  className?: string
}

const SKIN = '#FFD2BC'
const SKIN_DEEP = '#FFBEA3'
const INK = '#3A3330'
const BLUSH = '#FF9E80'

export function Companion({
  expression = 'idle',
  size = 140,
  enter = false,
  float = true,
  className = '',
}: Props) {
  const is = (...names: Expression[]) => names.includes(expression)

  const eyesClosedHappy = is('happy', 'stretch')
  const eyesClosedSleep = is('sleepy', 'yawn')
  const wideEyes = is('alert')

  // Arms: up for a stretch, waving for joy, otherwise a slow idle sway.
  const armLeft = is('stretch') ? { rotate: -72 } : is('happy') ? { rotate: [-8, -34, -8] } : { rotate: [-4, 4, -4] }
  const armRight = is('stretch') ? { rotate: 72 } : is('happy') ? { rotate: [8, 34, 8] } : { rotate: [4, -4, 4] }
  const armLoop = is('stretch') ? { duration: 0.7, ease: 'easeOut' as const } : { duration: is('happy') ? 0.9 : 5, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size * 0.92 }}
      initial={enter ? { scale: 0.4, y: 24, opacity: 0 } : false}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
    >
      <motion.div
        className="h-full w-full"
        animate={float ? { y: [0, -5, 0] } : { y: 0 }}
        transition={float ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        <motion.svg
          viewBox="0 0 120 110"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
          // A stretch makes the whole body reach upward for a moment.
          animate={is('stretch') ? { scaleY: 1.08, y: -3 } : { scaleY: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ originY: 1 }}
        >
          <defs>
            <linearGradient id="mochi-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE6D8" />
              <stop offset="100%" stopColor={SKIN} />
            </linearGradient>
            <radialGradient id="mochi-shadow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#B08268" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#B08268" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* the little shadow it floats above — scaled, not resized, so the
              browser never sees a half-initialised `rx` attribute */}
          <motion.ellipse
            cx="60"
            cy="104"
            rx="30"
            ry="7"
            fill="url(#mochi-shadow)"
            style={{ originX: '60px', originY: '104px' }}
            animate={float ? { scaleX: [1, 0.87, 1], opacity: [1, 0.78, 1] } : { scaleX: 1, opacity: 1 }}
            transition={float ? { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />

          {/* ears — they perk up when Mochi notices something */}
          <motion.g
            animate={wideEyes ? { y: -4, rotate: -3 } : { y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            style={{ originX: '60px', originY: '60px' }}
          >
            <ellipse cx="24" cy="34" rx="12.5" ry="15.5" fill={SKIN_DEEP} transform="rotate(-14 24 34)" />
            <ellipse cx="96" cy="34" rx="12.5" ry="15.5" fill={SKIN_DEEP} transform="rotate(14 96 34)" />
            <ellipse cx="24" cy="35" rx="6" ry="8" fill="#FFB49A" transform="rotate(-14 24 35)" />
            <ellipse cx="96" cy="35" rx="6" ry="8" fill="#FFB49A" transform="rotate(14 96 35)" />
          </motion.g>

          {/* arms */}
          <motion.ellipse
            cx="17"
            cy="72"
            rx="8"
            ry="11"
            fill={SKIN_DEEP}
            style={{ originX: '17px', originY: '66px' }}
            animate={armLeft}
            transition={armLoop}
          />
          <motion.ellipse
            cx="103"
            cy="72"
            rx="8"
            ry="11"
            fill={SKIN_DEEP}
            style={{ originX: '103px', originY: '66px' }}
            animate={armRight}
            transition={armLoop}
          />

          {/* body */}
          <ellipse cx="60" cy="66" rx="43" ry="38" fill="url(#mochi-body)" />

          {/* cheeks */}
          <ellipse cx="30" cy="76" rx="7.5" ry="4.6" fill={BLUSH} opacity="0.5" />
          <ellipse cx="90" cy="76" rx="7.5" ry="4.6" fill={BLUSH} opacity="0.5" />

          {/* eyes */}
          {eyesClosedSleep ? (
            <>
              <path d="M38 64 q7 6 14 0" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
              <path d="M68 64 q7 6 14 0" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
            </>
          ) : eyesClosedHappy ? (
            <>
              <path d="M38 66 q7 -8 14 0" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
              <path d="M68 66 q7 -8 14 0" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <motion.g
              className={wideEyes ? undefined : 'mochi-blink'}
              animate={wideEyes ? { scale: 1.18 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 340, damping: 16 }}
              style={{ originX: '60px', originY: '63px' }}
            >
              <circle cx="45" cy="63" r="6.4" fill={INK} />
              <circle cx="75" cy="63" r="6.4" fill={INK} />
              <circle cx="47.4" cy="60.6" r="2.2" fill="#fff" />
              <circle cx="77.4" cy="60.6" r="2.2" fill="#fff" />
            </motion.g>
          )}

          {/* mouth */}
          {is('yawn') ? (
            <motion.ellipse
              cx="60"
              cy="82"
              rx="7"
              ry="9"
              fill={INK}
              opacity="0.8"
              style={{ originX: '60px', originY: '78px' }}
              animate={{ scaleY: [0.25, 1, 0.25] }}
              transition={{ duration: 2.4, ease: 'easeInOut' }}
            />
          ) : is('curious', 'alert') ? (
            <ellipse cx="60" cy="80" rx="4.6" ry="5.4" fill={INK} opacity="0.85" />
          ) : is('happy') ? (
            <path d="M50 78 q10 12 20 0 q-10 5 -20 0" fill={INK} opacity="0.85" />
          ) : is('concerned') ? (
            <path d="M52 82 q8 -5 16 0" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : is('sleepy') ? (
            <path d="M55 80 q5 4 10 0" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M51 79 q9 8 18 0" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
          )}

          {/* brows */}
          {is('curious') && (
            <motion.path
              d="M38 50 q7 -4 13 -1"
              stroke={INK}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              animate={{ y: [0, -2.5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {is('concerned') && (
            <>
              <path d="M37 51 q7 2 13 5" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M83 51 q-7 2 -13 5" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* the "!" that sells noticing */}
          {is('alert') && (
            <motion.g
              initial={{ scale: 0, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 12 }}
            >
              <rect x="97" y="6" width="5" height="14" rx="2.5" fill="#FF8A65" />
              <circle cx="99.5" cy="25" r="3" fill="#FF8A65" />
            </motion.g>
          )}

          {(is('sleepy') || is('yawn')) && (
            <motion.text
              x="96"
              y="30"
              fontSize="15"
              fill={INK}
              opacity="0.45"
              animate={{ y: [30, 20], opacity: [0, 0.45, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            >
              z
            </motion.text>
          )}

          {is('happy') && (
            <>
              <motion.g
                animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '12px', originY: '26px' }}
              >
                <path d="M12 20 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2z" fill="#F5B74E" />
              </motion.g>
              <motion.g
                animate={{ scale: [1, 0.55, 1], opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                style={{ originX: '106px', originY: '18px' }}
              >
                <path d="M106 13 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8z" fill="#A78BFA" />
              </motion.g>
            </>
          )}
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}

/* Blink lives in index.css as `.mochi-blink` — plain CSS so it stays cheap
   with several Mochis on screen and honours reduced motion for free. */
