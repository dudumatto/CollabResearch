// Sequência de quadros WebP desenhada num <canvas> 2D, com "cover".
// setProgress(0..1) escolhe o quadro; o desenho acontece no próximo rAF.
// focusX: onde ancorar o corte horizontal (o celular termina em ~81% da largura do vídeo).
const SETS = {
  desktop: { dir: "desktop", count: 120, focusX: 0.75 },
  mobile: { dir: "mobile", count: 72, focusX: 0.5 },
};

export function createFrames(canvas, { portrait }) {
  const { dir, count, focusX } = portrait ? SETS.mobile : SETS.desktop;
  const url = (i) => `${import.meta.env.BASE_URL}frames/${dir}/f${String(i + 1).padStart(3, "0")}.webp`;
  const imgs = new Array(count);
  const ctx = canvas.getContext("2d", { alpha: false });
  let target = 0;
  let drawn = -1;
  let raf = 0;
  let loading = false;

  function load(i) {
    if (imgs[i]) return Promise.resolve();
    const img = new Image();
    img.decoding = "async";
    img.src = url(i);
    return img.decode().then(
      () => {
        imgs[i] = img;
        schedule(); // draw() ignora se o quadro mais próximo não mudou
      },
      () => {},
    );
  }

  function nearest() {
    for (let d = 0; d < count; d++) {
      if (imgs[target - d]) return target - d;
      if (imgs[target + d]) return target + d;
    }
    return -1;
  }

  function draw() {
    raf = 0;
    const i = nearest();
    if (i < 0) return;
    if (i === drawn && canvas.dataset.size === `${canvas.width}x${canvas.height}`) return;
    const img = imgs[i];
    const cw = canvas.width;
    const ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) * focusX, (ch - h) / 2, w, h);
    drawn = i;
    canvas.dataset.size = `${cw}x${ch}`;
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    drawn = -1;
    schedule();
  }

  // Carga progressiva: primeiro 1 de cada 8 (cobertura grossa), depois o resto.
  async function loadAll() {
    if (loading) return;
    loading = true;
    const order = [];
    for (let step of [8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
    }
    const queue = order.values();
    const worker = async () => {
      for (const i of queue) await load(i);
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  return {
    count,
    loadAll,
    setProgress(p) {
      target = Math.round(Math.min(Math.max(p, 0), 1) * (count - 1));
      schedule();
    },
    // Movimento reduzido: um único quadro, sem scrub.
    showPoster(p) {
      target = Math.round(p * (count - 1));
      load(target).then(schedule);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
