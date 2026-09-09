import { useEffect, useRef } from 'react'

/* A paint stroke you draw by holding the mouse button: a short tapering tail
   follows the drag and vanishes the instant you release. Nothing is rendered
   directly under the pointer (the visible stroke lags a couple of samples
   behind), so it never looks like a second cursor. Accent-tinted,
   pointer-events-none, fine-pointer only, disabled under prefers-reduced-motion. */

interface TrailPoint {
  x: number
  y: number
  t: number
}

const LIFE = 160 // ms a sample survives — keeps the tail brief while dragging
const MAX_POINTS = 20
const MAX_WIDTH = 7 // px near the body of the stroke
const HEAD_LAG = 2 // samples nearest the cursor left unrendered → no blob under mouse

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const finePointer = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reduced) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }
    resize()

    let painting = false
    const points: TrailPoint[] = []
    const clear = () => {
      painting = false
      points.length = 0 // release → stroke disappears on the next frame
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      painting = true
      points.length = 0
      points.push({ x: e.clientX, y: e.clientY, t: performance.now() })
    }
    const onMove = (e: PointerEvent) => {
      if (!painting) return
      points.push({ x: e.clientX, y: e.clientY, t: performance.now() })
      if (points.length > MAX_POINTS) points.shift()
    }

    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const now = performance.now()
      while (points.length && now - points[0].t > LIFE) points.shift()

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const last = points.length - 1 - HEAD_LAG // stop short of the cursor
      if (last < 1) return

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(255, 90, 30, 0.5)'
      ctx.shadowBlur = 10

      for (let i = 1; i <= last; i++) {
        const p0 = points[i - 1]
        const p1 = points[i]
        const life = 1 - Math.min((now - p1.t) / LIFE, 1) // 1 fresh → 0 dying
        const along = i / last // 0 tail → 1 toward the lagged head
        const alpha = life * along
        if (alpha <= 0) continue
        ctx.strokeStyle = `rgba(255, 122, 69, ${alpha})`
        ctx.lineWidth = MAX_WIDTH * along * life
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }
      ctx.restore()
    }
    raf = requestAnimationFrame(draw)

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', clear)
    window.addEventListener('pointercancel', clear)
    window.addEventListener('blur', clear)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', clear)
      window.removeEventListener('pointercancel', clear)
      window.removeEventListener('blur', clear)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[200]" />
}

export default CursorTrail
