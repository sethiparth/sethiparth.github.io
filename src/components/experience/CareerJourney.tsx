import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
  type MotionValue,
} from 'motion/react'
import { createPortal } from 'react-dom'
import { useLenis } from 'lenis/react'
import { WAYPOINTS, type Waypoint } from './journey-data'

const RobotTraveler = lazy(() => import('./RobotTraveler'))

// Spacing between waypoint cells, as a fraction of viewport width. Narrower
// than a full screen so the previous and next employers flank the active one —
// visible but smaller. Cell i sits at (i·SPACING + 0.5)·vw in strip space and
// reaches frame-centre when the strip is translated -i·SPACING·vw.
const SPACING = 0.4
// Portrait phones: one monolith dominates, neighbours only peek at the edges.
const SPACING_COMPACT = 0.82

// Where the active waypoint rests horizontally, as a %-of-viewport. Not dead
// centre (50) but the midpoint of the visible GAP between the robot (its body
// ends ~21vw) and the dossier's near edge (~53vw), so the open billboard sits
// balanced in the space between the pair rather than crowding the tile.
const FRAME_CENTER = 37
const FRAME_CENTER_COMPACT = 50

const COMPACT_QUERY = '(max-width: 767px)'
const SHEET_ID = 'journey-dossier-sheet'

/* Live `compact` flag + viewport width. Width is only committed when it really
   changes, so iOS address-bar height resizes don't re-render the journey. */
function useViewport() {
  const read = () => ({
    vw: typeof window === 'undefined' ? 1440 : window.innerWidth,
    compact: typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches,
  })
  const [state, setState] = useState(read)
  useEffect(() => {
    const sync = () => {
      const next = read()
      setState((prev) => (prev.vw === next.vw && prev.compact === next.compact ? prev : next))
    }
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [])
  return state
}

/* ==========================================================================
   Career Journey — a scroll-pinned 2.5-D world the traveler walks backward
   through in time. Built entirely from the site's own vocabulary: a perspective
   grid terrain, an ember horizon glow, a glowing trajectory line, glass-panel
   "monolith" billboards carrying each employer's mark, and a diamond-core drone
   traveler that hovers at frame-centre while the world slides past it.

   Motion contract (matches the hero):
   - ONE scroll authority (useScroll on the outer section) drives everything.
   - Layer positions bind straight to MotionValues via `style` → no re-renders.
   - Only the discrete "which dossier is open" commits to React state, at
     waypoint-boundary crossings, so 60fps holds throughout.
   Linear mapping only — Lenis is the sole smoothing; stacking a spring here
   would rubber-band the scrub.
   ========================================================================== */

const N = WAYPOINTS.length
const pad = (n: number) => String(n).padStart(2, '0')

/* Motion's scroll-linked WAAPI path treats a useTransform *input* range as the
   animation's keyframe offsets, so every input value MUST land in [0,1] and stay
   strictly increasing. Edge waypoints (centre 0 or 1) would otherwise spill
   past those bounds. Clamp inputs into [0,1]; where several collapse onto the
   same clamped value, keep the stop whose original input is nearest `centre`,
   which preserves the peak (opacity/scale) or trough (y) at arrival. */
function clampStops(stops: Array<[number, number]>, centre: number) {
  const best = new Map<number, { out: number; dist: number }>()
  for (const [input, out] of stops) {
    const key = Math.min(1, Math.max(0, input))
    const dist = Math.abs(input - centre)
    const cur = best.get(key)
    if (!cur || dist < cur.dist) best.set(key, { out, dist })
  }
  const inputs = [...best.keys()].sort((a, b) => a - b)
  const outputs = inputs.map((i) => best.get(i)!.out)
  if (inputs.length < 2) {
    inputs.push(Math.min(1, inputs[0] + 1e-4))
    outputs.push(outputs[0])
  }
  return { inputs, outputs }
}

export function CareerJourney() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  // Cheap per-frame scroll read for the R3F walk-scrub — no React re-render.
  const progressRef = useRef(0)

  // Layer translation is driven in PIXELS off a measured viewport width. Motion's
  // WAAPI path rejects percentage-string keyframes bound to `x`, so we keep every
  // scroll-linked style value numeric. Cell i (centre at (i+0.5)·vw) reaches
  // frame-centre when the strip is translated -i·vw — landing at progress i/(N-1).
  const { vw, compact } = useViewport()
  const spacing = compact ? SPACING_COMPACT : SPACING
  const frameCenter = compact ? FRAME_CENTER_COMPACT : FRAME_CENTER

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // World + parallax layers — differential translate rates create depth.
  const stripX = useTransform(scrollYProgress, [0, 1], [0, -(N - 1) * spacing * vw]) // world
  const skyX = useTransform(scrollYProgress, [0, 1], [0, -0.32 * vw]) // far → slow
  const floorX = useTransform(scrollYProgress, [0, 1], [0, -3.2 * vw]) // near → fast

  // Commit the active waypoint (React state) only at cell crossings; feed the
  // continuous value to the robot's scroll-scrub ref every change.
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v
    const idx = Math.min(N - 1, Math.max(0, Math.round(v * (N - 1))))
    setActive((prev) => (prev === idx ? prev : idx))
  })

  const wp = WAYPOINTS[active]

  // Phones: the dossier is a modal sheet the active tile opens. `sheetOpen` is
  // false the moment the viewport leaves compact, which runs the effect cleanup.
  const [open, setOpen] = useState(false)
  const sheetOpen = open && compact
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const lenis = useLenis()

  const openSheet = useCallback(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null
    setOpen(true)
  }, [])

  // Close through history when our entry is on top, so the back stack stays
  // balanced; the popstate listener then flips the state.
  const closeSheet = useCallback(() => {
    if (window.history.state?.journeyDossier) window.history.back()
    else setOpen(false)
  }, [])

  useEffect(() => {
    if (!sheetOpen) return
    const onPop = () => setOpen(false)
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet()
    }
    window.history.pushState({ journeyDossier: true }, '')
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)

    // Lock page scroll. Only <html> gets overflow:hidden: adding it to <body> too
    // turns body into its own scroller, which breaks the sticky stage mid-journey.
    // Lenis intercepts wheel/touch, so stop it as well.
    const html = document.documentElement
    const prevHtml = html.style.overflow
    html.style.overflow = 'hidden'
    lenis?.stop()
    closeBtnRef.current?.focus({ preventScroll: true })

    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
      html.style.overflow = prevHtml
      lenis?.start()
      // Unmount / compact flip while open: drop our history entry if it's still there.
      if (window.history.state?.journeyDossier) window.history.back()
      returnFocusRef.current?.focus({ preventScroll: true })
    }
  }, [sheetOpen, closeSheet, lenis])

  return (
    <section
      id="experience"
      ref={sectionRef}
      className={`journey-section${compact ? ' is-compact' : ''}`}
      data-dossier-open={compact ? String(sheetOpen) : undefined}
      aria-label="Career journey"
    >
      {/* Anchor the nav's "Education" jump roughly where UF enters (index 3). */}
      <span id="education" className="journey-edu-anchor" aria-hidden="true" />

      <div className="journey-stage">
        {/* 1 — deep sky: stars + ember nebula, slow parallax */}
        <motion.div className="journey-sky" style={{ x: skyX }} aria-hidden="true" />

        {/* 2 — ember horizon glow band */}
        <div className="journey-horizon" aria-hidden="true" />

        {/* 3 — perspective grid terrain, fast parallax. Tilt lives on the static
            plane; the inner grid rides a real `x` transform (never a CSS-var
            MotionValue, which trips WAAPI keyframe generation). */}
        <div className="journey-floor-plane" aria-hidden="true">
          <motion.div className="journey-floor-grid" style={{ x: floorX }} />
        </div>

        {/* 4 — the world strip: trajectory line + monoliths */}
        <motion.div className="journey-strip" style={{ x: stripX }}>
          <div className="journey-line" aria-hidden="true" />
          {WAYPOINTS.map((w, i) => (
            <Monolith
              key={w.id}
              wp={w}
              index={i}
              progress={scrollYProgress}
              spacing={spacing}
              frameCenter={frameCenter}
              tappable={compact && i === active}
              expanded={sheetOpen}
              onOpen={openSheet}
            />
          ))}
        </motion.div>

        {/* 5 — the traveler: a rigged 3D robot walking in place at frame-centre,
            its stride scrubbed by scroll, while the world flows past behind it. */}
        <div className="journey-robot" aria-hidden="true">
          <Suspense fallback={null}>
            <RobotTraveler progressRef={progressRef} />
          </Suspense>
        </div>

        {/* 6 — dossier: the arrival detail panel, crossfading per waypoint. The
            wrap widens for bullet-heavy roles so the 2-column list reads short. */}
        {compact ? (
          // Portalled to <body>: the sticky stage is its own stacking context, so a
          // fixed sheet inside it could never layer above the site nav.
          createPortal(
          <AnimatePresence>
            {sheetOpen && (
              <motion.div
                key="backdrop"
                className="journey-sheet-backdrop"
                onClick={closeSheet}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              />
            )}
            {sheetOpen && (
              <motion.div
                key="sheet"
                id={SHEET_ID}
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-label={`${wp.name} details`}
                data-lenis-prevent
                className="journey-dossier-wrap is-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="journey-sheet-close"
                  aria-label="Close details"
                  onClick={closeSheet}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <AnimatePresence mode="wait">
                  <Dossier key={wp.id} wp={wp} index={active} compact={compact} />
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
          )
        ) : (
          <div className={`journey-dossier-wrap${wp.lines.length > 2 ? ' is-wide' : ''}`}>
            <AnimatePresence mode="wait">
              <Dossier key={wp.id} wp={wp} index={active} compact={compact} />
            </AnimatePresence>
          </div>
        )}

        {/* 7 — progress rail + chapter counter */}
        <ProgressRail progress={scrollYProgress} active={active} />

        {/* Scroll hint, fades out once past the first waypoint. */}
        <div
          className="journey-hint label-mono"
          style={{ opacity: active === 0 ? 1 : 0 }}
          aria-hidden="true"
        >
          Scroll to travel back
        </div>
      </div>
    </section>
  )
}

/* --- One monolith billboard. Owns its own entrance transform keyed to the
   scroll window around its centre (progress = index/(N-1)), so it rises, brightens
   and settles as it nears frame-centre and recedes as it passes. ------------- */
interface MonolithProps {
  wp: Waypoint
  index: number
  progress: MotionValue<number>
  spacing: number
  frameCenter: number
  tappable: boolean
  expanded: boolean
  onOpen: () => void
}

function Monolith({
  wp,
  index,
  progress,
  spacing,
  frameCenter,
  tappable,
  expanded,
  onOpen,
}: MonolithProps) {
  const center = index / (N - 1)
  const step = 1 / (N - 1) // progress-distance to the adjacent waypoint

  // Neighbours stay visible (opacity ~0.5, scale ~0.6) so the previous and next
  // employers flank the active one, smaller. Input ranges are clamped into
  // [0,1] (see clampStops); `x: '-50%'` centres the slab over its cell anchor.
  const oStops = clampStops(
    [
      [center - 1.6 * step, 0],
      [center - step, 0.5],
      [center, 1],
      [center + step, 0.5],
      [center + 1.6 * step, 0],
    ],
    center,
  )
  const yStops = clampStops(
    [
      [center - step, 14],
      [center, 0],
      [center + step, 14],
    ],
    center,
  )
  const sStops = clampStops(
    [
      [center - step, 0.6],
      [center, 1],
      [center + step, 0.6],
    ],
    center,
  )
  const opacity = useTransform(progress, oStops.inputs, oStops.outputs)
  const y = useTransform(progress, yStops.inputs, yStops.outputs)
  const scale = useTransform(progress, sStops.inputs, sStops.outputs)

  // Active tile on phones is a real button that opens the dossier sheet.
  const tapProps = tappable
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': `View details for ${wp.name}`,
        'aria-expanded': expanded,
        'aria-controls': SHEET_ID,
        onClick: onOpen,
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        },
      }
    : {}

  return (
    <motion.div
      className={`journey-monolith${tappable ? ' is-tappable' : ''}`}
      {...tapProps}
      style={{ left: `${index * spacing * 100 + frameCenter}vw`, x: '-50%', opacity, y, scale }}
    >
      {/* node where the monolith meets the trajectory line */}
      <span className="journey-node" />

      {/* The slab carries the brand mark, the name, and the dates — the metric
          stat and index were dropped to keep the billboard clean. */}
      <div className="journey-slab glass-panel">
        <div className="journey-mark">
          {wp.logo ? (
            <img src={wp.logo} alt={`${wp.name} logo`} loading="lazy" draggable={false} />
          ) : (
            <span className="journey-wordmark">{wp.wordmark}</span>
          )}
        </div>

        <span className="journey-name">{wp.name}</span>
        <span className="journey-period label-mono">{wp.period}</span>
      </div>

      {tappable && <span className="journey-tap-hint label-mono">Tap for details</span>}
    </motion.div>
  )
}

/* --- Dossier: the arrival panel. Crossfades in as each waypoint takes centre.
   Shares the Work-tile vocabulary: a cursor spotlight, a 3-D pointer tilt, a
   faded ghost numeral, and the accent keyline that sweeps the top on hover.
   Two layers: the outer motion.div owns the enter/exit (its transform is
   Motion's); the inner <article> owns the tilt transform, so they never clash. */
interface DossierProps {
  wp: Waypoint
  index: number
  compact: boolean
}

/* Render **bold** spans in a dossier line as emphasized keywords. Splitting on a
   capturing group keeps odd indices = the bolded text, even = plain runs. */
function emphasize(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="journey-kw">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function Dossier({ wp, index, compact }: DossierProps) {
  const twoCol = !compact && wp.lines.length > 2

  function onMove(e: MouseEvent<HTMLElement>) {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
    el.style.setProperty('--ry', `${(px - 0.5) * 6}deg`) // yaw ← horizontal
    el.style.setProperty('--rx', `${(0.5 - py) * 6}deg`) // pitch ← vertical
  }

  function onLeave(e: MouseEvent<HTMLElement>) {
    const el = e.currentTarget
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <motion.div
      className="journey-dossier-anim"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <article
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="journey-dossier glass-panel project-tile spotlight-card group relative overflow-hidden rounded-[20px] hover:border-accent/40"
      >
        <span aria-hidden="true" className="tile-ghost pointer-events-none absolute right-4 top-2 select-none">
          {pad(index + 1)}
        </span>

        <div className="relative z-10">
          <p className="label-mono text-accent">
            {wp.kind === 'edu' ? 'Education' : 'Experience'}
          </p>
          <h3 className="journey-dossier-name">{wp.name}</h3>
          <p className="journey-dossier-role">{wp.role}</p>
          <div className="journey-dossier-meta label-mono">
            <span>{wp.period}</span>
            <span aria-hidden="true">·</span>
            <span>{wp.location}</span>
          </div>
          <ul className={`journey-dossier-lines${twoCol ? ' journey-dossier-lines--2col' : ''}`}>
            {wp.lines.map((line, i) => (
              <li key={i}>{emphasize(line)}</li>
            ))}
          </ul>
        </div>
      </article>
    </motion.div>
  )
}

/* --- Thin progress rail + chapter counter, top-right. --------------------- */
function ProgressRail({ progress, active }: { progress: MotionValue<number>; active: number }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1])
  return (
    <div className="journey-rail" aria-hidden="true">
      <span className="journey-rail-count label-mono">
        {pad(active + 1)} <span className="journey-rail-total">/ {pad(N)}</span>
      </span>
      <div className="journey-rail-track">
        <motion.div className="journey-rail-fill" style={{ scaleX }} />
      </div>
    </div>
  )
}

export default CareerJourney
