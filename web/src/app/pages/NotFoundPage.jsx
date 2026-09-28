import { useEffect, useRef, useState } from "react";
import "./NotFoundPage.css";

const verbs = [
  "revendo a literatura",
  "conferindo as referências",
  "consultando o Lattes",
  "recalculando a hipótese",
  "perguntando ao orientador",
];

function NetworkCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let width = 0;
    let height = 0;
    let nodes = [];
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = Array.from(
        { length: Math.min(90, Math.floor((width * height) / 17000)) },
        () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1 + Math.random() * 1.4,
        }),
      );
    }

    function onPointerMove(event) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 100) {
          node.x += (dx / (distance || 1)) * 0.7;
          node.y += (dy / (distance || 1)) * 0.7;
        }
      }
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 95) {
            ctx.strokeStyle = `rgba(29,122,79,${(1 - distance / 95) * 0.13})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const node of nodes) {
        ctx.fillStyle = "rgba(29,122,79,.28)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas id="net" aria-hidden="true" ref={canvasRef} />;
}

export default function NotFoundPage() {
  const revealRef = useRef(null);
  const [verbIndex, setVerbIndex] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const page = revealRef.current?.parentElement;
    if (!page) return undefined;

    function onPointerMove(event) {
      if (event.pointerType !== "mouse") return;
      const bounds = page.getBoundingClientRect();
      page.style.setProperty("--reveal-x", `${event.clientX - bounds.left}px`);
      page.style.setProperty("--reveal-y", `${event.clientY - bounds.top}px`);
      revealRef.current?.classList.add("is-active");
    }

    function onPointerLeave() {
      revealRef.current?.classList.remove("is-active");
    }

    page.addEventListener("pointermove", onPointerMove);
    page.addEventListener("pointerleave", onPointerLeave);
    return () => {
      page.removeEventListener("pointermove", onPointerMove);
      page.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  useEffect(() => {
    const verbTimer = window.setInterval(
      () => setVerbIndex((index) => (index + 1) % verbs.length),
      2500,
    );
    const dotsTimer = window.setInterval(
      () => setDots((count) => (count % 4) + 1),
      400,
    );
    function onKeyDown(event) {
      if (event.key.toLowerCase() === "h" && !event.ctrlKey && !event.metaKey) {
        window.location.href = "/";
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearInterval(verbTimer);
      window.clearInterval(dotsTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="not-found-page">
      <NetworkCanvas />
      <div className="cursor-reveal" aria-hidden="true" ref={revealRef} />
      <div className="noise" aria-hidden="true" />
      <nav>
        <a className="logo" href="/" aria-label="CollabResearch">
          <img src="/brand/logo-full.svg" width="101" height="24" alt="CollabResearch" />
        </a>
        <div className="navlinks">
          <a href="/#problema">Problema</a>
          <a href="/#solucao">Solução</a>
          <a href="/#funcionalidades">Funcionalidades</a>
          <a href="/#como-funciona">Como Funciona</a>
        </div>
        <div className="nav-actions">
          <a href="/login">Entrar</a>
          <a className="btn" href="/register">Criar conta</a>
        </div>
      </nav>
      <div className="chip one"><span className="chipicon">✓</span><span>Inscrição aprovada<small>Projeto NLP · agora</small></span></div>
      <div className="chip two"><span className="chipicon">◔</span><span>Projeto NLP<small><span className="bar"><i /></span></small></span></div>
      <div className="chip three"><span className="chipicon">▢</span><span>Nova mensagem<small>Prof. Ana Carolina</small></span></div>
      <div className="chip four"><span className="chipicon">⌕</span><span>Pesquisando a rota<small>Resultado: não encontrado</small></span></div>
      <main>
        <span className="status"><i className="pulse" />Erro 404 · página não encontrada</span>
        <div className="codewrap"><div className="ghost" aria-hidden="true">404</div><div className="code">4<span className="zero">0</span>4</div></div>
        <h1>Esta página não foi <em>encontrada.</em></h1>
        <p className="sub">A página que você procura não existe, foi movida ou ficou presa na fila de revisão. Nenhum dado foi perdido; só a rota.</p>
        <p className="search"><strong>{verbs[verbIndex]}</strong><span>{".".repeat(dots)}</span></p>
        <div className="actions"><a className="btn" href="/">Voltar ao início <span aria-hidden="true">→</span></a><a className="btn secondary" href="/">Conhecer o CollabResearch</a></div>
        <p className="hint">atalho: pressione <kbd>H</kbd> para voltar ao início</p>
      </main>
      <footer><div className="left"><span>© 2026 CollabResearch</span><span className="muted">Feito para alunos, orientadores e instituições.</span></div><div className="links"><a href="/">Início</a><a href="/#funcionalidades">Funcionalidades</a><a href="mailto:contato@collabresearch.com">Contato</a></div></footer>
    </div>
  );
}
