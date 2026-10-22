// Capítulo da Lumen: palco fixo (sticky) e uma função apply(p) que deriva tudo
// do progresso da rolagem. Ato 1: perfil do aluno vira 3 recomendações.
// Ato 2: inscrições espalhadas entram no núcleo e saem como ranking.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mountIcons } from "./icons.js";

// Exemplo ilustrativo, nos moldes do LumenService: nota = média ponderada dos critérios
// (motivação 25, alinhamento 25, reflexão 20, iniciativa 20, evidências 10; null redistribui o peso).
const CANDIDATOS = [
  { nome: "Larissa Moura", curso: "Química · 7º semestre", c: [9, 9, 8, 8, 9], conf: "alta", why: "Motivação ligada ao tema e já cursou química analítica. Fez iniciação anterior com coleta de amostras." },
  { nome: "Rafael Quintino", curso: "Eng. química · 6º semestre", c: [8, 8, 8, 7, 8], conf: "alta", why: "Experiência com coleta de amostras. Carga horária no limite das 12 h semanais pedidas." },
  { nome: "Beatriz Okada", curso: "Biologia · 4º semestre", c: [8, 6, 8, 8, null], conf: "média", why: "Nunca fez IC, mas explica com clareza o que quer investigar. Sem documentos: o peso foi redistribuído." },
  { nome: "Isadora Prado", curso: "Química · 2º semestre", c: [8, 6, 7, 8, null], conf: "média", why: "Início de curso, com estudo autônomo sobre microplásticos citado na motivação." },
  { nome: "Marina Teles", curso: "Química · 8º semestre", c: [5, 8, 7, 7, 8], conf: "alta", why: "Ótima base técnica, mas a motivação é pouco específica para rios urbanos." },
  { nome: "Thiago Bezerra", curso: "Química · 5º semestre", c: [5, 7, 6, 7, 6], conf: "média", why: "Boa disponibilidade. Ainda não cursou química analítica e a motivação é genérica." },
  { nome: "João Pedro Alves", curso: "Eng. ambiental · 3º semestre", c: [6, 5, 5, 6, 4], conf: "média", why: "Interesse real pelo tema. O período do perfil diverge da biografia: sinalizado, não eliminado." },
  { nome: "Gustavo Ramos", curso: "Eng. ambiental · 5º semestre", c: [4, 4, 5, 5, 6], conf: "média", why: "Disponibilidade limitada e pouca relação da trajetória com o tema." },
  { nome: "Camila Souto", curso: "Biologia · 3º semestre", c: [3, 2, 4, 4, 3], conf: "baixa", why: "Perfil mais próximo de outro projeto da área. A motivação serviria para qualquer projeto." },
];
const PESOS = [25, 25, 20, 20, 10];
const CRIT = ["Motivação", "Alinhamento", "Reflexão", "Iniciativa", "Evidências"];

const nota = (c) => {
  let soma = 0;
  let peso = 0;
  c.forEach((v, i) => {
    if (v == null) return;
    soma += v * PESOS[i];
    peso += PESOS[i];
  });
  return Math.round((soma / peso) * 10) / 10;
};
CANDIDATOS.forEach((d) => (d.nota = nota(d.c)));
CANDIDATOS.sort((a, b) => b.nota - a.nota);

// ordem de chegada (embaralhada) e posição espalhada no palco: x%, y%, rotação
const CHEGADA = [5, 0, 7, 2, 8, 4, 1, 6, 3];
const SPOTS = [
  [14, 46, -9], [31, 78, 7], [9, 84, 4], [71, 25, 8], [89, 47, -6],
  [76, 80, -10], [52, 90, 5], [33, 37, -4], [90, 84, 11],
];

const tom = (n) => (n >= 7 ? "verde" : n >= 4 ? "amarelo" : "vermelho");
const fmt = (n) => n.toFixed(1).replace(".", ",");
const iniciais = (n) => n.split(" ").slice(0, 2).map((p) => p[0]).join("");

/* ---------------- matemática de rolagem ---------------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const bell = (p, a, b) => Math.sin(Math.PI * seg(p, a, b));

function build(section) {
  const inbox = section.querySelector('[data-l="inbox"]');
  inbox.innerHTML = CHEGADA.map((k, i) => {
    const d = CANDIDATOS[k];
    const [x, y, r] = SPOTS[i];
    return `<div class="insc" style="--x:${x};--y:${y};--rot:${r}deg">
      <div class="insc__top"><span class="ava">${iniciais(d.nome)}</span><div><b>${d.nome}</b><small>${d.curso}</small></div></div>
      <div class="insc__foot"><span class="tag tag--amarelo">Pendente</span><span class="insc__doc"><span data-i="paperclip"></span>curriculo.pdf</span></div>
    </div>`;
  }).join("");

  const grid = section.querySelector('[data-l="grid"]');
  grid.innerHTML = CANDIDATOS.map((d, i) => {
    const bars = d.c.map((v) => `<li class="${v == null ? "is-null" : "t-" + tom(v)}" style="--v:${v == null ? 0 : v / 10}"><i></i></li>`).join("");
    const label = d.c.map((v, j) => `${CRIT[j]} ${v == null ? "sem dados" : v + " de 10"}`).join(", ");
    return `<li class="eval${i === 0 ? " eval--top" : ""}">
      <div class="eval__top">
        <span class="eval__pos">${i + 1}º</span>
        <span class="ava">${iniciais(d.nome)}</span>
        <div class="eval__who"><b>${d.nome}</b><small>${d.curso}</small></div>
        <span class="tag tag--${tom(d.nota)} eval__score"><b data-score="${d.nota}">${fmt(d.nota)}</b>/10</span>
      </div>
      <p class="eval__why">${d.why}</p>
      <div class="eval__foot">
        <ul class="eval__bars" aria-label="${label}">${bars}</ul>
        <span class="tag tag--cinza">Confiança ${d.conf}</span>
      </div>
    </li>`;
  }).join("");
  mountIcons(section);
}

export function initLumen(section, { reduced }) {
  build(section);
  const q = (s) => section.querySelector(`[data-l="${s}"]`);
  const stage = section.querySelector(".lumen__stage");
  const canvas = section.querySelector(".lumen__canvas");
  const fallback = section.querySelector(".lumen__fallback span");

  if (reduced) {
    section.classList.add("lumen--static");
    return { reveal() {} };
  }

  const el = {
    intro: q("intro"), actA: q("actA"), actB: q("actB"), profile: q("profile"), btn: q("btn"),
    pointer: q("pointer"), loading: q("loading"), recs: q("recs"), rank: q("rank"), dock: q("dock"), inbox: q("inbox"),
  };
  const steps = [...el.loading.querySelectorAll("[data-step]")];
  const recItems = [...el.recs.querySelectorAll("[data-rec]")];
  const inscs = [...section.querySelectorAll(".insc")];
  const evals = [...section.querySelectorAll(".eval")];
  const scores = evals.map((e) => e.querySelector("[data-score]"));
  const barSets = evals.map((e) => [...e.querySelectorAll(".eval__bars i")]);
  const rankHead = el.rank.querySelector(".rank__head");
  const rankNote = el.rank.querySelector(".rank__note");

  let core = null;
  let W = 1;
  let H = 1;
  let R = 100;
  let mobile = false;
  const home = { insc: [], evals: [], dock: { x: 0, y: 0 }, profile: { x: 0, y: 0, w: 0, h: 0 }, btn: { x: 0, y: 0 } };

  function relRect(node, base) {
    const r = node.getBoundingClientRect();
    return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, w: r.width, h: r.height };
  }

  // mesmas quebras do CSS: palco empilhado até 1023px, cartões menores no celular
  const stackedMQ = matchMedia("(max-width: 1023px)");
  const phoneMQ = matchMedia("(max-width: 767px)");
  let phone = false;

  function layout() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    mobile = stackedMQ.matches;
    phone = phoneMQ.matches;
    R = mobile ? Math.min(W * 0.17, H * 0.12, 120) : Math.min(W * 0.12, H * 0.16, 150);
    const moved = [el.profile, el.btn, el.rank, rankHead, ...inscs, ...evals];
    const saved = moved.map((n) => n.style.transform);
    moved.forEach((n) => (n.style.transform = "none"));
    const base = stage.getBoundingClientRect();
    home.insc = inscs.map((n) => relRect(n, base));
    home.evals = evals.map((n) => relRect(n, base));
    home.dock = relRect(el.dock, base);
    home.profile = relRect(el.profile, base);
    home.btn = relRect(el.btn, base);
    moved.forEach((n, i) => (n.style.transform = saved[i]));
    core?.resize(W, H);
  }

  const T = (n, x = 0, y = 0, s = 1, r = 0) => (n.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`);
  const O = (n, o) => {
    n.style.opacity = o.toFixed(3);
    n.style.visibility = o < 0.002 ? "hidden" : "visible";
  };

  // posições-chave do núcleo ao longo do capítulo
  function corePose(p) {
    const intro = { x: W / 2, y: H * (mobile ? 0.62 : 0.64), r: R * 1.12 };
    const aluno = { x: W / 2, y: H * (mobile ? 0.34 : 0.56), r: R * (mobile ? 0.85 : 1) };
    const orient = { x: W / 2, y: H * (mobile ? 0.46 : 0.57), r: R };
    const dock = { x: home.dock.x, y: home.dock.y, r: home.dock.w / 2 };
    const keys = [[0, intro], [0.06, intro], [0.14, aluno], [0.46, aluno], [0.54, orient], [0.8, orient], [0.875, dock], [1, dock]];
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
    const [pa, a] = keys[i];
    const [pb, b] = keys[i + 1];
    const k = eio(seg(p, pa, pb));
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), r: lerp(a.r, b.r, k) };
  }

  let reveal = 0;
  let P = 0;
  const stepAt = [0.245, 0.29, 0.335];
  let stepState = "";

  function apply(p, t) {
    const pose = corePose(p);
    const sources = [];

    /* intro */
    const io = seg(p, 0.05, 0.11);
    O(el.intro, 1 - io);
    T(el.intro, 0, -50 * eio(io));

    /* ato 1: aluno */
    const aIn = eo(seg(p, 0.1, 0.16));
    const aOut = eio(seg(p, 0.47, 0.51));
    O(el.actA, aIn * (1 - aOut));
    T(el.actA, 0, 24 * (1 - aIn) - 24 * aOut);

    const pIn = eo(seg(p, 0.11, 0.18));
    const pOut = eio(seg(p, mobile ? 0.215 : 0.47, mobile ? 0.235 : 0.51));
    const offL = home.profile.x + home.profile.w / 2 + 60;
    O(el.profile, pIn * (1 - pOut));
    T(el.profile, -offL * (1 - pIn) - offL * pOut, 0, 1, -6 * (1 - pIn));

    // cursor vai até o botão e clica
    const ptr = eio(seg(p, 0.165, 0.2));
    const click = bell(p, 0.198, 0.214);
    const bx = home.btn.x - home.profile.x + home.profile.w / 2;
    const by = home.btn.y - home.profile.y + home.profile.h / 2;
    O(el.pointer, seg(p, 0.165, 0.175) * (1 - seg(p, 0.225, 0.24)));
    T(el.pointer, lerp(bx + 140, bx + 6, ptr), lerp(by + 110, by + 4, ptr), 1 - 0.18 * click);
    T(el.btn, 0, 0, 1 - 0.05 * click);
    el.btn.classList.toggle("is-on", p > 0.205 && p < 0.37);

    const lIn = eo(seg(p, 0.205, 0.235));
    const lOut = eio(seg(p, 0.355, 0.375));
    O(el.loading, lIn * (1 - lOut));
    T(el.loading, mobile ? 0 : 80 * (1 - lIn), mobile ? 40 * (1 - lIn) : 0, 0.97 + 0.03 * lIn);
    const st = stepAt.map((a, i) => (p >= a ? "c" : i === 0 || p >= stepAt[i - 1] ? "a" : "p")).join("");
    if (st !== stepState) {
      stepState = st;
      steps.forEach((s, i) => (s.dataset.state = st[i]));
    }

    const rIn = eo(seg(p, 0.365, 0.395));
    O(el.recs, rIn * (1 - aOut));
    T(el.recs, (mobile ? 0 : 60 * (1 - rIn)) + (mobile ? 0 : 90 * aOut), mobile ? 40 * (1 - rIn) : 0, 0.97 + 0.03 * rIn);
    recItems.forEach((n, i) => {
      const e = eo(seg(p, 0.378 + i * 0.016, 0.41 + i * 0.016));
      O(n, e);
      T(n, -(mobile ? 0 : 140) * (1 - e), mobile ? 30 * (1 - e) : 0, 0.92 + 0.08 * e);
    });

    // fluxo do perfil para o núcleo durante a análise
    const fa = bell(p, 0.205, 0.35);
    if (fa > 0) {
      sources.push(mobile
        ? { x: W / 2, y: home.profile.y - home.profile.h / 2, a: fa }
        : { x: home.profile.x + home.profile.w / 2, y: home.profile.y, a: fa });
    }

    /* ato 2: orientador */
    const bIn = eo(seg(p, 0.51, 0.56));
    const bOut = eio(seg(p, 0.79, 0.83));
    O(el.actB, bIn * (1 - bOut));
    T(el.actB, 0, 24 * (1 - bIn) - 24 * bOut);

    const base = phone ? 0.66 : mobile ? 0.86 : 1;
    O(el.inbox, p > 0.52 && p < 0.8 ? 1 : 0);
    inscs.forEach((n, i) => {
      const h = home.insc[i];
      const s0 = 0.535 + i * 0.008;
      const enter = eo(seg(p, s0, s0 + 0.05));
      const c0 = 0.62 + i * 0.011;
      const conv = seg(p, c0, c0 + 0.05);
      const ce = eio(conv);
      const rot = parseFloat(n.style.getPropertyValue("--rot")) || SPOTS[i][2];
      // entra pela borda mais próxima, depois curva até o núcleo
      const dx = h.x - W / 2;
      const dy = h.y - H / 2;
      const dl = Math.hypot(dx, dy) || 1;
      const off = Math.max(W, H) * 0.55;
      let x = (dx / dl) * off * (1 - enter);
      let y = (dy / dl) * off * (1 - enter);
      const tx = pose.x - h.x;
      const ty = pose.y - h.y;
      const bend = Math.sin(Math.PI * ce) * 70;
      x += tx * ce + (-ty / (Math.hypot(tx, ty) || 1)) * bend;
      y += ty * ce + (tx / (Math.hypot(tx, ty) || 1)) * bend;
      const s = base * lerp(1, 0.14, Math.pow(ce, 1.3));
      O(n, enter * (1 - seg(conv, 0.72, 0.96)));
      T(n, x, y, s, rot * (1 + (1 - enter) * 1.5) * (1 - ce) + 40 * ce * Math.sign(rot));
      if (conv > 0.05 && conv < 0.85) sources.push({ x: h.x + x, y: h.y + y, a: Math.sin(Math.PI * conv) * 0.8 });
    });

    // ranking: cabeçalho, cartões saem do núcleo e ocupam a grade
    const hIn = eo(seg(p, 0.8, 0.84));
    O(el.rank, hIn > 0 ? 1 : 0);
    O(rankHead, hIn);
    T(rankHead, 0, 16 * (1 - hIn));
    O(rankNote, eo(seg(p, 0.9, 0.93)));
    evals.forEach((n, j) => {
      const h = home.evals[j];
      const a = 0.812 + j * 0.008;
      const e = eo(seg(p, a, a + 0.036));
      O(n, seg(e, 0, 0.35));
      T(n, (pose.x - h.x) * (1 - e), (pose.y - h.y) * (1 - e), 0.18 + 0.82 * e);
      const v = eo(seg(p, a + 0.012, a + 0.05));
      const s = scores[j];
      const alvo = parseFloat(s.dataset.score);
      const txt = fmt(alvo * v);
      if (s.textContent !== txt) s.textContent = txt;
      barSets[j].forEach((b) => (b.style.transform = `scaleX(${v.toFixed(3)})`));
    });

    /* núcleo */
    const process = Math.max(bell(p, 0.6, 0.83) * Math.min(1, 1.6 * bell(p, 0.6, 0.83)), 0.35 * bell(p, 0.205, 0.36));
    if (core) {
      const s = core.state;
      const ig = eo(reveal);
      s.x = pose.x;
      s.y = pose.y;
      // processamento só acende e cresce de leve (preso à rolagem); a forma não agita
      s.r = pose.r * (0.55 + 0.45 * ig) * (1 + 0.06 * process);
      s.process = process;
      s.amp = 0.03;
      const docked = seg(p, 0.84, 0.88);
      s.glow = (0.45 + 0.55 * process) * ig * (1 - 0.45 * docked);
      s.opacity = 0.25 + 0.75 * ig;
      drops(p, t, docked);
      core.render(t, sources);
    } else {
      fallback.style.transform = `translate3d(${pose.x}px,${pose.y}px,0) translate(-50%,-50%) scale(${(pose.r / 100).toFixed(3)})`;
    }
  }

  // gotas: duas orbitando sempre; projetos no ato 1; inscrições absorvidas no ato 2
  function drops(p, t, docked) {
    const D = core.drops;
    const proj = seg(p, 0.215, 0.25) * (1 - seg(p, 0.4, 0.43));
    const idle = (1 - proj) * (1 - docked);
    for (let i = 0; i < 2; i++) {
      const a = t * (0.42 + i * 0.17) + i * 2.6;
      const d = 1.05 + 0.48 * (0.5 + 0.5 * Math.sin(t * 0.55 + i * 1.9));
      D[i].set(Math.cos(a) * d, Math.sin(a) * d * 0.7, Math.sin(a) * 0.5, (0.17 + 0.05 * i) * idle);
    }
    const pick = seg(p, 0.33, 0.36);
    const eject = eio(seg(p, 0.362, 0.41));
    for (let i = 0; i < 6; i++) {
      const slot = D[i + 2];
      const chosen = i % 2 === 0;
      const a = t * (0.55 + 0.6 * bell(p, 0.25, 0.36)) + (i / 6) * Math.PI * 2;
      const d = 1.75 + 0.22 * Math.sin(i * 1.7 + t * 0.4);
      let x = Math.cos(a) * d;
      let y = Math.sin(a) * d * 0.38;
      let z = Math.sin(a) * d * 0.7;
      let r = 0.13 * proj * (chosen ? 1 + 0.55 * pick : 1 - pick);
      if (chosen && eject > 0) {
        // os três escolhidos saem em direção às recomendações
        const ex = mobile ? 0 : 2.45;
        const ey = mobile ? -2.4 : (i - 2) * 0.32;
        x = lerp(x, ex, eject);
        y = lerp(y, ey, eject);
        z = lerp(z, 0, eject);
        r *= 1 - eject;
      }
      slot.set(x, y, z, r);
    }
    if (p > 0.6) {
      for (let i = 2; i < 8; i++) D[i].w = 0;
      inscs.forEach((n, i) => {
        const c0 = 0.62 + i * 0.011;
        const k = seg(p, c0 + 0.036, c0 + 0.066);
        if (k <= 0 || k >= 1) return;
        const h = home.insc[i];
        const ang = Math.atan2(-(h.y - core.state.y), h.x - core.state.x);
        const d = lerp(1.85, 0.2, eio(k));
        D[2 + (i % 6)].set(Math.cos(ang) * d, Math.sin(ang) * d, 0.1, 0.28 * (1 - k * 0.6));
      });
    }
  }

  // progresso exato da rolagem (scrub sem atraso) e laço só quando visível
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (s) => (P = s.progress),
    onRefresh: (s) => {
      P = s.progress;
      layout();
    },
  });
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "200px" }).observe(section);
  new ResizeObserver(layout).observe(stage);

  stage.addEventListener("pointermove", (e) => {
    if (!core) return;
    const b = stage.getBoundingClientRect();
    core.pointer.x = e.clientX - b.left;
    core.pointer.y = e.clientY - b.top;
    core.pointer.on = 1;
  }, { passive: true });
  stage.addEventListener("pointerleave", () => core && (core.pointer.on = 0));

  let time = 0;
  gsap.ticker.add((_, dt) => {
    if (!visible) return;
    time += Math.min(dt, 50) / 1000;
    apply(P, time);
  });

  import("./core.js").then(({ createCore }) => {
    core = createCore(canvas, { mobile: phoneMQ.matches });
    if (!core) section.classList.add("no-webgl");
    layout();
  });
  layout();

  return { reveal: (v) => (reveal = v) };
}
