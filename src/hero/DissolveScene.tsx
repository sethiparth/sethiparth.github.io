import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { createPaintMaterial, createRevealMaterial } from './DissolveMaterial'

const BASE_IMAGE = `${import.meta.env.BASE_URL}parth-base.jpg`
const REVEAL_IMAGE = `${import.meta.env.BASE_URL}parth-cyber.jpg`
const DEPTH_IMAGE = `${import.meta.env.BASE_URL}parth-depth.png`

interface PaintRevealProps {
  coarsePointer: boolean
  progressRef: React.RefObject<number>
}

function PaintReveal({ coarsePointer, progressRef }: PaintRevealProps) {
  const { viewport, size, gl } = useThree()

  const [base, reveal, depth] = useTexture([BASE_IMAGE, REVEAL_IMAGE, DEPTH_IMAGE])
  base.colorSpace = THREE.SRGBColorSpace
  reveal.colorSpace = THREE.SRGBColorSpace
  // Depth is linear grayscale DATA (near = white, far = black), not color —
  // must not be sRGB-decoded.
  depth.colorSpace = THREE.NoColorSpace
  depth.minFilter = THREE.LinearFilter
  depth.magFilter = THREE.LinearFilter

  const paintMat = useMemo(createPaintMaterial, [])
  const revealMat = useMemo(createRevealMaterial, [])

  // Ping-pong render targets holding the accumulated paint mask.
  const fboA = useFBO(size.width, size.height, { depthBuffer: false, stencilBuffer: false })
  const fboB = useFBO(size.width, size.height, { depthBuffer: false, stencilBuffer: false })
  const cur = useRef(0)

  // Offscreen fullscreen-quad scene for the paint pass.
  const paintScene = useMemo(() => {
    const scene = new THREE.Scene()
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), paintMat))
    return scene
  }, [paintMat])
  const paintCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), [])

  // Brush segment: p0 = last frame's point, p1 = current pointer (aspect-space).
  const p0 = useRef(new THREE.Vector2(0.5, 0.5))
  const p1 = useRef(new THREE.Vector2(0.5, 0.5))
  const painting = useRef(0)

  // Live hover circle (uv-space), smoothed for a gliding follow.
  const hoverTarget = useRef(new THREE.Vector2(0.5, 0.55))
  const hoverSmooth = useRef(new THREE.Vector2(0.5, 0.55))

  useEffect(() => {
    revealMat.uniforms.uBase.value = base
    revealMat.uniforms.uReveal.value = reveal
    revealMat.uniforms.uDepth.value = depth
  }, [base, reveal, depth, revealMat])

  useEffect(() => {
    fboA.setSize(size.width, size.height)
    fboB.setSize(size.width, size.height)
  }, [size, fboA, fboB])

  // Press-and-drag paints. On touch, a tap-drag paints just the same.
  useEffect(() => {
    const canvas = gl.domElement
    // Returns [aspect-space brush point, uv-space hover point].
    const toPoints = (e: PointerEvent): [THREE.Vector2, THREE.Vector2] => {
      const r = canvas.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width
      const ny = (e.clientY - r.top) / r.height
      return [new THREE.Vector2(nx * (r.width / r.height), 1 - ny), new THREE.Vector2(nx, 1 - ny)]
    }
    const down = (e: PointerEvent) => {
      const [brush, hover] = toPoints(e)
      p0.current.copy(brush)
      p1.current.copy(brush)
      hoverTarget.current.copy(hover)
      painting.current = 1
    }
    const move = (e: PointerEvent) => {
      const [brush, hover] = toPoints(e)
      p1.current.copy(brush)
      hoverTarget.current.copy(hover)
    }
    const up = () => {
      painting.current = 0
    }
    canvas.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl, coarsePointer])

  useFrame((state, delta) => {
    const aspect = size.width / size.height
    const read = cur.current === 0 ? fboA : fboB
    const write = cur.current === 0 ? fboB : fboA

    // On touch (no hover), drift the live circle on a slow orbit.
    if (coarsePointer) {
      const t = state.clock.elapsedTime
      hoverTarget.current.set(0.5 + Math.cos(t * 0.35) * 0.16, 0.5 + Math.sin(t * 0.5) * 0.12)
    }
    hoverSmooth.current.lerp(hoverTarget.current, 1 - Math.exp(-delta * 16))

    // --- Paint pass -> write target ---
    paintMat.uniforms.uPrev.value = read.texture
    paintMat.uniforms.uP0.value.copy(p0.current)
    paintMat.uniforms.uP1.value.copy(p1.current)
    paintMat.uniforms.uPainting.value = painting.current
    paintMat.uniforms.uAspect.value = aspect
    // Heal-back ~1.1s time constant — strokes fade quickly.
    paintMat.uniforms.uDecay.value = Math.exp(-delta / 1.1)
    paintMat.uniforms.uTime.value += delta

    gl.setRenderTarget(write)
    gl.render(paintScene, paintCam)
    gl.setRenderTarget(null)

    // --- Feed the fresh mask + live hover circle to the visible plane ---
    revealMat.uniforms.uMask.value = write.texture
    revealMat.uniforms.uMouse.value.copy(hoverSmooth.current)
    revealMat.uniforms.uProgress.value = progressRef.current ?? 0
    revealMat.uniforms.uAspect.value = aspect
    revealMat.uniforms.uFocusY.value = aspect < 1 ? 0.4 : 0.5
    revealMat.uniforms.uTime.value += delta

    // Advance the segment and swap buffers.
    p0.current.copy(p1.current)
    cur.current = 1 - cur.current
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={revealMat} attach="material" />
    </mesh>
  )
}

interface DissolveHeroProps {
  coarsePointer: boolean
  progressRef: React.RefObject<number>
}

export function DissolveHero({ coarsePointer, progressRef }: DissolveHeroProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false }}
      camera={{ position: [0, 0, 1] }}
      frameloop="always"
      className="absolute inset-0"
    >
      <PaintReveal coarsePointer={coarsePointer} progressRef={progressRef} />
    </Canvas>
  )
}

export default DissolveHero
