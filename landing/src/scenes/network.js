import { THREE, COLORS, mountScene, glowTexture, halo, pointer, damp } from "./shared.js";

/** Hero: rede de pesquisadores (alunos e orientadores) com pulsos viajando pelas conexões. */
export function createNetwork(canvas) {
  return mountScene(canvas, ({ scene, camera }) => {
    const group = new THREE.Group();
    scene.add(group);

    // nós em casca esférica irregular
    const N = 170;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const nodes = [];
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = 2.2 + Math.random() * 1.5;
      const s = Math.sqrt(1 - u * u);
      const p = new THREE.Vector3(Math.cos(a) * s * r, u * r, Math.sin(a) * s * r);
      nodes.push(p);
      p.toArray(pos, i * 3);
      const c = Math.random() < 0.22 ? COLORS.mint : COLORS.accent; // mais claros = orientadores
      c.toArray(col, i * 3);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    group.add(new THREE.Points(pg, new THREE.PointsMaterial({
      size: 0.2, map: glowTexture(), vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })));

    // arestas entre vizinhos próximos
    const edges = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 1.25) edges.push([i, j]);
      }
    }
    const lp = new Float32Array(edges.length * 6);
    edges.forEach(([i, j], k) => {
      nodes[i].toArray(lp, k * 6);
      nodes[j].toArray(lp, k * 6 + 3);
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    group.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
      color: COLORS.accent, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // núcleo: halo + icosaedro em arame
    group.add(halo(COLORS.deep, 4.6, 0.85));
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.6, 1),
      new THREE.MeshBasicMaterial({ color: COLORS.accent, wireframe: true, transparent: true, opacity: 0.7 }),
    );
    group.add(ico);
    group.add(halo(COLORS.accent, 1.5, 0.9));

    // pulsos: pontos que correm pelas arestas
    const P = 26;
    const pulses = Array.from({ length: P }, () => ({
      e: edges[(Math.random() * edges.length) | 0], t: Math.random(), v: 0.35 + Math.random() * 0.6,
    }));
    const pp = new Float32Array(P * 3);
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    group.add(new THREE.Points(pgeo, new THREE.PointsMaterial({
      size: 0.34, map: glowTexture(), color: COLORS.mint, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })));

    const state = { scroll: 0, offsetX: 0 };
    const v = new THREE.Vector3();
    let rx = 0, ry = 0, ox = 0;

    return {
      state,
      resize(w, h) {
        const aspect = w / h;
        const halfW = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * aspect;
        state.offsetX = aspect > 1.1 ? halfW * 0.42 : 0;
        group.scale.setScalar(aspect > 1.1 ? 1 : 0.8);
      },
      update(t, dt) {
        pulses.forEach((p, i) => {
          p.t += dt * p.v;
          if (p.t > 1) { p.e = edges[(Math.random() * edges.length) | 0]; p.t = 0; }
          v.lerpVectors(nodes[p.e[0]], nodes[p.e[1]], p.t);
          v.toArray(pp, i * 3);
        });
        pgeo.attributes.position.needsUpdate = true;

        ico.rotation.x += dt * 0.5;
        ico.rotation.y += dt * 0.7;
        ico.scale.setScalar(1 + Math.sin(t * 1.6) * 0.06);

        ry = damp(ry, pointer.x * 0.5 + t * 0.12 + state.scroll * 1.4, 3, dt);
        rx = damp(rx, pointer.y * 0.25 + Math.sin(t * 0.2) * 0.1, 3, dt);
        ox = damp(ox, state.offsetX, 4, dt);
        group.rotation.set(rx, ry, state.scroll * 0.4);
        group.position.x = ox;
      },
    };
  }, { fov: 45, z: 9 });
}
