import * as THREE from 'three'

/* Press-to-paint reveal.

   Two shader passes:
   1. PAINT (offscreen, ping-pong FBO) — accumulates a brush mask. Each frame it
      reads the previous mask, decays it slightly (so paint heals back), and
      stamps the current brush segment (a capsule from last point to this point)
      with bristle-noise frayed edges. max() keeps overlapping strokes clean.
   2. REVEAL (on-screen plane) — mixes the human portrait into the cyborg
      wherever the mask is painted, with a warm rim glint on the wet edge. */

const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const planeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Ashima Arts 2D simplex noise (MIT).
const noiseGLSL = /* glsl */ `
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`

const paintFragment = /* glsl */ `
  precision highp float;
  ${noiseGLSL}
  uniform sampler2D uPrev;   // previous accumulated mask
  uniform vec2 uP0;          // segment start (aspect-space, y-up)
  uniform vec2 uP1;          // segment end
  uniform float uPainting;   // 1 while the button is held, else 0
  uniform float uRadius;     // brush half-width
  uniform float uAspect;     // screen w / h
  uniform float uDecay;      // per-frame heal-back multiplier
  uniform float uTime;
  varying vec2 vUv;

  // Distance from point p to segment a-b.
  float sdSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    float prev = texture2D(uPrev, vUv).r * uDecay;

    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    vec2 seg = uP1 - uP0;
    vec2 t = length(seg) > 1e-4 ? normalize(seg) : vec2(1.0, 0.0);
    vec2 perp = vec2(-t.y, t.x);
    float along = dot(p - uP0, t);
    float across = dot(p - uP0, perp);

    // Bristle streaks running along the stroke -> painted, hairy edge.
    float bristle = snoise(vec2(along * 7.0 + uTime * 0.3, across * 34.0)) * 0.5
                  + snoise(vec2(along * 15.0, across * 70.0)) * 0.25;

    float sd = sdSeg(p, uP0, uP1) + bristle * 0.02;
    float stamp = (1.0 - smoothstep(uRadius * 0.45, uRadius, sd)) * uPainting;

    float mask = max(prev, stamp);
    gl_FragColor = vec4(mask, 0.0, 0.0, 1.0);
  }
`

const revealFragment = /* glsl */ `
  precision highp float;
  ${noiseGLSL}
  uniform sampler2D uBase;
  uniform sampler2D uReveal;
  uniform sampler2D uMask;      // accumulated painted strokes
  uniform sampler2D uDepth;     // grayscale depth map, NEAR = white(1.0), FAR = black(0.0)
  uniform float uDepthScale;    // reconstructed-normal strength
  uniform float uWrap;          // how much the ring edge bows over the 3D form
  uniform vec2 uMouse;          // cursor, uv-space y-up (live hover circle)
  uniform float uHoverRadius;   // small always-on reveal disc
  uniform float uProgress;      // 0..1 scroll -> grow the circle
  uniform float uAspect;
  uniform float uImageAspect;
  uniform float uFocusY;
  uniform float uTime;
  varying vec2 vUv;

  // Object-fit: cover, anchored on uFocusY.
  vec2 coverUv(vec2 uv) {
    vec2 o = uv;
    if (uAspect > uImageAspect) {
      o.y = (uv.y - 0.5) * (uImageAspect / uAspect) + uFocusY;
    } else {
      o.x = (uv.x - 0.5) * (uAspect / uImageAspect) + 0.5;
    }
    return o;
  }

  void main() {
    vec2 cuv = coverUv(vUv);
    vec3 baseColor = texture2D(uBase, cuv).rgb;
    vec3 revealColor = texture2D(uReveal, cuv).rgb;

    // Subject matte: the two portraits share a background, so wherever they
    // differ IS the body. Confines the whole effect to Parth, not the orange.
    float subject = smoothstep(0.03, 0.10, distance(baseColor, revealColor));

    // Painted strokes (persist + heal) from the accumulation buffer.
    float paint = smoothstep(0.12, 0.55, texture2D(uMask, vUv).r);

    // Depth-driven surface normal (grayscale height field, near = white).
    // Blank/null depth texture samples ~0 everywhere -> gradients cancel to
    // zero -> N settles to (0,0,1), so everything below degrades gracefully
    // to the original flat behavior.
    vec2 tx = vec2(0.0016);
    float dR = texture2D(uDepth, cuv + vec2(tx.x, 0.0)).r;
    float dL = texture2D(uDepth, cuv - vec2(tx.x, 0.0)).r;
    float dU = texture2D(uDepth, cuv + vec2(0.0, tx.y)).r;
    float dD = texture2D(uDepth, cuv - vec2(0.0, tx.y)).r;
    vec3 N = normalize(vec3((dL - dR) * uDepthScale, (dD - dU) * uDepthScale, 1.0));

    // Live hover circle — always on, leaves no trail. Grows with scroll.
    // The distance field is offset by the surface normal so the ring edge
    // wraps over 3D form (nose/jaw/shoulders) instead of staying a flat disc.
    vec2 d = vec2((vUv.x - uMouse.x) * uAspect, vUv.y - uMouse.y);
    d += N.xy * uWrap;
    float hd = length(d) + snoise(vUv * 6.5 + uTime * 0.15) * 0.03;
    float r = uHoverRadius + uProgress * 2.4;      // scroll swells the circle bigger
    float e = 0.045 + uProgress * 0.32;            // and softens its edge
    float hover = 1.0 - smoothstep(r - e, r + e, hd);
    // As it swells, dissolve it out fast so the base layer shows through.
    hover *= 1.0 - smoothstep(0.04, 0.42, uProgress);

    float reveal = max(paint, hover) * subject;
    vec3 color = mix(baseColor, revealColor, reveal);

    // Warm rim glint on the combined dissolving edge — subject-masked so it
    // never smears onto the background. Folded in with a Fresnel term from
    // the reconstructed normal so contours facing away from camera glow too.
    float edge = smoothstep(0.18, 0.42, reveal) * (1.0 - smoothstep(0.42, 0.78, reveal));
    float fres = pow(1.0 - clamp(N.z, 0.0, 1.0), 3.0);
    color += (edge + fres * reveal * 0.6) * subject * vec3(1.0, 0.42, 0.13) * 0.5;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

export function createPaintMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex,
    fragmentShader: paintFragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uPrev: { value: null },
      uP0: { value: new THREE.Vector2(0.5, 0.5) },
      uP1: { value: new THREE.Vector2(0.5, 0.5) },
      uPainting: { value: 0 },
      uRadius: { value: 0.14 },
      uAspect: { value: 1 },
      uDecay: { value: 0.99 },
      uTime: { value: 0 },
    },
  })
}

export function createRevealMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: planeVertex,
    fragmentShader: revealFragment,
    uniforms: {
      uBase: { value: null },
      uReveal: { value: null },
      uMask: { value: null },
      uDepth: { value: null },
      uDepthScale: { value: 1.0 },
      uWrap: { value: 0.05 },
      uMouse: { value: new THREE.Vector2(0.5, 0.55) },
      uHoverRadius: { value: 0.1 },
      uProgress: { value: 0 },
      uAspect: { value: 1 },
      uImageAspect: { value: 3168 / 1344 },
      uFocusY: { value: 0.5 },
      uTime: { value: 0 },
    },
  })
}
