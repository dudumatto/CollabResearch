import { THREE, COLORS, mountScene, glowTexture, halo, pointer, damp } from "./shared.js";

/** Lumen: esfera de análise com anel de varredura e satélites (projetos ou candidatos). */
export function createLumen(canvas) {
  return mountScene(canvas, ({ scene }) => {
    const root = new THREE.Group();
    scene.add(root);

    const ico = new THREE.IcosahedronGeometry(2, 3);
    root.add(new THREE.Points(ico, new THREE.PointsMaterial({
      size: 0.08, map: glowTexture(), color: COLORS.accent, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })));
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(2, 2), new THREE.MeshBasicMaterial({
      color: COLORS.accent, wireframe: true, transparent: true, opacity: 0.1,
    }));
    root.add(wire);
    root.add(halo(COLORS.deep, 7, 0.55));
    root.add(halo(COLORS.accent, 2.2, 0.5));

    // casca externa de partículas
    const M = 380;
    const sp = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = 2.9 + Math.random() * 0.5;
      sp.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const shell = new THREE.Points(sg, new THREE.PointsMaterial({
      size: 0.05, map: glowTexture(), color: COLORS.mint, transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    root.add(shell);

    // anel de varredura
    const scan = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.014, 8, 160), new THREE.MeshBasicMaterial({
      color: COLORS.mint, transparent: true, opacity: 0.85,
    }));
    scan.rotation.x = Math.PI / 2;
    root.add(scan);

    // satélites: 3 projetos (aluno) ou 5 candidatos (orientador)
    const sats = Array.from({ length: 5 }, (_, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 20), new THREE.MeshBasicMaterial({ color: COLORS.mint }));
      m.add(halo(COLORS.accent, 0.9, 0.8));
      root.add(m);
      return { m, a: (i / 5) * Math.PI * 2, tilt: i * 0.55, r: 3.3 + (i % 2) * 0.35, v: 0 };
    });

    const state = { mode: "aluno", pulse: 0, count: 3, speed: 0.5 };
    let rx = 0, ry = 0, pulse = 0, vis = 1;

    return {
      state,
      setMode(mode) {
        state.mode = mode;
        state.count = mode === "aluno" ? 3 : 5;
        state.speed = mode === "aluno" ? 0.5 : 0.75;
        pulse = 1;
      },
      update(t, dt) {
        pulse = damp(pulse, 0, 2.2, dt);
        scan.position.y = Math.sin(t * 0.9) * 2.1;
        const k = 1 - Math.abs(scan.position.y) / 2.5;
        scan.scale.setScalar(Math.max(0.15, Math.sqrt(Math.max(0, 1 - (scan.position.y / 2.25) ** 2))) * 1.0);
        scan.material.opacity = 0.35 + k * 0.5 + pulse * 0.4;

        sats.forEach((s, i) => {
          const on = i < state.count ? 1 : 0;
          s.v = damp(s.v, on, 5, dt);
          s.a += dt * state.speed * (0.7 + i * 0.12);
          s.m.position.set(Math.cos(s.a) * s.r, Math.sin(s.a * 0.9 + s.tilt) * 1.3, Math.sin(s.a) * s.r);
          s.m.scale.setScalar(Math.max(0.001, s.v) * (1 + pulse * 0.6));
        });

        wire.rotation.y += dt * 0.15;
        shell.rotation.y -= dt * 0.05;
        ry = damp(ry, pointer.x * 0.5 + t * 0.1, 3, dt);
        rx = damp(rx, pointer.y * 0.3, 3, dt);
        root.rotation.set(rx + 0.2, ry, 0);
        root.scale.setScalar(1 + pulse * 0.05);
      },
    };
  }, { fov: 42, z: 10.8 });
}
