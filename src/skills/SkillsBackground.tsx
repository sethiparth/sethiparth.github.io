import { useEffect, useRef } from 'react'
import { skillsBgVertex, skillsBgFragment } from './skillsShader'

/* Raw-WebGL flow-field background for the Skills section.

   Deliberately not R3F: a background is one fullscreen triangle, so we skip the
   scene-graph overhead and drive a tight render loop we can pause. The loop only
   runs while the section is on-screen (IntersectionObserver) and honours
   prefers-reduced-motion by painting a single static frame. If WebGL is missing
   the canvas stays blank and the CSS fallback on the section shows through. */

const MAX_DPR = 1.5

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function SkillsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, skillsBgVertex)
    const fs = compile(gl, gl.FRAGMENT_SHADER, skillsBgFragment)
    const program = gl.createProgram()
    if (!vs || !fs || !program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    // Fullscreen triangle covers the viewport with a single draw.
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'uRes')
    const uTime = gl.getUniformLocation(program, 'uTime')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    const draw = (seconds: number) => {
      gl.uniform1f(uTime, seconds)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    resize()
    window.addEventListener('resize', resize)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      draw(12) // one settled static frame, no animation
      return () => {
        window.removeEventListener('resize', resize)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }

    let raf = 0
    let start = 0
    let visible = true
    const loop = (now: number) => {
      if (!start) start = now
      resize()
      draw((now - start) / 1000)
      if (visible) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Idle the GPU whenever the section is scrolled off-screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true
          raf = requestAnimationFrame(loop)
        } else if (!entry.isIntersecting) {
          visible = false
          cancelAnimationFrame(raf)
        }
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    return () => {
      visible = false
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}

export default SkillsBackground
