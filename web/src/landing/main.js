import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/nunito";
import "./style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { mountIcons } from "./icons.js";
import { initLumen } from "./lumen.js";
import { createFrames } from "./frames.js";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const eo = (x) => 1 - Math.pow(1 - x, 3);
const root = document.documentElement;
const reduced = root.classList.contains("rm"); // decidido no <head>
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const portrait = matchMedia("(max-width: 767px), (max-aspect-ratio: 1/1)").matches;

mountIcons();

/* quem pede menos movimento no sistema (ou já escolheu reduzir) vê o botão */
const toggle = $("[data-motion-toggle]");
if (root.classList.contains("rm-ask")) {
  toggle.hidden = false;
  toggle.textContent = reduced ? "Movimento reduzido. Ver com animações" : "Reduzir movimento";
  toggle.addEventListener("click", () => {
    try {
      reduced ? localStorage.removeItem("cr-motion") : localStorage.setItem("cr-motion", "0");
    } catch {}
    location.reload();
  });
}

/* ---------- rolagem com inércia (naocodei 10) ---------- */
let lenis = null;
if (!reduced) {
  // lerp menor = mais inércia no scroll do mouse
  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: id === "#topo" ? 0 : -8, duration: 1.4, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else target.scrollIntoView();
  });
});

/* ---------- navegação: fundo ao rolar, tema escuro sobre seções noturnas ---------- */
const nav = $("[data-nav]");
const dark = new Set();
$$("[data-theme]").forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: "top 36px",
    end: "bottom 36px",
    onToggle: (s) => {
      s.isActive ? dark.add(sec) : dark.delete(sec);
      nav.classList.toggle("is-dark", dark.size > 0);
    },
  });
});
ScrollTrigger.create({ start: 8, end: "max", onToggle: (s) => nav.classList.toggle("is-scrolled", s.isActive) });
// o aviso de movimento só ocupa a tela no começo e no fim da página
ScrollTrigger.create({ trigger: ".hero", start: "bottom 70%", endTrigger: "#comecar", end: "top bottom", onToggle: (s) => toggle.classList.toggle("is-away", s.isActive) });

/* ---------- divide texto em palavras, preservando <span>/<em> internos ---------- */
function splitInto(el, wrap) {
  el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
  const out = [];
  const walk = (node, key) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(" ");
          const w = wrap(part, key);
          out.push(w);
          frag.append(w.outer);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        walk(n, key || n.tagName === "EM");
      }
    });
  };
  walk(el, false);
  return out;
}

/* ---------- lumen ---------- */
const lumen = initLumen($("[data-lumen]"), { reduced });

/* ---------- filme da plataforma (sequência de quadros, naocodei 03) ---------- */
const film = $("[data-film]");
const frames = createFrames($(".film__canvas"), { portrait });

if (reduced) {
  frames.showPoster(0.66);
  $$(".film__caps li").forEach((li) => li.classList.add("is-on"));
} else {
  motion();
}

function motion() {
  /* hero: palavras sobem, cards entram pelas laterais */
  const words = splitInto($(".hero__title"), (w) => {
    const outer = document.createElement("span");
    outer.className = "w";
    outer.setAttribute("aria-hidden", "true");
    outer.innerHTML = `<span class="w__in">${w}</span>`;
    return { outer, inner: outer.firstChild };
  });
  const floats = $$("[data-float]");
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .fromTo(nav, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0)
    .fromTo(words.map((w) => w.inner), { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.045 }, 0.1)
    .fromTo("[data-hero-fade]", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.1 }, 0.55)
    .fromTo("[data-hero-app]", { y: 60, opacity: 0, rotateX: 10 }, { y: 0, opacity: 1, rotateX: 0, duration: 1.6 }, 0.35)
    .fromTo(floats, {
      x: (i, el) => (el.dataset.float === "left" ? -220 : 220),
      rotate: (i, el) => (el.dataset.float === "left" ? -10 : 10),
      opacity: 0,
    }, { x: 0, rotate: 0, opacity: 1, duration: 1.4, stagger: 0.12 }, 0.75);

  // profundidade: cards flutuantes acompanham o mouse e a rolagem em ritmos diferentes
  floats.forEach((f, i) => {
    const depth = [1.4, 1, 1.8, 1.2][i] || 1;
    gsap.to(f, { y: -90 * depth, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    f.dataset.depth = depth;
  });
  gsap.to("[data-hero-app]", { y: -40, rotateX: 6, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to("[data-logo-mark].hero__mark", { rotate: 50, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  if (finePointer) {
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      floats.forEach((f) => {
        const d = Number(f.dataset.depth);
        f.style.setProperty("--px", `${(nx * 26 * d).toFixed(1)}px`);
        f.style.setProperty("--py", `${(ny * 20 * d).toFixed(1)}px`);
      });
    });
  }

  /* títulos: palavra por palavra (naocodei 16) */
  $$("[data-words]").filter((el) => !el.classList.contains("hero__title")).forEach((el) => {
    const ws = splitInto(el, (w) => {
      const outer = document.createElement("span");
      outer.className = "w";
      outer.setAttribute("aria-hidden", "true");
      outer.innerHTML = `<span class="w__in">${w}</span>`;
      return { outer, inner: outer.firstChild };
    });
    gsap.fromTo(ws.map((w) => w.inner), { yPercent: 115 }, {
      yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.05,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  /* texto que se preenche, preso à rolagem (naocodei 04) */
  $$("[data-fill]").forEach((el) => {
    const ws = splitInto(el, (w, key) => {
      const outer = document.createElement("span");
      outer.className = key ? "f f--key" : "f";
      outer.setAttribute("aria-hidden", "true");
      outer.textContent = w;
      return { outer, key };
    });
    const cs = getComputedStyle(el);
    const ink = cs.getPropertyValue("--fill-ink").trim() || "23,37,29";
    const key = cs.getPropertyValue("--fill-key").trim() || ink;
    const draw = (p) => {
      const cursor = p * (ws.length + 6) - 3;
      ws.forEach((w, i) => {
        const d = clamp((cursor - i) / 3);
        w.outer.style.color = `rgba(${w.key ? key : ink},${(0.14 + d * 0.86).toFixed(3)})`;
        if (w.key) w.outer.style.setProperty("--d", d.toFixed(3));
      });
    };
    const st = ScrollTrigger.create({ trigger: el, start: "top 82%", end: "bottom 48%", onUpdate: (s) => draw(s.progress) });
    draw(st.progress);
  });

  /* máscara que revela a próxima cor (naocodei 05) */
  $$("[data-mask]").forEach((m) => {
    const target = m.firstElementChild;
    const isLumen = target.hasAttribute("data-lumen");
    const set = (p) => {
      const maxR = Math.hypot(innerWidth / 2, innerHeight) * 1.06;
      const k = Math.pow(p, 1.25);
      target.style.clipPath = p >= 1 ? "none" : `circle(${(maxR * k).toFixed(1)}px at 50% var(--cy))`;
      if (isLumen) lumen.reveal(p);
    };
    const st = ScrollTrigger.create({
      trigger: m,
      start: "top bottom",
      end: isLumen ? "top top" : "top 22%",
      onUpdate: (s) => set(s.progress),
      onRefresh: (s) => set(s.progress),
    });
    set(st.progress);
  });

  /* componentes entram pelas laterais, presos à rolagem */
  $$("[data-from]").forEach((el) => {
    const dir = el.dataset.from;
    const sx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
    const set = (p) => {
      const e = eo(p);
      const dist = Math.min(innerWidth * 0.26, 380) + 40;
      el.style.transform = sx
        ? `translate3d(${(sx * dist * (1 - e)).toFixed(1)}px,0,0) rotate(${(sx * 3 * (1 - e)).toFixed(2)}deg)`
        : `translate3d(0,${(90 * (1 - e)).toFixed(1)}px,0)`;
      el.style.opacity = clamp(e * 1.4).toFixed(3);
    };
    const st = ScrollTrigger.create({ trigger: el, start: "top 98%", end: "top 64%", onUpdate: (s) => set(s.progress) });
    set(st.progress);
  });

  /* fragmentos do problema: dispersam com a rolagem e, no fim, convergem para a plataforma */
  const frags = $$(".frag");
  frags.forEach((f) => {
    const d = Number(f.dataset.depth) || 1;
    gsap.fromTo(f, { y: 60 * d }, { y: -70 * d, rotate: `+=${(d - 1.2) * 10}`, ease: "none", scrollTrigger: { trigger: "[data-scatter]", start: "top bottom", end: "bottom top", scrub: true } });
  });
  const scatter = $("[data-scatter]");
  const hub = $("[data-hub]");
  let pull = [];
  // distância de cada fragmento até o centro da colagem (offset* ignora transforms)
  const measurePull = () => {
    pull = frags.map((f) => [scatter.clientWidth / 2 - (f.offsetLeft + f.offsetWidth / 2), scatter.clientHeight / 2 - (f.offsetTop + f.offsetHeight / 2)]);
  };
  const converge = (p) => {
    const e = eo(p);
    if (!pull.length) measurePull(); // o ScrollTrigger chama onUpdate já no create, antes da 1ª medição
    frags.forEach((f, i) => {
      const k = eo(clamp(p * 1.25 - i * 0.05));
      f.style.translate = `${(pull[i][0] * k).toFixed(1)}px ${(pull[i][1] * k).toFixed(1)}px`;
      f.style.rotate = `calc(var(--r) * ${(1 - k).toFixed(3)})`;
      f.style.scale = (1 - 0.55 * k).toFixed(3);
      f.style.opacity = (1 - clamp((k - 0.55) / 0.4)).toFixed(3);
    });
    hub.style.opacity = clamp((e - 0.45) / 0.4).toFixed(3);
    hub.style.scale = (0.82 + 0.18 * e).toFixed(3);
  };
  // desktop: a colagem fica fixa ao lado das dores e converge na última; mobile: converge na própria colagem
  const sticky = getComputedStyle(scatter).position === "sticky";
  const pst = ScrollTrigger.create({
    trigger: sticky ? ".pain:last-child" : scatter,
    start: sticky ? "top 70%" : "center 62%",
    end: sticky ? "bottom 55%" : "bottom 30%",
    onUpdate: (s) => converge(s.progress),
    onRefresh: (s) => {
      measurePull();
      converge(s.progress);
    },
  });
  measurePull();
  converge(pst.progress);

  /* ciclo: a linha se desenha e acende cada etapa (naocodei 07) */
  const cycle = $("[data-cycle]");
  const stages = $$(".stage", cycle);
  const line = $(".cycle__line i", cycle);
  const drawCycle = (p) => {
    line.style.setProperty("--p", p.toFixed(4));
    stages.forEach((s, k) => s.classList.toggle("is-on", p >= (k + 0.35) / stages.length));
  };
  const cst = ScrollTrigger.create({ trigger: cycle, start: "top 72%", end: "bottom 58%", onUpdate: (s) => drawCycle(s.progress) });
  drawCycle(cst.progress);

  /* pesos dos critérios crescem com a rolagem */
  const wbars = $$("[data-weights] i");
  const wst = ScrollTrigger.create({
    trigger: "[data-weights]", start: "top 88%", end: "top 52%",
    onUpdate: (s) => wbars.forEach((b, i) => (b.style.transform = `scaleX(${eo(clamp(s.progress * 1.4 - i * 0.08)).toFixed(3)})`)),
  });
  wbars.forEach((b) => (b.style.transform = `scaleX(${eo(wst.progress)})`));

  /* injeção: o trecho malicioso embaralha e vira aviso (naocodei 15) */
  const mark = $("[data-scramble]");
  const from = mark.textContent;
  const to = "[trecho suspeito removido]";
  const glyphs = "▚▞▟▙#%&@$*+=?<>/";
  const tile = mark.closest(".tile");
  let last = -1;
  const scramble = (p) => {
    const k = clamp((p - 0.2) / 0.35);
    const step = Math.round(k * 40);
    if (step === last) return;
    last = step;
    tile.classList.toggle("is-caught", k >= 1);
    if (k <= 0) return (mark.textContent = from);
    if (k >= 1) return (mark.textContent = to);
    const n = Math.round(lerpN(from.length, to.length, k));
    let s = "";
    for (let i = 0; i < n; i++) s += i / n < k - 0.15 ? to[i] || "" : glyphs[(i * 7 + step) % glyphs.length];
    mark.textContent = s;
  };
  const lerpN = (a, b, t) => a + (b - a) * t;
  const sst = ScrollTrigger.create({ trigger: tile, start: "top 80%", end: "top 26%", onUpdate: (s) => scramble(s.progress), onLeave: () => scramble(1), onLeaveBack: () => scramble(0) });
  scramble(sst.progress);

  /* fechamento: risco sobre "Menos burocracia" */
  const strike = $("[data-strike]");
  const kst = ScrollTrigger.create({ trigger: strike, start: "top 80%", end: "top 45%", onUpdate: (s) => strike.style.setProperty("--k", eo(s.progress).toFixed(3)) });
  strike.style.setProperty("--k", eo(kst.progress).toFixed(3));

  /* filme: quadros, legendas por marco e trilho */
  const caps = $$(".film__caps li");
  const rail = $(".film__rail span");
  ScrollTrigger.create({ trigger: film, start: "top bottom+=100%", once: true, onEnter: frames.loadAll });
  frames.showPoster(0);
  let cap = -1;
  ScrollTrigger.create({
    trigger: film, start: "top top", end: "bottom bottom",
    onUpdate: (s) => {
      frames.setProgress(s.progress);
      rail.style.transform = `scaleX(${s.progress.toFixed(4)})`;
      // as telas do vídeo mudam nos terços: cada legenda chega um pouco antes do seu marco
      const k = [0.25, 0.58, 0.92].filter((m) => s.progress >= m).length;
      if (k !== cap) {
        cap = k;
        caps.forEach((c, i) => c.classList.toggle("is-on", i === k));
      }
    },
  });

  /* luz que segue o mouse nos cards escuros (naocodei 12) */
  $$("[data-glow]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--x", `${(e.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty("--y", `${(e.clientY - r.top).toFixed(0)}px`);
    });
  });

  /* botões magnéticos (naocodei 14) */
  if (finePointer) {
    $$("[data-magnetic]").forEach((el) => {
      const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.24);
        y((e.clientY - r.top - r.height / 2) * 0.34);
      });
      el.addEventListener("pointerleave", () => {
        x(0);
        y(0);
      });
    });
  }
}

document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh());
window.addEventListener("pagehide", (e) => {
  if (!e.persisted) frames.dispose();
});
