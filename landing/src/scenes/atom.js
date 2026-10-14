import { THREE, COLORS, mountScene, halo, pointer, damp, lerp } from "./shared.js";
import { MODULES } from "../modules.js";

/**
 * Núcleo: um átomo cujos 5 elétrons são os módulos da plataforma.
 * Cada elétron fica ligado ao núcleo por uma conexão; o módulo ativo acende.
 */
export function createAtom(canvas, labelEls) {
  return mountScene(canvas, ({ scene, camera, size }) => {
    const root = new THREE.Group();
    scene.add(root);

    // ---- núcleo: aglomerado de esferas (prótons/nêutrons) + halo
    const nucleus = new THREE.Group();
    root.add(nucleus);
    const palette = [COLORS.accent, COLORS.deep, COLORS.mint];
    const sg = new THREE.SphereGeometry(0.24, 24, 24);
    const K = 16;
    for (let i = 0; i < K; i++) {
      const y = 1 - (i / (K - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      const m = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({
        color: palette[i % 3], emissive: palette[i % 3], emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.15,
      }));
      m.position.set(Math.cos(th) * r * 0.5, y * 0.5, Math.sin(th) * r * 0.5);
      nucleus.add(m);
    }
    const core = halo(COLORS.accent, 4.2, 0.55);
    root.add(core);
    root.add(halo(COLORS.deep, 8, 0.4));

    // ---- órbitas: mesmo "tamanho" com inclinações diferentes, como no modelo clássico
    const defs = [
      { r: 3.2, tilt: [1.2, 0.1, 0.0], speed: 0.55, phase: 0.0 },
      { r: 3.6, tilt: [0.3, 1.0, 0.4], speed: -0.46, phase: 1.3 },
      { r: 3.9, tilt: [-0.9, 0.5, 1.0], speed: 0.4, phase: 2.5 },
      { r: 3.4, tilt: [0.7, -0.9, -0.3], speed: -0.5, phase: 3.9 },
      { r: 4.2, tilt: [-0.4, -0.3, 0.9], speed: 0.36, phase: 5.1 },
    ];
    const SEG = 180;
    const orbits = defs.map((d, i) => {
      const g = new THREE.Group();
      g.rotation.set(...d.tilt);
      root.add(g);

      const pts = [];
      for (let s = 0; s < SEG; s++) {
        const a = (s / SEG) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * d.r, Math.sin(a) * d.r, 0));
      }
      const ringMat = new THREE.LineBasicMaterial({ color: COLORS.accent, transparent: true, opacity: 0.16 });
      g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat));

      const eMat = new THREE.MeshStandardMaterial({ color: COLORS.mint, emissive: COLORS.accent, emissiveIntensity: 0.9, roughness: 0.3 });
      const electron = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), eMat);
      const eHalo = halo(COLORS.accent, 1.1, 0.7);
      electron.add(eHalo);
      g.add(electron);

      // conexão núcleo → elétron (2 vértices atualizados por quadro)
      const lGeo = new THREE.BufferGeometry();
      lGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const lMat = new THREE.LineBasicMaterial({ color: COLORS.accent, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
      g.add(new THREE.Line(lGeo, lMat));

      // pacote de dados correndo pela conexão
      const packet = halo(COLORS.mint, 0.5, 0.9);
      g.add(packet);

      return { d, g, ringMat, electron, eHalo, lGeo, lMat, packet, k: 0, a: d.phase, world: new THREE.Vector3(), i };
    });

    const state = { active: 0, progress: 0 };
    const tmp = new THREE.Vector3();
    const look = new THREE.Vector3();
    let ry = 0, rx = 0;

    const labels = labelEls.map((el, i) => ({ el, i }));

    const widths = [];
    document.fonts?.ready.then(() => labels.forEach(({ el, i }) => { widths[i] = el.offsetWidth; }));
    return {
      state,
      resize(w, h) {
        // palco estreito (mobile): afasta a câmera para caber a órbita maior
        camera.position.z = Math.max(12.5, 14 / (w / h));
        labels.forEach(({ el, i }) => { widths[i] = el.offsetWidth; });
      },
      update(t, dt) {
        root.updateMatrixWorld(true);
        core.material.opacity = 0.5 + Math.sin(t * 2) * 0.08;
        nucleus.rotation.y += dt * 0.4;
        nucleus.rotation.x += dt * 0.2;

        orbits.forEach((o) => {
          const on = state.active === o.i ? 1 : 0;
          o.k = damp(o.k, on, 6, dt);
          o.a += dt * o.d.speed * (1 - o.k * 0.6);
          const x = Math.cos(o.a) * o.d.r;
          const y = Math.sin(o.a) * o.d.r;
          o.electron.position.set(x, y, 0);
          o.electron.scale.setScalar(1 + o.k * 0.55);
          o.eHalo.material.opacity = 0.55 + o.k * 0.45;
          o.eHalo.scale.setScalar(1.1 + o.k * 1.1);
          o.electron.material.emissiveIntensity = 0.7 + o.k * 1.2;
          o.ringMat.opacity = 0.14 + o.k * 0.7;
          o.lMat.opacity = 0.1 + o.k * 0.8;
          const arr = o.lGeo.attributes.position.array;
          arr[3] = x; arr[4] = y; arr[5] = 0;
          o.lGeo.attributes.position.needsUpdate = true;
          const pt = (t * (0.35 + o.k * 0.5) + o.i * 0.37) % 1;
          o.packet.position.set(x * pt, y * pt, 0);
          o.packet.material.opacity = (0.35 + o.k * 0.65) * Math.sin(pt * Math.PI);
          o.electron.getWorldPosition(o.world);
        });

        // câmera: rotação guiada pelo scroll + parallax do ponteiro + leve atração pelo módulo ativo
        ry = damp(ry, state.progress * Math.PI * 1.1 + pointer.x * 0.35, 2.5, dt);
        rx = damp(rx, pointer.y * 0.2 + 0.15, 2.5, dt);
        root.rotation.set(rx, ry, 0);
        const act = orbits[state.active];
        if (act) {
          tmp.copy(act.world).multiplyScalar(0.12);
          look.x = damp(look.x, tmp.x, 3, dt);
          look.y = damp(look.y, tmp.y, 3, dt);
        }
        camera.position.x = look.x;
        camera.position.y = look.y;
        camera.lookAt(0, 0, 0);

        // rótulos HTML projetados
        labels.forEach(({ el, i }) => {
          const o = orbits[i];
          tmp.copy(o.world).project(camera);
          const x = (tmp.x * 0.5 + 0.5) * size.w;
          const y = (-tmp.y * 0.5 + 0.5) * size.h;
          const behind = o.world.z < -0.5;
          const lw = widths[i] || 110;
          const left = x + 16 + lw > size.w - 6 ? x - 16 - lw : x + 16; // vira para a esquerda perto da borda
          el.style.transform = `translate(${Math.max(6, left)}px, ${y - 16}px)`;
          el.style.opacity = String(o.k > 0.5 ? 1 : behind ? 0.28 : 0.75);
        });
      },
    };
  }, { fov: 40, z: 12.5, lights: true });
}

export function buildLabels(container, ICONS) {
  return MODULES.map((m) => {
    const el = document.createElement("span");
    el.className = "core__label";
    el.innerHTML = `<span data-icon="${m.icon}"></span>${m.name}`;
    container.appendChild(el);
    return el;
  });
}
