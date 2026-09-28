import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/index.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.error("Falha ao registrar o service worker:", error);
    });
  });
}

createRoot(document.getElementById("root")).render(<App />);
