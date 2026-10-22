// Núcleo da Lumen: esfera líquida em raymarching (SDF) com gotas que se fundem,
// iridescente no espectro do botão real da Lumen (azul, violeta, coral, âmbar).
// Câmera ortográfica em pixels: o núcleo e as partículas usam as mesmas
// coordenadas do DOM do palco, então os cartões HTML "entram" nele de verdade.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";

const E = 3.9; // meia largura do quadro do núcleo, em raios (folga para o halo das gotas mais distantes)
export const DROPS = 8;

const SPECTRUM = /* glsl */ `
  // ciclo da Lumen: azul > violeta > coral > âmbar > pêssego > azul claro (sem verde)
  vec3 spectrum(float h) {
    h = fract(h) * 6.0;
    vec3 c0 = vec3(0.16, 0.40, 0.98);
    vec3 c1 = vec3(0.56, 0.36, 0.97);
    vec3 c2 = vec3(0.95, 0.28, 0.38);
    vec3 c3 = vec3(0.99, 0.79, 0.10);
    vec3 c4 = vec3(1.00, 0.90, 0.80);
    vec3 c5 = vec3(0.56, 0.78, 1.00);
    float f = smoothstep(0.0, 1.0, fract(h));
    if (h < 1.0) return mix(c0, c1, f);
    if (h < 2.0) return mix(c1, c2, f);
    if (h < 3.0) return mix(c2, c3, f);
    if (h < 4.0) return mix(c3, c4, f);
    if (h < 5.0) return mix(c4, c5, f);
    return mix(c5, c0, f);
  }
`;

const coreVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coreFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uProcess;
  uniform float uAmp;
  uniform float uK;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uBound;
  uniform vec3 uPointer;
  uniform float uPointerR;
  uniform vec4 uDrops[${DROPS}];
  varying vec2 vUv;
  ${SPECTRUM}

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float map(vec3 p) {
    // tempo contínuo: velocidade fixa, senão a fase salta quando o processamento muda com a rolagem
    float t = uTime;
    float w = sin(p.x * 2.1 + t * 1.3) * sin(p.y * 2.4 - t * 1.1) * sin(p.z * 1.9 + t * 0.9);
    w += 0.45 * sin(p.x * 4.3 - t * 1.9 + p.z * 1.7) * sin(p.y * 3.9 + t * 1.5 - p.x);
    float d = length(p) - 1.0 + w * uAmp;
    d = smin(d, length(p - uPointer) - uPointerR, 0.42);
    for (int i = 0; i < ${DROPS}; i++) {
      vec4 q = uDrops[i];
      if (q.w > 0.002) d = smin(d, length(p - q.xyz) - q.w, uK);
    }
    return d;
  }

  vec3 normalAt(vec3 p) {
    const vec2 k = vec2(1.0, -1.0);
    const float e = 0.0025;
    return normalize(
      k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) +
      k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e)
    );
  }

  void main() {
    vec2 uv = (vUv * 2.0 - 1.0) * ${E.toFixed(2)};
    vec3 ro = vec3(0.0, 0.0, 6.0);
    vec3 rd = normalize(vec3(uv, 0.0) - ro);
    float dmin = 1e3;
    bool hit = false;
    vec3 p = ro;

    // esfera-limite que contém núcleo e gotas: fora dela, uma amostra só para o halo
    float b = dot(ro, rd);
    float disc = b * b - dot(ro, ro) + uBound * uBound;
    if (disc > 0.0) {
      float s = sqrt(disc);
      float t = -b - s;
      float tEnd = -b + s;
      for (int i = 0; i < 48; i++) {
        p = ro + rd * t;
        float d = map(p);
        dmin = min(dmin, d);
        if (d < 0.0015) { hit = true; break; }
        t += d * 0.85;
        if (t > tEnd) break;
      }
    } else {
      dmin = map(ro + rd * -b);
    }

    // halo: luz que se espalha em volta, girando pelo espectro, sumindo antes da borda do quadro
    float edge = 1.0 - smoothstep(${(E * 0.72).toFixed(2)}, ${E.toFixed(2)}, length(uv));
    float glow = exp(-max(dmin, 0.0) * 3.2) * uGlow * edge;
    vec3 gc = spectrum(atan(uv.y, uv.x) / 6.2831 + uTime * 0.04);
    vec4 outc = vec4(gc * glow * 0.85, glow * 0.75);

    if (hit) {
      // material sólido: cor opaca que flui devagar pela superfície, luz difusa, brilho e borda
      vec3 n = normalAt(p);
      vec3 v = -rd;
      float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      float flow = sin(dot(p, vec3(1.3, 1.0, 0.7)) * 1.4 + uTime * 0.35) * 0.5 + 0.5;
      float h = 0.06 + 0.16 * p.y + 0.1 * p.x + flow * 0.34 + uTime * 0.012;
      vec3 base = spectrum(h);
      vec3 L = normalize(vec3(-0.45, 0.75, 0.55));
      float wrap = 0.5 + 0.5 * dot(n, L);
      vec3 col = base * (0.22 + 0.78 * wrap * wrap);
      col *= 0.78 + 0.22 * (0.5 + 0.5 * n.y);
      col += pow(max(dot(reflect(-L, n), v), 0.0), 42.0) * 0.75;
      col += spectrum(h + 0.3) * fres * 0.5;
      col += base * uProcess * 0.22;
      outc = vec4(col, 1.0);
    }
    gl_FragColor = outc * uOpacity;
  }
`;

const ptsVert = /* glsl */ `
  attribute float aAlpha;
  attribute float aHue;
  uniform float uPR;
  uniform float uSize;
  varying float vA;
  varying vec3 vC;
  ${SPECTRUM}
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (1.5 + uSize * aAlpha) * uPR;
    vA = aAlpha;
    vC = spectrum(aHue);
  }
`;

const ptsFrag = /* glsl */ `
  varying float vA;
  varying vec3 vC;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d) * vA;
    gl_FragColor = vec4(vC * a, a);
  }
`;

function pointsLayer(count, pr, size) {
  const geo = new BufferGeometry();
  const pos = new Float32Array(count * 3);
  const alpha = new Float32Array(count);
  const hue = new Float32Array(count).map(() => Math.random());
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("aAlpha", new BufferAttribute(alpha, 1));
  geo.setAttribute("aHue", new BufferAttribute(hue, 1));
  const mat = new ShaderMaterial({
    uniforms: { uPR: { value: pr }, uSize: { value: size } },
    vertexShader: ptsVert,
    fragmentShader: ptsFrag,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });
  const pts = new Points(geo, mat);
  pts.frustumCulled = false;
  return { pts, pos, alpha, geo, mat };
}

/**
 * createCore(canvas) devolve null sem WebGL.
 * state: x, y, r (px no palco), process, amp, glow, opacity.
 * drops: Vector4 em raios relativos ao centro (x, y, z, raio).
 * render(t, sources): sources = [{ x, y, a }] em px, de onde sai o fluxo de partículas.
 */
export function createCore(canvas, { mobile = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  const pr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25);
  renderer.setPixelRatio(pr);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const drops = Array.from({ length: DROPS }, () => new Vector4());
  const uniforms = {
    uTime: { value: 0 },
    uProcess: { value: 0 },
    uAmp: { value: 0.06 },
    uK: { value: 0.38 },
    uGlow: { value: 0.6 },
    uOpacity: { value: 1 },
    uBound: { value: 2 },
    uPointer: { value: new Vector3(0, 0, -9) },
    uPointerR: { value: 0 },
    uDrops: { value: drops },
  };
  const quad = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({ uniforms, vertexShader: coreVert, fragmentShader: coreFrag, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true }),
  );
  quad.renderOrder = 1;

  // poeira ao fundo e fluxo de dados até o núcleo
  const DUST = mobile ? 90 : 180;
  const dust = pointsLayer(DUST, pr, 1.6);
  const seeds = Array.from({ length: DUST }, () => [Math.random(), Math.random(), 0.2 + Math.random() * 0.8, Math.random() * 6.28]);
  const PER = 36;
  const MAXS = 10;
  const flow = pointsLayer(PER * MAXS, pr, 6);
  flow.pts.renderOrder = 2;
  scene.add(dust.pts, quad, flow.pts);

  const state = { x: 0, y: 0, r: 100, process: 0, amp: 0.06, glow: 0.6, opacity: 1 };
  const pointer = { x: 0, y: 0, on: 0, k: 0 };
  let W = 1;
  let H = 1;

  function resize(w, h) {
    W = Math.max(1, w);
    H = Math.max(1, h);
    renderer.setSize(W, H, false);
    camera.left = -W / 2;
    camera.right = W / 2;
    camera.top = H / 2;
    camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
  }

  const toWorld = (x, y, out, i) => {
    out[i] = x - W / 2;
    out[i + 1] = H / 2 - y;
    out[i + 2] = 0;
  };

  function render(t, sources = []) {
    const { x, y, r } = state;
    uniforms.uTime.value = t;
    uniforms.uProcess.value = state.process;
    uniforms.uAmp.value = state.amp;
    uniforms.uGlow.value = state.glow;
    uniforms.uOpacity.value = state.opacity;
    quad.position.set(x - W / 2, H / 2 - y, 0);
    quad.scale.setScalar(Math.max(1, r) * E);

    // o líquido estica na direção do cursor quando ele chega perto
    const dx = (pointer.x - x) / r;
    const dy = -(pointer.y - y) / r;
    const dist = Math.hypot(dx, dy) || 1;
    const near = pointer.on * Math.max(0, Math.min(1, 1 - (dist - 1) / 2.2));
    pointer.k += (near - pointer.k) * 0.08;
    const reach = 0.92 + 0.3 * pointer.k;
    uniforms.uPointer.value.set((dx / dist) * reach, (dy / dist) * reach, 0.35);
    uniforms.uPointerR.value = 0.05 + 0.2 * pointer.k;

    // raio que contém tudo o que existe (núcleo, cursor, gotas) + folga do smooth-min
    let bound = Math.max(1.05 + state.amp * 1.5, reach + uniforms.uPointerR.value);
    for (const q of drops) if (q.w > 0.002) bound = Math.max(bound, Math.hypot(q.x, q.y, q.z) + q.w);
    uniforms.uBound.value = Math.min(bound + 0.12, E);

    for (let i = 0; i < DUST; i++) {
      const [sx, sy, sp, ph] = seeds[i];
      const px = ((sx + t * 0.004 * sp) % 1) * W;
      const py = (sy * H + Math.sin(t * 0.3 * sp + ph) * 14) % H;
      toWorld(px, py, dust.pos, i * 3);
      dust.alpha[i] = 0.18 + 0.22 * Math.sin(t * sp + ph) ** 2;
    }
    dust.geo.attributes.position.needsUpdate = true;
    dust.geo.attributes.aAlpha.needsUpdate = true;

    for (let k = 0; k < MAXS; k++) {
      const s = sources[k];
      for (let j = 0; j < PER; j++) {
        const idx = k * PER + j;
        if (!s || s.a <= 0.001) {
          flow.alpha[idx] = 0;
          continue;
        }
        const q = (t * 0.55 + j / PER + k * 0.137) % 1;
        const e = q * q;
        const wob = Math.sin(j * 12.9 + t * 2) * (1 - e) * 16;
        const px = s.x + (x - s.x) * e;
        const py = s.y + (y - s.y) * e + wob;
        toWorld(px, py, flow.pos, idx * 3);
        flow.alpha[idx] = s.a * (1 - e) * Math.min(1, q * 8) * 0.95;
      }
    }
    flow.geo.attributes.position.needsUpdate = true;
    flow.geo.attributes.aAlpha.needsUpdate = true;

    renderer.render(scene, camera);
  }

  return {
    state,
    drops,
    pointer,
    resize,
    render,
    dispose() {
      renderer.dispose();
      quad.geometry.dispose();
      quad.material.dispose();
      dust.geo.dispose();
      dust.mat.dispose();
      flow.geo.dispose();
      flow.mat.dispose();
    },
  };
}
