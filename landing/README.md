# CollabResearch Landing

Landing page interativa (GSAP + ScrollTrigger + Three.js + Lenis). Vite, JS puro.

```bash
npm install
npm run dev      # http://127.0.0.1:5190
npm run build    # saída em dist/
```

- `src/scenes/network.js`: rede de pesquisadores (hero)
- `src/scenes/atom.js`: átomo/núcleo que conecta Pesquisa, Equipe, Cronograma, Resultados e Projetos
- `src/scenes/lumen.js`: esfera de análise da Lumen IA
- `src/motion.js`: animações GSAP/ScrollTrigger (texto que se preenche, odômetro, cursor, pilha de cartões, linha do tempo)
- `src/modules.js`: conteúdo dos 5 módulos
- Respeita `prefers-reduced-motion` e faz fallback sem WebGL.
