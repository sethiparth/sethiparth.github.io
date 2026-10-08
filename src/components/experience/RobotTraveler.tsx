import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

/* ==========================================================================
   RobotTraveler — the EVA-style hovering robot that travels the career path.

   Three short clips (Veo-generated, pure-black background) ship in two formats:
   a WebM VP9 with a REAL alpha channel (black luma-keyed to transparent) for
   Chrome/Firefox/Edge, and a crushed MP4 fallback (black dropped by
   `mix-blend-mode: screen`) for Safari, which has no VP9-alpha support. Either
   way only the lit robot shows — no black box. They are layered and cross-faded
   by opacity rather than swapping one <video> src (a src change reflashes;
   toggling opacity on already-decoded elements is instant):

   - walk  → the traveler itself. NOT played — it is *scrubbed*: every frame we
             set currentTime from scroll progress, so it bobs forward as you
             scroll down and in reverse as you scroll up.
   - point → idle gesture: when scrolling stops on a chapter, it plays (looped).
   - grab  → plays while you pick the robot up and drag it; on release Motion's
             dragSnapToOrigin springs it back onto its path.
   ========================================================================== */

const MEDIA = (f: string) => `${import.meta.env.BASE_URL}media/${f}`
// [webm-with-alpha, mp4-fallback] per clip — browser picks the first it can play.
const CLIPS = {
  walk: [MEDIA('robot-walk.webm'), MEDIA('robot-walk.mp4')],
  point: [MEDIA('robot-point.webm'), MEDIA('robot-point.mp4')],
  grab: [MEDIA('robot-grab.webm'), MEDIA('robot-grab.mp4')],
} as const

const MOVE_EPS = 0.0002 // scroll delta below this counts as idle
const IDLE_FRAMES = 42 // ~0.7s at 60fps before the idle "point" gesture kicks in
const SCRUB_EASE = 0.18 // per-frame lerp toward the scroll target — smooths the stride
// Asymmetric cross-fades: the robot must SNAP awake the instant you scroll (short
// fade into walk), but SETTLE gently when you stop or grab it (long fade). The CSS
// transition duration is overridden per handoff from JS.
const FADE_IN_WALK = 170 // scroll begins → crisp handoff into the walking clip
const FADE_TO_IDLE = 480 // scroll stops → ease into the point gesture
const FADE_GRAB = 240 // pick-up / release → responsive but soft
const TAP_GRAB_MS = 1200 // touch: how long a tap holds the grab clip

// WebKit decodes VP9 but drops its alpha channel (black box), so Safari/iOS
// gets the mp4 only and relies on a screen blend to key out the black.
const noWebmAlpha = () =>
  typeof navigator !== 'undefined' &&
  (navigator.vendor === 'Apple Computer, Inc.' ||
    /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent))

// iOS only honours inline, muted playback when both the property and the
// (legacy) attribute are set before play().
function prepareInline(el: HTMLVideoElement | null) {
  if (!el) return
  el.muted = true
  el.setAttribute('webkit-playsinline', '')
  el.setAttribute('playsinline', '')
}

// Touch devices: motion's `drag` sets touch-action:none, which would trap page
// scroll under the thumb, so we swap drag for tap-to-grab there.
const isCoarsePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches

type Mode = 'walk' | 'point' | 'grab'

interface RobotTravelerProps {
  progressRef: React.RefObject<number>
}

export function RobotTraveler({ progressRef }: RobotTravelerProps) {
  const walkRef = useRef<HTMLVideoElement>(null)
  const pointRef = useRef<HTMLVideoElement>(null)
  const grabRef = useRef<HTMLVideoElement>(null)
  const mode = useRef<Mode>('walk')
  const dragging = useRef(false)
  const tapTimer = useRef(0)
  const [coarse] = useState(isCoarsePointer)
  const [mp4Only] = useState(noWebmAlpha)

  // Imperatively cross-fade / play-pause the clips from a rAF loop so the
  // scroll scrub never triggers a React re-render.
  useEffect(() => {
    const walk = walkRef.current
    const point = pointRef.current
    const grab = grabRef.current
    if (!walk) return

    ;[walk, point, grab].forEach(prepareInline)

    // iOS Safari paints no frame for a never-played video and ignores
    // currentTime before metadata: play-then-pause once to prime the decoder.
    const prime = () => {
      walk.play().then(() => walk.pause()).catch(() => {})
    }
    if (walk.readyState === 0) walk.load()
    if (walk.readyState >= 1) prime()
    else walk.addEventListener('loadedmetadata', prime, { once: true })

    // point & grab hover-loop continuously; we only cross-fade their opacity and
    // never reset currentTime, so a switch dissolves mid-loop (pose stays
    // continuous) rather than snapping to the gesture's first frame.
    ;[point, grab].forEach((el) => {
      if (el) {
        el.loop = true
        void el.play().catch(() => {})
      }
    })
    walk.style.opacity = '1' // start on the walk clip

    let walkFadeTimer = 0
    const show = (m: Mode) => {
      if (mode.current === m) return
      const prev = mode.current
      mode.current = m
      const dur = m === 'walk' ? FADE_IN_WALK : FADE_TO_IDLE
      // Drive the fade length per handoff so entering walk is snappy and settling
      // into the idle gesture is gentle. Both layers share the duration so the
      // cross-fade stays symmetric in time.
      ;[walk, point, grab].forEach((el) => {
        if (el) el.style.transitionDuration = `${dur}ms`
      })
      walk.style.opacity = m === 'walk' ? '1' : '0'
      if (point) point.style.opacity = m === 'point' ? '1' : '0'
      if (grab) grab.style.opacity = m === 'grab' ? '1' : '0'
      // Leaving walk: play it *through* the dissolve so we never fade from a
      // frozen stride into a live gesture; pause once it is fully hidden.
      if (prev === 'walk' && m !== 'walk') {
        void walk.play().catch(() => {})
        clearTimeout(walkFadeTimer)
        walkFadeTimer = window.setTimeout(() => {
          if (mode.current !== 'walk') walk.pause()
        }, dur)
      }
    }

    let raf = 0
    let last = progressRef.current ?? 0
    let idle = 0
    let smoothed = walk.currentTime // eased scrub position, chases the target
    const tick = () => {
      const p = Math.min(1, Math.max(0, progressRef.current ?? 0))
      const dp = p - last
      last = p

      // Scrub the walk clip to scroll position, but only while walk is the shown
      // layer — when hidden it is either playing out the dissolve or paused, and
      // must not fight that. Chase the target via a per-frame lerp (not a snap)
      // so the stride glides even if scroll arrives in coarse steps.
      if (mode.current === 'walk' && walk.duration) {
        const target = p * walk.duration
        smoothed += (target - smoothed) * SCRUB_EASE
        if (Math.abs(smoothed - walk.currentTime) > 0.01) walk.currentTime = smoothed
      }

      // Mode selection: drag wins; else scrolling shows walk; else dwell → point.
      if (!dragging.current) {
        if (Math.abs(dp) > MOVE_EPS) {
          idle = 0
          if (mode.current !== 'walk') smoothed = p * (walk.duration || 0) // resync before scrub resumes
          show('walk')
        } else if (++idle > IDLE_FRAMES) {
          show('point')
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(walkFadeTimer)
      clearTimeout(tapTimer.current)
      walk.removeEventListener('loadedmetadata', prime)
    }
  }, [progressRef])

  const startGrab = () => {
    dragging.current = true
    const prev = mode.current
    mode.current = 'grab'
    const g = grabRef.current
    const w = walkRef.current
    const pt = pointRef.current
    ;[w, pt, g].forEach((el) => {
      if (el) el.style.transitionDuration = `${FADE_GRAB}ms`
    })
    if (g) g.style.opacity = '1' // already hover-looping — just fade it in
    if (pt) pt.style.opacity = '0'
    if (w) {
      w.style.opacity = '0'
      // Same trick as show(): keep walk moving through the dissolve, then pause.
      if (prev === 'walk') {
        void w.play().catch(() => {})
        window.setTimeout(() => {
          if (mode.current !== 'walk') w.pause()
        }, FADE_GRAB)
      }
    }
  }

  const endGrab = () => {
    dragging.current = false
    mode.current = 'walk'
    const g = grabRef.current
    const w = walkRef.current
    // Release snaps back to the path with the crisp walk fade.
    ;[w, g].forEach((el) => {
      if (el) el.style.transitionDuration = `${FADE_IN_WALK}ms`
    })
    if (g) g.style.opacity = '0' // keep it looping under the hood for next grab
    if (w) w.style.opacity = '1'
  }

  const onTap = () => {
    clearTimeout(tapTimer.current)
    startGrab()
    tapTimer.current = window.setTimeout(endGrab, TAP_GRAB_MS)
  }

  const dragProps = coarse
    ? ({ drag: false, onTap } as const)
    : ({
        drag: true,
        dragSnapToOrigin: true,
        dragMomentum: false,
        dragElastic: 0.35,
        whileDrag: { scale: 1.06 },
        onDragStart: startGrab,
        onDragEnd: endGrab,
      } as const)

  return (
    <motion.div
      className="journey-robot-fig"
      data-blend={mp4Only ? 'screen' : undefined}
      {...dragProps}
    >
      <video ref={walkRef} muted playsInline webkit-playsinline="" preload="auto" aria-hidden="true">
        {!mp4Only && <source src={CLIPS.walk[0]} type="video/webm" />}
        <source src={CLIPS.walk[1]} type="video/mp4" />
      </video>
      <video ref={pointRef} muted playsInline webkit-playsinline="" loop preload="auto" aria-hidden="true">
        {!mp4Only && <source src={CLIPS.point[0]} type="video/webm" />}
        <source src={CLIPS.point[1]} type="video/mp4" />
      </video>
      <video ref={grabRef} muted playsInline webkit-playsinline="" loop preload="auto" aria-hidden="true">
        {!mp4Only && <source src={CLIPS.grab[0]} type="video/webm" />}
        <source src={CLIPS.grab[1]} type="video/mp4" />
      </video>
    </motion.div>
  )
}

export default RobotTraveler
