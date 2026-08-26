import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Phone, Mail, ArrowDown } from 'lucide-react'
import { motion, useScroll, useMotionValueEvent, useTransform } from 'motion/react'
import { IDENTITY, CONTACT } from '../data/content'

const DissolveHero = lazy(() => import('./DissolveScene'))

const BASE_IMAGE = `${import.meta.env.BASE_URL}parth-base.jpg`
const REVEAL_IMAGE = `${import.meta.env.BASE_URL}parth-cyber.jpg`

/* ---- Concentric stat arcs: each ring carries one headline number, marked with
   a small radial tick where it sits on the arc. The 99.999% availability stat is
   intentionally left off — three rings, three numbers. --------------------- */
const CENTER = { x: -110, y: 300 }
const polar = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: CENTER.x + r * Math.cos(rad), y: CENTER.y + r * Math.sin(rad) }
}
const arcLength = (r: number, a0: number, a1: number) => (Math.abs(a1 - a0) * Math.PI * r) / 180
const ARCS = [
  { r: 330, a0: -92, a1: 16, dot: -28 },
  { r: 395, a0: -56, a1: 60, dot: -7 },
  { r: 460, a0: -14, a1: 72, dot: 8 },
]
// Numbers that ride the arcs, each with a short caption framed for a hiring
// reader: the $1B is revenue the service *enabled* (not personal), and the
// throughput is shown as the 10x gain rather than a raw "40M/hr" that reads
// oddly without context. Captions stay concise so the outer ring's label
// doesn't clip the 450-wide viewBox; dot angles are tightly banded so all
// three sit in the visible upper-right (no scrolling).
const ARC_MARKS = [
  { value: '$1B+', caption: 'Revenue enabled' },
  { value: '10×', caption: 'Email throughput' },
  { value: '556K+', caption: 'EC2 customers' },
]

function StaticHero() {
  // Non-WebGL fallback: the cyborg fades over the human, no cursor needed.
  return (
    <div className="absolute inset-0">
      <div className="hero-portrait absolute inset-0" style={{ backgroundImage: `url(${BASE_IMAGE})` }} />
      <div
        className="hero-portrait hero-static-reveal absolute inset-0"
        style={{ backgroundImage: `url(${REVEAL_IMAGE})` }}
      />
    </div>
  )
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef(0)

  const [webgl, setWebgl] = useState(false)
  const [coarse, setCoarse] = useState(false)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v
  })

  // Parallax the copy and dim the hero as it scrolls away.
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])
  // Scroll reverses the arc swoop: they rotate back out the way they came in.
  const arcExit = useTransform(scrollYProgress, [0, 0.85], [0, 26])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    const hasWebgl = (() => {
      try {
        const c = document.createElement('canvas')
        return !!(c.getContext('webgl2') || c.getContext('webgl'))
      } catch {
        return false
      }
    })()
    setCoarse(isCoarse)
    setWebgl(hasWebgl && !reduce)
  }, [])

  return (
    <section
      id="top"
      ref={sectionRef}
      className="hero-bg relative h-[100dvh] overflow-hidden"
    >
      <motion.div className="absolute inset-0" style={{ opacity: heroOpacity }}>
        {/* 1. Grid */}
        <svg className="absolute inset-0 z-0 h-full w-full" style={{ opacity: 0.1 }} aria-hidden="true">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 L 0 48" fill="none" stroke="#64748b" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* 2. Reveal — WebGL dissolve, or static crossfade fallback */}
        <div className="absolute inset-0 z-10">
          {webgl ? (
            <Suspense fallback={<StaticHero />}>
              <DissolveHero coarsePointer={coarse} progressRef={progressRef} />
            </Suspense>
          ) : (
            <StaticHero />
          )}
        </div>

        {/* 3. Legibility scrim */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />

        {/* 4. Decorative rings */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-30 hidden sm:block">
          <svg viewBox="0 0 450 700" preserveAspectRatio="xMaxYMid meet" className="h-full w-auto">
            <defs>
              {ARCS.map((a, i) => {
                const s = polar(a.r, a.a0)
                const e = polar(a.r, a.a1)
                return (
                  <linearGradient key={i} id={`arc-grad-${i}`} gradientUnits="userSpaceOnUse" x1={s.x} y1={s.y} x2={e.x} y2={e.y}>
                    <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="22%" stopColor="#fff" stopOpacity="0.5" />
                    <stop offset="55%" stopColor="#fff" stopOpacity="0.5" />
                    <stop offset="85%" stopColor="#fff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                )
              })}
            </defs>
            <motion.g
              style={{
                rotate: arcExit,
                transformBox: 'view-box',
                transformOrigin: `${CENTER.x}px ${CENTER.y}px`,
              }}
            >
            {ARCS.map((a, i) => {
              const s = polar(a.r, a.a0)
              const e = polar(a.r, a.a1)
              const d = polar(a.r, a.dot)
              const len = arcLength(a.r, a.a0, a.a1)
              const lineDelay = 0.4 + i * 0.22
              const markDelay = lineDelay + 0.9
              // Radial tick + number sitting just outside the ring at the dot.
              const tickA = polar(a.r + 4, a.dot)
              const tickB = polar(a.r + 17, a.dot)
              const label = polar(a.r + 23, a.dot)
              const mark = ARC_MARKS[i]
              const hollow = i === 1 // one mark reads as a hollow ring for rhythm
              return (
                <g
                  key={i}
                  className="arc-swoop"
                  style={{
                    transformBox: 'view-box',
                    transformOrigin: `${CENTER.x}px ${CENTER.y}px`,
                    ['--swoop-delay' as string]: `${lineDelay}s`,
                  }}
                >
                  <path
                    className="arc-line"
                    d={`M ${s.x} ${s.y} A ${a.r} ${a.r} 0 0 1 ${e.x} ${e.y}`}
                    fill="none"
                    stroke={`url(#arc-grad-${i})`}
                    strokeWidth="1.1"
                    style={{ ['--len' as string]: `${len}`, animationDelay: `${lineDelay}s` }}
                  />
                  <circle
                    className="arc-dot"
                    cx={d.x}
                    cy={d.y}
                    r="4"
                    fill={hollow ? 'none' : '#fff'}
                    stroke="#fff"
                    strokeWidth={hollow ? 1.6 : 0}
                    style={{ animationDelay: `${markDelay}s` }}
                  />
                  {mark && (
                    <g className="arc-mark" style={{ animationDelay: `${markDelay + 0.2}s` }}>
                      <line
                        x1={tickA.x}
                        y1={tickA.y}
                        x2={tickB.x}
                        y2={tickB.y}
                        stroke="#ff5a1e"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <text
                        x={label.x}
                        y={label.y - 5}
                        dx="5"
                        textAnchor="start"
                        fontFamily="var(--font-mono)"
                        fontSize="15"
                        fontWeight="600"
                        fill="#fff"
                      >
                        {mark.value}
                      </text>
                      <text
                        x={label.x}
                        y={label.y + 11}
                        dx="5"
                        textAnchor="start"
                        fontFamily="var(--font-mono)"
                        fontSize="8.5"
                        letterSpacing="0.06em"
                        fill="#fff"
                        fillOpacity="0.5"
                      >
                        {mark.caption.toUpperCase()}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
            </motion.g>
          </svg>
        </div>

        {/* 5. Copy — pointer-events-none so hover passes through to the canvas */}
        <motion.div
          style={{ y: copyY }}
          className="pointer-events-none absolute bottom-14 left-5 z-40 max-w-[320px] sm:bottom-16 sm:left-8 sm:max-w-md md:bottom-24 md:left-12"
        >
          <h1 className="hero-rise text-base font-semibold leading-snug tracking-[-0.01em] text-white sm:text-lg md:text-xl" style={{ animationDelay: '0.15s' }}>
            {IDENTITY.name} — <i className="font-normal text-white/90">{IDENTITY.role}</i>
          </h1>
          <div className="hero-rise mt-6 flex items-center gap-3" style={{ animationDelay: '0.4s' }}>
            <a
              href="#work"
              className="group pointer-events-auto relative overflow-hidden rounded-full bg-white px-7 py-3 font-semibold text-gray-900 shadow-lg shadow-black/20 transition-transform hover:scale-[1.04] active:scale-95 sm:px-8 sm:py-3.5"
            >
              <span className="relative z-10">See my work</span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>
            <a href={`tel:${CONTACT.phone}`} aria-label="Call Parth" className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border border-white/40 text-white backdrop-blur-sm transition-colors hover:bg-white/10">
              <Phone size={19} />
            </a>
            <a href={`mailto:${CONTACT.email}`} aria-label="Email Parth" className="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border border-white/40 text-white backdrop-blur-sm transition-colors hover:bg-white/10">
              <Mail size={19} />
            </a>
          </div>
        </motion.div>

        {/* 6. Scroll cue */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-40 hidden -translate-x-1/2 md:block">
          <ArrowDown size={20} className="scroll-cue text-white/60" />
        </div>
      </motion.div>
    </section>
  )
}

export default Hero
