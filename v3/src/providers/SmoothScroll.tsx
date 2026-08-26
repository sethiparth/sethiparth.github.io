import { useEffect, useRef, type ReactNode } from 'react'
import { ReactLenis, type LenisRef } from 'lenis/react'

/* Site-wide inertial scrolling. Lenis eases the *native* document scroll, so
   the fixed navbar and anchor links keep working with no wrapper tricks. We
   drive its RAF loop ourselves (autoRaf:false) with a single recursive loop.
   Under prefers-reduced-motion we skip Lenis entirely and fall back to native
   instant scrolling. */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let rafId = 0
    const loop = (time: number) => {
      lenisRef.current?.lenis?.raf(time)
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  if (prefersReducedMotion()) return <>{children}</>

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: 0.09, duration: 1.2, smoothWheel: true, touchMultiplier: 2 }}
    >
      {children}
    </ReactLenis>
  )
}

export default SmoothScroll
