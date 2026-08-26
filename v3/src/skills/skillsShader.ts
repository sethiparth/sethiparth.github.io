/* Skills-section background: a domain-warped fBm flow field.

   One fullscreen triangle, one fragment shader — no scene graph, no textures.
   The look is soft drifting orange filaments over near-black, tinted with the
   same accent as the hero so the whole page reads as one system. */

export const skillsBgVertex = /* glsl */ `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`

export const skillsBgFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uRes;
  uniform float uTime;

  // Value noise + fBm (cheap, dependency-free).
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = vec2(vUv.x * aspect, vUv.y);
    float t = uTime * 0.11;   // faster domain drift -> visibly flowing field

    // Feed fBm back into itself -> straight noise bends into flowing filaments.
    vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
    float f = fbm(p * 2.1 + q * 1.7 + vec2(0.0, t * 1.5));

    // Field is a warm ember in the SAME family as the accent, but dark and
    // desaturated — it stays cohesive with the site's orange identity while
    // reading as atmosphere, not signal. The bright, saturated skill bars keep
    // all the voltage; this burnt-umber haze sits well below them in value and
    // saturation, so the two never get confused (Warp-style warm charcoal
    // canvas rather than a cool one).
    vec3 base = vec3(0.043, 0.036, 0.031);        // ~#0b0908 warm near-black
    vec3 fieldDeep = vec3(0.420, 0.196, 0.086);   // #6b3216 deep ember
    vec3 fieldSoft = vec3(0.620, 0.322, 0.157);   // #9e5228 warm bronze glow

    float flow = smoothstep(0.30, 0.80, f);
    vec3 col = base;
    col += fieldDeep * flow * 0.50;
    col += fieldSoft * pow(flow, 2.2) * 0.36;

    // Two slow drifting glows for depth.
    vec2 g1 = vec2((0.30 + 0.13 * sin(uTime * 0.22)) * aspect, 0.35 + 0.10 * cos(uTime * 0.18));
    vec2 g2 = vec2((0.78 + 0.11 * cos(uTime * 0.16)) * aspect, 0.68 + 0.12 * sin(uTime * 0.26));
    col += fieldDeep * exp(-2.6 * length(p - g1)) * 0.40;
    col += fieldSoft * exp(-3.0 * length(p - g2)) * 0.32;

    // Gentle vignette so the outer edges still melt back into the page.
    float vig = smoothstep(1.35, 0.35, length((vUv - 0.5) * vec2(aspect, 1.0)));
    col *= mix(0.78, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`
