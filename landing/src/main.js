import "@fontsource-variable/outfit";
import "@fontsource-variable/jetbrains-mono";
import "./style.css";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hydrateIcons } from "./icons.js";
import { buildLabels } from "./scenes/atom.js";
import { createAtom } from "./scenes/atom.js";
import { createNetwork } from "./scenes/network.js";
import { createLumen } from "./scenes/lumen.js";
import { initMotion } from "./motion.js";

function boot() {
  // seções fixadas e reveals dependem de começar do topo
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const labels = buildLabels(document.querySelector("[data-core-labels]"));
  hydrateIcons();

  const network = createNetwork(document.getElementById("hero-canvas"));
  const atom = createAtom(document.getElementById("core-canvas"), labels);
  const lumen = createLumen(document.getElementById("lumen-canvas"));

  initMotion({ network, atom, lumen });
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

try {
  boot();
} catch (err) {
  // sem JS funcional a página precisa continuar legível
  console.error(err);
  document.documentElement.classList.remove("js");
}
