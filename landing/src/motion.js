import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { MODULES } from "./modules.js";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Divide o texto em palavras com máscara (técnica j16 do naocodei, animada com GSAP). */
function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span class="w__in">${w}</span></span>`).join(" ");
  return $$(".w__in", el);
}

export function initMotion({ network, atom, lumen }) {
  /* ───────── rolagem suave (inércia, j10) ───────── */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (x) => 1 - Math.pow(1 - x, 4), ...opts });
    else if (typeof target === "number") window.scrollTo({ top: target });
    else (typeof target === "string" ? $(target) : target)?.scrollIntoView();
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2 || !$(id)) return;
      e.preventDefault();
      scrollTo(id, { offset: id === "#topo" ? 0 : -8 });
    });
  });

  /* ───────── módulos (núcleo): estado compartilhado entre texto e átomo ───────── */
  const nav = $("[data-core-nav]");
  const panel = $("[data-core-panel]");
  const labelEls = $$(".core__label");
  const navBtns = MODULES.map((m, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<button type="button" role="tab" aria-selected="false" data-i="${i}"><small>0${i + 1}</small>${m.name}</button>`;
    nav.appendChild(li);
    return $("button", li);
  });
  let current = -1;
  const setActive = (i, instant = false) => {
    if (i === current) return;
    current = i;
    const m = MODULES[i];
    navBtns.forEach((b, k) => { b.classList.toggle("is-active", k === i); b.setAttribute("aria-selected", String(k === i)); });
    labelEls.forEach((l, k) => l.classList.toggle("is-active", k === i));
    if (atom) atom.api.state.active = i;
    const fill = () => {
      $("[data-core-title]", panel).textContent = m.title;
      $("[data-core-text]", panel).textContent = m.text;
      $("[data-core-points]", panel).innerHTML = m.points.map((p) => `<li>${p}</li>`).join("");
    };
    if (instant || reduce) { fill(); return; }
    gsap.killTweensOf(panel.children);
    gsap.to(panel.children, {
      opacity: 0, y: -10, duration: 0.18, ease: "power2.in", stagger: 0.02,
      onComplete() {
        fill();
        gsap.fromTo(panel.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.06 });
      },
    });
  };
  setActive(0, true);

  let coreST = null;
  navBtns.forEach((b, i) => b.addEventListener("click", () => {
    if (coreST) scrollTo(coreST.start + ((i + 0.5) / MODULES.length) * (coreST.end - coreST.start));
    else setActive(i);
  }));

  /* ───────── tabs da Lumen ───────── */
  const tabs = $$(".tab");
  const tabBar = $(".tabs__bar");
  const moveBar = (instant) => {
    const t = $(".tab.is-active");
    if (!t) return;
    if (instant || reduce) gsap.set(tabBar, { x: t.offsetLeft, width: t.offsetWidth });
    else gsap.to(tabBar, { x: t.offsetLeft, width: t.offsetWidth, duration: 0.6, ease: "expo.out" });
  };
  const animatePane = (pane) => {
    const meters = $$("[data-meter]", pane);
    meters.forEach((m) => { if (reduce) { m.style.transform = `scaleX(${m.dataset.meter / 100})`; } });
    if (reduce) return;
    gsap.fromTo($$(".rec", pane), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.09 });
    if (meters.length) gsap.fromTo(meters, { scaleX: 0 }, { scaleX: (_, el) => el.dataset.meter / 100, duration: 1.2, ease: "expo.out", delay: 0.25, stagger: 0.1 });
  };
  const selectTab = (tab, focus) => {
    if (tab.classList.contains("is-active")) return;
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute("aria-controls")}`).hidden = !on;
    });
    if (focus) tab.focus();
    moveBar();
    animatePane($(`#${tab.getAttribute("aria-controls")}`));
    lumen?.api.setMode(tab.dataset.tab);
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        selectTab(tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length], true);
      }
    });
  });
  document.fonts?.ready.then(() => { moveBar(true); ScrollTrigger.refresh(); });
  window.addEventListener("resize", () => moveBar(true));
  moveBar(true);

  /* ───────── cursor com atraso (j09) ───────── */
  if (finePointer && !reduce) {
    const cur = $(".cursor");
    const ring = $(".cursor__ring");
    const dot = $(".cursor__dot");
    const target = { x: -100, y: -100 };
    const at = { x: -100, y: -100 };
    window.addEventListener("pointermove", (e) => {
      target.x = e.clientX; target.y = e.clientY;
      cur.classList.add("is-on");
      cur.classList.toggle("is-link", !!e.target.closest("a, button, [data-magnetic]"));
    }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("is-on"));
    gsap.ticker.add(() => {
      at.x += (target.x - at.x) * 0.16;
      at.y += (target.y - at.y) * 0.16;
      dot.style.transform = `translate(${target.x}px, ${target.y}px)`;
      ring.style.transform = `translate(${at.x}px, ${at.y}px)`;
    });

    /* botões magnéticos */
    $$("[data-magnetic]").forEach((el) => {
      const qx = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      const qy = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      const qs = gsap.quickTo(el, "scale", { duration: 0.3, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22);
        qy((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener("pointerleave", () => { qx(0); qy(0); qs(1); });
      el.addEventListener("pointerdown", () => qs(0.96));
      el.addEventListener("pointerup", () => qs(1));
    });
  }

  /* ───────── tudo que depende de movimento ───────── */
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    /* intro do hero */
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .fromTo(".nav", { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 1.2 }, 0)
      // y:0 explícito: o GSAP lê o translateY(110%) do CSS como pixels e somaria ao yPercent
      .fromTo(".hero__title .line__in", { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.5, stagger: 0.12 }, 0.1)
      .fromTo("[data-hero-fade]", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.55)
      .fromTo(".hero__stage", { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2 }, 0);

    /* hero: a rede gira conforme a rolagem; o texto sobe */
    ScrollTrigger.create({
      trigger: ".hero", start: "top top", end: "bottom top", scrub: true,
      onUpdate: (self) => { if (network) network.api.state.scroll = self.progress; },
    });
    gsap.to(".hero__copy", { yPercent: -14, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* títulos: palavra por palavra (j16) */
    $$("[data-words]").forEach((el) => {
      const words = splitWords(el);
      gsap.fromTo(words, { yPercent: 115 }, {
        yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.05,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    /* texto que se preenche (j04) */
    const fill = $("[data-fill]");
    if (fill) {
      const words = fill.textContent.trim().split(/\s+/);
      fill.setAttribute("aria-label", fill.textContent.trim());
      fill.innerHTML = words.map((w) => `<span class="f" aria-hidden="true">${w}</span>`).join(" ");
      const spans = $$(".f", fill);
      ScrollTrigger.create({
        trigger: fill, start: "top 78%", end: "bottom 42%", scrub: true,
        onUpdate: ({ progress }) => {
          const cursor = progress * (spans.length + 6) - 3;
          spans.forEach((s, i) => {
            const d = Math.min(1, Math.max(0, (cursor - i) / 3));
            s.style.color = `rgba(233,244,238,${(0.14 + d * 0.86).toFixed(3)})`;
          });
        },
      });
    }

    /* revelações em lote */
    ScrollTrigger.batch($$("[data-reveal]"), {
      start: "top 90%", once: true,
      onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 56 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.12, overwrite: true }),
    });

    /* odômetro (j18) */
    $$(".odo").forEach((el) => {
      const val = Number(el.dataset.value);
      const sep = el.dataset.sep;
      const str = sep ? String(val).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(val);
      el.setAttribute("aria-label", str + (el.dataset.suffix || ""));
      const ribbons = [];
      el.innerHTML = "";
      [...str].forEach((ch) => {
        const wrap = document.createElement("span");
        wrap.setAttribute("aria-hidden", "true");
        if (/\d/.test(ch)) {
          wrap.className = "odo__d";
          const r = document.createElement("span");
          r.className = "odo__r";
          r.innerHTML = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join("");
          wrap.appendChild(r);
          ribbons.push([r, Number(ch)]);
        } else wrap.textContent = ch;
        el.appendChild(wrap);
      });
      if (el.dataset.suffix) {
        const s = document.createElement("span");
        s.className = "odo__s";
        s.setAttribute("aria-hidden", "true");
        s.textContent = el.dataset.suffix;
        el.appendChild(s);
      }
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => ribbons.forEach(([r, d], i) => gsap.to(r, { yPercent: -d * 10, duration: 1.8, ease: "expo.out", delay: i * 0.12 })),
      });
    });

    /* núcleo: seção fixada, rolagem percorre os módulos */
    const core = $(".core");
    const distance = () => window.innerHeight * 3.4;
    coreST = ScrollTrigger.create({
      trigger: core, pin: ".core__pin", start: "top top", end: () => "+=" + distance(),
      scrub: true, invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (atom) atom.api.state.progress = self.progress;
        setActive(Math.min(MODULES.length - 1, Math.floor(self.progress * MODULES.length)));
      },
    });
    gsap.fromTo(".core__stage", { opacity: 0, scale: 0.9 }, {
      opacity: 1, scale: 1, duration: 1.6, ease: "expo.out",
      scrollTrigger: { trigger: core, start: "top 70%", once: true },
    });

    /* bento: anel de progresso (j26) e chips */
    const bar = $("[data-ring]");
    if (bar) {
      const v = { n: 0 };
      const label = $("[data-ring-label]");
      const circ = 314.16;
      gsap.to(v, {
        n: Number(bar.dataset.ring), duration: 2, ease: "expo.out",
        scrollTrigger: { trigger: bar, start: "top 85%", once: true },
        onUpdate() { bar.style.strokeDashoffset = circ * (1 - v.n / 100); label.textContent = Math.round(v.n); },
      });
    }
    gsap.fromTo(".chip", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.6)", stagger: 0.08, scrollTrigger: { trigger: ".chips", start: "top 88%", once: true } });
    gsap.fromTo(".docs li", { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".docs", start: "top 88%", once: true } });

    /* Lumen: painel entra e barras preenchem */
    ScrollTrigger.create({ trigger: ".lumen__panel", start: "top 78%", once: true, onEnter: () => animatePane($(".pane.is-active")) });
    gsap.fromTo(".lumen__stage", { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: ".lumen__stage", start: "top 85%", once: true } });
    $$(".pane.is-active [data-meter]").forEach((m) => gsap.set(m, { scaleX: 0 }));

    /* linha do tempo (j07) */
    const tl = $("[data-timeline]");
    gsap.to(".timeline__line i", { scaleY: 1, ease: "none", scrollTrigger: { trigger: tl, start: "top 65%", end: "bottom 65%", scrub: true } });
    $$(".step").forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 68%", toggleClass: { targets: s, className: "is-on" } }));

    /* pilha de cartões (j01): o anterior encolhe quando o próximo chega */
    const cards = $$(".stack__card");
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.to($(".stack__bezel", card), {
        scale: 0.9, opacity: 0.35, ease: "none",
        scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top top", scrub: true },
      });
    });

    /* CTA final */
    gsap.fromTo(".final__glow", { yPercent: -14, scale: 0.8 }, { yPercent: 14, scale: 1.1, ease: "none", scrollTrigger: { trigger: ".final", start: "top bottom", end: "bottom top", scrub: true } });

    return () => { coreST = null; };
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    $$(".odo").forEach((el) => {
      const val = Number(el.dataset.value);
      const str = el.dataset.sep ? String(val).replace(/\B(?=(\d{3})+(?!\d))/g, el.dataset.sep) : String(val);
      el.textContent = str + (el.dataset.suffix || "");
    });
    $$(".pane.is-active [data-meter]").forEach((m) => (m.style.transform = `scaleX(${m.dataset.meter / 100})`));
    const bar = $("[data-ring]");
    if (bar) bar.style.strokeDashoffset = 314.16 * (1 - Number(bar.dataset.ring) / 100);
  });

  return { lenis };
}
