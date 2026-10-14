import * as THREE from "three";
import { gsap } from "gsap";

export { THREE };
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const COLORS = {
  accent: new THREE.Color("#5ad6a6"),
  deep: new THREE.Color("#1f7a5a"),
  mint: new THREE.Color("#d8fff0"),
};

/** ponteiro normalizado (-1..1), suavizado por quem consome */
export const pointer = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });

let glow;
/** textura radial branca para halos e pontos aditivos */
export function glowTexture() {
  if (glow) return glow;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(c);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

export function halo(color, scale, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  s.scale.setScalar(scale);
  return s;
}

/**
 * Monta um renderer no canvas. Só renderiza enquanto o palco está visível.
 * build({ scene, camera, renderer, size }) devolve { update(t, dt), resize?(w,h), dispose? }.
 */
export function mountScene(canvas, build, { fov = 45, z = 9, lights = false } = {}) {
  const stage = canvas.parentElement.closest("[data-stage]") || canvas.parentElement;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    stage.classList.add("no-webgl");
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, z);
  if (lights) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d = new THREE.DirectionalLight(0xffffff, 1.6);
    d.position.set(4, 6, 8);
    scene.add(d);
  }

  const size = { w: 1, h: 1 };
  const api = build({ scene, camera, renderer, size });

  const resize = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    size.w = Math.max(1, r.width);
    size.h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
    api.resize?.(size.w, size.h);
  };
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "120px" }).observe(canvas.parentElement);

  let t = 0;
  const tick = (_time, deltaMs) => {
    if (!visible) return;
    const dt = Math.min(deltaMs / 1000, 0.05) * (reduceMotion ? 0.15 : 1);
    t += dt;
    api.update(t, dt);
    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);

  return { renderer, scene, camera, api, size, dispose() { gsap.ticker.remove(tick); renderer.dispose(); } };
}

export const lerp = (a, b, k) => a + (b - a) * k;
/** suavização independente de framerate */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
